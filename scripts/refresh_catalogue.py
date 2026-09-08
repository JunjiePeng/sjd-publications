#!/usr/bin/env python3
"""Build a complete, public metadata snapshot. Python standard library only.

Every source must paginate to its reported count before any snapshot is replaced.
Abstracts are used transiently for discovery labels; they are not redistributed.
"""
import argparse
from collections import Counter
from datetime import date, datetime, timezone
import hashlib
import gzip
import html
import json
from pathlib import Path
import re
import shutil
import tempfile
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/data"
PUBMED_QUERY = '("Sjogren\'s Syndrome"[MeSH Terms] OR Sjogren*[Title/Abstract] OR Sjögren*[Title/Abstract] OR Sjøgren*[Title/Abstract] OR Sjoegren*[Title/Abstract] OR Sjogren*[Other Term] OR Sjögren*[Other Term] OR Sjøgren*[Other Term] OR Sjoegren*[Other Term])'
EPMC_QUERY = '(TITLE_ABS:Sjogren* OR TITLE_ABS:Sjögren* OR TITLE_ABS:Sjøgren* OR TITLE_ABS:Sjoegren* OR MESH_HEADING:"Sjogren\'s Syndrome") AND (SRC:MED OR SRC:PMC OR SRC:PPR)'
TRIAL_QUERY = ' OR '.join(variant + ending for variant in ['Sjogren', 'Sjögren', 'Sjøgren', 'Sjoegren'] for ending in ['', "'s", 's', '’s'])
USER_AGENT = 'SjDResearchCatalogue/1.0 (https://github.com/JunjiePeng/sjd-publications)'
METHODS = {
    'Genomics / genetics': r'\b(genom\w*|genetic\w*|gwas|snp\w*|polymorphism\w*|whole.exome|exome.sequenc\w*)\b',
    'Transcriptomics': r'\b(transcriptom\w*|rna.seq\w*|rnaseq|scrna\w*|snrna\w*|gene.expression.profil\w*|microarray\w*)\b',
    'Single-cell': r'\b(single.cell\w*|single.nucle\w*|scrna\w*|snrna\w*|scatac\w*|cite.seq)\b',
    'Spatial omics': r'\b(spatial.{0,25}(transcriptom\w*|proteom\w*|omics|profil\w*|rna)|visium|seqfish|merfish)\b',
    'Proteomics': r'\b(proteom\w*|mass.spectrom\w*|olink|somascan)\b',
    'Metabolomics': r'\b(metabolom\w*|metabonom\w*)\b',
    'Epigenomics': r'\b(epigen\w*|dna.methyl\w*|chromatin.access\w*|atac.seq\w*|chip.seq\w*|bisulfite.sequenc\w*)\b',
    'Microbiome / metagenomics': r'\b(microbiom\w*|microbiota|metagenom\w*|16s.rrna|16s.ribosomal)\b',
    'Multi-omics': r'\b(multi.?omic\w*|integrat\w*.omic\w*|pan.?omic\w*)\b',
    'Lipidomics': r'\blipidom\w*\b',
    'Glycomics': r'\b(glycom\w*|glycoproteom\w*)\b',
    'Immune repertoire': r'\b(repertoire|tcr.seq\w*|bcr.seq\w*|immunosequenc\w*)\b',
}
STUDY_PATTERNS = {
    'Observational / epidemiology': r'\b(cohort\w*|case.control|cross.sectional|longitudinal|epidemiolog\w*|observational|retrospective|prospective)\b',
    'Case report / series': r'\b(case reports?|case series|report of (a|one|two|three|four) cases?)\b',
    'Qualitative / patient experience': r'\b(qualitative|interview\w*|focus.groups?|patient.experience\w*|lived.experience\w*)\b',
    'Methods / validation': r'\b(validation|methodolog\w*|diagnostic.accuracy|classification.criteria)\b',
    'Preclinical / laboratory': r'\b(mice|mouse|murine|animal.models?|in.vitro|cell.cultur\w*|organoid\w*)\b',
}


def normalize(value):
    value = html.unescape(re.sub(r'<[^>]*>', ' ', value or ''))
    value = value.replace('ø', 'o').replace('Ø', 'O')
    return ''.join(c for c in unicodedata.normalize('NFKD', value) if not unicodedata.combining(c)).lower()


def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]*>', ' ', value or ''))).strip()


def labels(title, abstract, terms, types):
    text = normalize(' '.join([title, abstract, *terms]))
    methods = [label for label, pattern in METHODS.items() if re.search(pattern, text)]
    study = [label for label, pattern in STUDY_PATTERNS.items() if re.search(pattern, text)]
    indexed = normalize(' '.join(types))
    # A review discussing a trial is not thereby classified as a trial report.
    if 'clinical trial' in indexed or 'randomized controlled trial' in indexed:
        study.append('Clinical trial')
    elif re.search(r'\b(randomi[sz]ed|phase [123iv]+|placebo.controlled)\b', normalize(title)) and not re.search(r'review|meta.analysis|protocol', normalize(title)):
        study.append('Clinical trial')
    if 'randomized controlled trial' in indexed:
        study.append('Randomised controlled trial')
    if 'meta-analysis' in indexed or re.search(r'meta.analysis', normalize(title)):
        study.append('Meta-analysis')
    if 'systematic review' in indexed or 'systematic review' in normalize(title):
        study.append('Systematic review')
    if 'review' in indexed:
        study.append('Review')
    if 'case reports' in indexed:
        study.append('Case report / series')
    if any(x in indexed for x in ['guideline', 'consensus']):
        study.append('Guideline / consensus')
    if 'preprint' in indexed:
        study.append('Preprint')
    if re.search(r'\b(protocol|study design)\b', normalize(title)):
        study.append('Study protocol')
    childhood = bool(re.search(r'\b(child\w*|pediatric\w*|paediatric\w*|juvenile|adolescen\w*|infant\w*)\b', text))
    return methods, sorted(set(study)) or ['Other / unclassified'], childhood


def unrelated(title, terms):
    """Exclude only explicit other syndromes, preserving mixed SjD records."""
    text = normalize(title)
    other = r'\b(sjogren[\s–—-]+larsson|marinesco[\s–—-]+sjogren)\b'
    if not re.search(other, text):
        return False
    if any(normalize(t) == "sjogren's syndrome" for t in terms):
        return False
    return not re.search(r'sj[o]?e?gren', re.sub(other, '', text))


def request(base, params=None, xml=False, post=False):
    encoded = urllib.parse.urlencode(params or {}).encode()
    url = base if post or not params else base + '?' + encoded.decode()
    req = urllib.request.Request(url, data=encoded if post else None,
                                 headers={'User-Agent': USER_AGENT, 'Accept': 'application/xml' if xml else 'application/json', 'Accept-Encoding': 'gzip'})
    for attempt in range(5):
        time.sleep(.4)  # < 3 requests/second without an NCBI API key
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                payload = response.read()
                if response.headers.get('Content-Encoding') == 'gzip':
                    payload = gzip.decompress(payload)
                return ET.fromstring(payload) if xml else json.loads(payload)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ET.ParseError) as error:
            if attempt == 4:
                raise RuntimeError(f'{urllib.parse.urlparse(base).hostname}: {type(error).__name__}') from error
            time.sleep(min(2 ** attempt, 16))


def epmc_record(raw):
    journal = raw.get('journalInfo', {})
    terms = [h['descriptorName'] for h in raw.get('meshHeadingList', {}).get('meshHeading', []) if h.get('descriptorName')]
    keywords = [k for k in raw.get('keywordList', {}).get('keyword', []) if k]
    types = [t for t in raw.get('pubTypeList', {}).get('pubType', []) if t]
    title = clean(raw.get('title'))
    methods, study, childhood = labels(title, raw.get('abstractText', ''), terms + keywords, types)
    pmid = raw.get('pmid', raw['id'] if raw['source'] == 'MED' else '')
    record = {
        'id': 'pmid:' + pmid if pmid else raw['source'].lower() + ':' + raw['id'],
        'pmid': pmid, 'doi': raw.get('doi', ''), 'pmcid': raw.get('pmcid', ''),
        'title': title, 'authors': clean(raw.get('authorString')),
        'journal': journal.get('journal', {}).get('title', '') or raw.get('bookOrReportDetails', {}).get('publisher', ''),
        'year': int(raw.get('pubYear') or 0),
        'date': journal.get('dateOfPublication') or raw.get('firstPublicationDate', ''),
        'sortDate': raw.get('firstPublicationDate', ''),
        'electronicDate': raw.get('electronicPublicationDate', ''),
        'indexedDate': raw.get('firstIndexDate', ''),
        'sourceUpdated': raw.get('dateOfRevision', ''),
        'types': types, 'methods': methods, 'studyTypes': study,
        'childhood': childhood, 'language': raw.get('language', ''),
        'terms': sorted(set(terms + keywords)),
        'sources': ['PubMed / Europe PMC' if pmid else 'Europe PMC preprint' if raw['source'] == 'PPR' else 'Europe PMC'],
        'url': f'https://pubmed.ncbi.nlm.nih.gov/{pmid}/' if pmid else f'https://europepmc.org/article/{raw["source"]}/{raw["id"]}',
        'excluded': unrelated(title, terms),
    }
    return record


def fetch_epmc(cache):
    cursor, by_key, total, page = '*', {}, None, 0
    while True:
        cache_path = cache / f'epmc-{page}.json'
        if cache_path.exists():
            data = json.loads(cache_path.read_text())
            if data['cursor'] != cursor:
                raise RuntimeError('Cached Europe PMC cursor mismatch; rerun without --resume')
        else:
            raw = request('https://www.ebi.ac.uk/europepmc/webservices/rest/search', {
                'query': EPMC_QUERY, 'format': 'json', 'resultType': 'core', 'pageSize': 1000, 'cursorMark': cursor})
            items = raw.get('resultList', {}).get('result', [])
            data = {'cursor': cursor, 'next': raw.get('nextCursorMark'), 'total': raw['hitCount'],
                    'records': [epmc_record(r) for r in items],
                    'keys': [r['source'] + ':' + r['id'] for r in items]}
            cache_path.write_text(json.dumps(data, ensure_ascii=False))
        total = data['total']
        by_key.update(zip(data['keys'], data['records']))
        print(f'Europe PMC: {len(by_key):,}/{total:,}', flush=True)
        if len(by_key) >= total or not data['records']:
            break
        if not data['next'] or data['next'] == cursor:
            break
        cursor, page = data['next'], page + 1
    # The index is live. Re-enumerate small ID pages and reconcile additions made
    # during the longer metadata download, rather than silently losing new hits.
    expected, cursor, total = set(), '*', None
    while True:
        data = request('https://www.ebi.ac.uk/europepmc/webservices/rest/search', {
            'query': EPMC_QUERY + ' sort_date:y', 'format': 'json', 'resultType': 'idlist', 'pageSize': 1000, 'cursorMark': cursor})
        total = data['hitCount'] if total is None else total
        if data['hitCount'] != total:
            raise RuntimeError('Europe PMC changed during ID validation; retry the refresh')
        batch = {r['source'] + ':' + r['id'] for r in data.get('resultList', {}).get('result', [])}
        if expected.intersection(batch):
            raise RuntimeError('Europe PMC ID pagination repeated records')
        expected.update(batch)
        if len(expected) == total:
            break
        next_cursor = data.get('nextCursorMark')
        if not batch or not next_cursor or next_cursor == cursor:
            raise RuntimeError('Incomplete Europe PMC ID enumeration')
        cursor = next_cursor
    missing = sorted(expected - by_key.keys())
    for start in range(0, len(missing), 100):
        batch = missing[start:start + 100]
        query = ' OR '.join(f'(SRC:{key.split(":", 1)[0]} AND EXT_ID:{key.split(":", 1)[1]})' for key in batch)
        data = request('https://www.ebi.ac.uk/europepmc/webservices/rest/search', {
            'query': query, 'format': 'json', 'resultType': 'core', 'pageSize': 1000})
        found = {r['source'] + ':' + r['id']: epmc_record(r) for r in data.get('resultList', {}).get('result', [])}
        if set(found) != set(batch):
            raise RuntimeError('Europe PMC reconciliation returned incomplete metadata')
        by_key.update(found)
    if not expected.issubset(by_key):
        raise RuntimeError('Missing Europe PMC metadata after reconciliation')
    print(f'Europe PMC: verified {total:,} source identifiers; reconciled {len(missing)} additions', flush=True)
    return [by_key[key] for key in sorted(expected)], total


def pubmed_search(term):
    data = request('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
        'db': 'pubmed', 'term': term, 'retmode': 'json', 'retmax': 9999, 'tool': 'sjd-publications'})
    result = data['esearchresult']
    if 'error' in result or 'errorlist' in result:
        raise RuntimeError('PubMed query returned an error')
    return int(result['count']), set(result.get('idlist', []))


def pubmed_ids():
    total, ids = pubmed_search(PUBMED_QUERY)
    if total > 9999:
        ids = set()
        def interval(start, end):
            term = f'({PUBMED_QUERY}) AND ("{start}"[Date - Publication] : "{end}"[Date - Publication])'
            count, values = pubmed_search(term)
            if count > 9999:
                first, last = date.fromisoformat(start), date.fromisoformat(end)
                if first == last:
                    raise RuntimeError('PubMed daily shard exceeds API cap')
                middle = date.fromordinal((first.toordinal() + last.toordinal()) // 2)
                interval(start, middle.isoformat())
                interval(date.fromordinal(middle.toordinal() + 1).isoformat(), end)
            else:
                if count != len(values):
                    raise RuntimeError('PubMed returned a partial shard')
                ids.update(values)
        interval('1000-01-01', '2100-12-31')
        missing_count, missing = pubmed_search(f'({PUBMED_QUERY}) NOT ("1000"[Date - Publication] : "2100"[Date - Publication])')
        if missing_count != len(missing):
            raise RuntimeError('PubMed undated shard is incomplete')
        ids.update(missing)
    if len(ids) != total:
        raise RuntimeError(f'PubMed count changed or pagination incomplete: {len(ids)}/{total}')
    print(f'PubMed: verified all {total:,} matching identifiers', flush=True)
    return ids, total


def xmltext(node, path):
    element = node.find(path)
    return clean(''.join(element.itertext())) if element is not None else ''


def xml_date(node):
    if node is None:
        return ''
    year, month, day = (xmltext(node, p) for p in ['Year', 'Month', 'Day'])
    if not year:
        return xmltext(node, 'MedlineDate')
    if month and not month.isdigit():
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        month = str(months.index(month[:3]) + 1) if month[:3] in months else ''
    return '-'.join(x.zfill(2) for x in [year, month, day if month else ''] if x)


def pubmed_record(node):
    citation = node.find('MedlineCitation')
    if citation is None:
        citation = node.find('BookDocument')
    if citation is None:
        raise RuntimeError('Unrecognized PubMed record')
    pmid = xmltext(citation, 'PMID')
    article = citation.find('Article')
    if article is None:
        article = citation
    title = xmltext(article, 'ArticleTitle') or xmltext(article, 'Book/BookTitle')
    abstract = xmltext(article, 'Abstract')
    terms = [clean(''.join(n.itertext())) for n in citation.findall('MeshHeadingList/MeshHeading/DescriptorName')]
    terms += [clean(''.join(n.itertext())) for n in citation.findall('KeywordList/Keyword')]
    types = [clean(''.join(n.itertext())) for n in article.findall('PublicationTypeList/PublicationType')]
    methods, study, childhood = labels(title, abstract, terms, types)
    authors = []
    for author in article.findall('AuthorList/Author'):
        authors.append(xmltext(author, 'CollectiveName') or ' '.join(filter(None, [xmltext(author, 'LastName'), xmltext(author, 'Initials')])))
    # Reference lists also contain ArticleIdList nodes: never borrow their DOIs.
    identifier_nodes = node.findall('PubmedData/ArticleIdList/ArticleId') + node.findall('PubmedBookData/ArticleIdList/ArticleId')
    identifiers = {n.get('IdType'): n.text or '' for n in identifier_nodes}
    published = xml_date(article.find('Journal/JournalIssue/PubDate')) or xml_date(article.find('Book/PubDate'))
    electronic = xml_date(article.find('ArticleDate[@DateType="Electronic"]'))
    year_match = re.search(r'\d{4}', published or electronic)
    return {
        'id': 'pmid:' + pmid, 'pmid': pmid, 'doi': identifiers.get('doi', ''), 'pmcid': identifiers.get('pmc', ''),
        'title': title, 'authors': ', '.join(authors),
        'journal': xmltext(article, 'Journal/Title') or xmltext(article, 'Book/BookTitle'),
        'year': int(year_match[0]) if year_match else 0,
        'date': published, 'sortDate': electronic or published, 'electronicDate': electronic,
        'indexedDate': xml_date(node.find('.//PubMedPubDate[@PubStatus="pubmed"]')),
        'sourceUpdated': xml_date(citation.find('DateRevised')),
        'types': types, 'methods': methods, 'studyTypes': study, 'childhood': childhood,
        'language': xmltext(article, 'Language'), 'terms': sorted(set(terms)), 'sources': ['PubMed'],
        'url': f'https://pubmed.ncbi.nlm.nih.gov/{pmid}/', 'excluded': unrelated(title, terms),
    }


def fetch_missing_pubmed(ids, records, cache):
    available = {r['pmid'] for r in records if r['pmid']}
    missing = sorted(ids - available, key=int)
    print(f'PubMed: retrieving {len(missing):,} records absent from Europe PMC results', flush=True)
    for start in range(0, len(missing), 200):
        batch = missing[start:start + 200]
        key = hashlib.sha256(','.join(batch).encode()).hexdigest()[:16]
        path = cache / f'pubmed-{key}.json'
        if path.exists():
            items = json.loads(path.read_text())
        else:
            root = request('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
                'db': 'pubmed', 'id': ','.join(batch), 'retmode': 'xml', 'tool': 'sjd-publications'}, xml=True, post=True)
            items = [pubmed_record(n) for n in root if n.tag in ['PubmedArticle', 'PubmedBookArticle']]
            path.write_text(json.dumps(items, ensure_ascii=False))
        if {r['pmid'] for r in items} != set(batch):
            raise RuntimeError('PubMed metadata batch is incomplete')
        records.extend(items)
        print(f'PubMed metadata: {min(start + 200, len(missing)):,}/{len(missing):,}', flush=True)
    if not ids.issubset({r['pmid'] for r in records}):
        raise RuntimeError('Missing PubMed identifiers after metadata retrieval')


def trial_record(raw):
    protocol = raw['protocolSection']
    identity = protocol['identificationModule']
    status = protocol['statusModule']
    design = protocol.get('designModule', {})
    conditions = protocol.get('conditionsModule', {})
    title = identity.get('officialTitle') or identity['briefTitle']
    terms = conditions.get('conditions', []) + conditions.get('keywords', [])
    methods, _, childhood = labels(title, protocol.get('descriptionModule', {}).get('briefSummary', ''), terms, [])
    eligibility = protocol.get('eligibilityModule', {})
    return {
        'id': identity['nctId'], 'title': title,
        'status': status['overallStatus'].replace('_', ' ').title(),
        'studyType': design.get('studyType', 'Unknown').replace('_', ' ').title(),
        'phases': [p.replace('PHASE', 'Phase ').replace('NA', 'Not applicable') for p in design.get('phases', [])],
        'sponsor': protocol.get('sponsorCollaboratorsModule', {}).get('leadSponsor', {}).get('name', ''),
        'conditions': conditions.get('conditions', []), 'methods': methods,
        'childhood': childhood or 'CHILD' in eligibility.get('stdAges', []),
        'ages': ' – '.join(filter(None, [eligibility.get('minimumAge'), eligibility.get('maximumAge')])),
        'startDate': status.get('startDateStruct', {}).get('date', ''),
        'firstPosted': status.get('studyFirstPostDateStruct', {}).get('date', ''),
        'updated': status.get('lastUpdatePostDateStruct', {}).get('date', ''),
        'enrollment': design.get('enrollmentInfo', {}).get('count'),
        'enrollmentType': design.get('enrollmentInfo', {}).get('type', '').title(),
        'interventions': [i['name'] for i in protocol.get('armsInterventionsModule', {}).get('interventions', [])],
        'hasResults': raw.get('hasResults', False),
        'pmids': sorted({r['pmid'] for r in protocol.get('referencesModule', {}).get('references', []) if r.get('pmid')}),
        'url': 'https://clinicaltrials.gov/study/' + identity['nctId'],
        'excluded': unrelated(title, conditions.get('conditions', [])),
    }


def fetch_trials():
    records, seen, token, total = [], set(), None, None
    while True:
        params = {'query.cond': TRIAL_QUERY, 'format': 'json', 'pageSize': 1000, 'countTotal': 'true'}
        if token:
            params['pageToken'] = token
        data = request('https://clinicaltrials.gov/api/v2/studies', params)
        total = data['totalCount'] if total is None else total
        if data['totalCount'] != total:
            raise RuntimeError('ClinicalTrials.gov count changed during retrieval')
        batch = [trial_record(r) for r in data.get('studies', [])]
        if any(r['id'] in seen for r in batch):
            raise RuntimeError('Repeated ClinicalTrials.gov page')
        seen.update(r['id'] for r in batch)
        records.extend(batch)
        next_token = data.get('nextPageToken')
        if not next_token:
            break
        if next_token == token or not batch:
            raise RuntimeError('ClinicalTrials.gov pagination stalled')
        token = next_token
    if len(records) != total or len(seen) != total:
        raise RuntimeError('Incomplete ClinicalTrials.gov snapshot')
    version = request('https://clinicaltrials.gov/api/v2/version')
    print(f'ClinicalTrials.gov: {total:,} registered studies', flush=True)
    return records, total, version.get('dataTimestamp', '')


def deduplicate(records):
    """Merge shared identifiers; never collapse distinct PMIDs or preprint versions."""
    result, ids, dois, duplicates = [], {}, {}, 0
    doi_pmids = {}
    for record in records:
        if record['doi'] and record['pmid']:
            doi_pmids.setdefault(record['doi'].lower().removeprefix('https://doi.org/').strip(), set()).add(record['pmid'])
    for record in sorted(records, key=lambda r: not bool(r['pmid'])):
        doi = record['doi'].lower().removeprefix('https://doi.org/').strip()
        match = ids.get(record['id'])
        if match is None and doi and len(doi_pmids.get(doi, set())) <= 1 and 'Preprint' not in record['studyTypes']:
            candidate = dois.get(doi)
            if candidate is not None and (not record['pmid'] or not result[candidate]['pmid']) and 'Preprint' not in result[candidate]['studyTypes']:
                match = candidate
        if match is not None:
            existing = result[match]
            for field in ['sources', 'methods', 'studyTypes', 'types', 'terms']:
                existing[field] = sorted(set(existing[field] + record[field]))
            existing['childhood'] = existing['childhood'] or record['childhood']
            existing['excluded'] = existing['excluded'] and record['excluded']
            existing['pmcid'] = existing['pmcid'] or record['pmcid']
            ids[record['id']] = match
            duplicates += 1
        else:
            ids[record['id']] = len(result)
            if doi:
                dois[doi] = len(result)
            result.append(record)
    return result, duplicates


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def refresh(resume=False):
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    old_manifest = json.loads((OUTPUT / 'manifest.json').read_text()) if (OUTPUT / 'manifest.json').exists() else None
    previous = {}
    if old_manifest:
        for chunk in old_manifest['chunks']:
            for r in json.loads((OUTPUT / chunk['file']).read_text()):
                previous[r['id']] = r['firstSeen']
    cache_key = hashlib.sha256((EPMC_QUERY + PUBMED_QUERY + date.today().isoformat() + Path(__file__).read_text()).encode()).hexdigest()[:16]
    cache = ROOT / '.cache/catalogue' / cache_key
    if cache.exists() and not resume:
        shutil.rmtree(cache)
    cache.mkdir(parents=True, exist_ok=True)
    records, epmc_total = fetch_epmc(cache)
    ids, pubmed_total = pubmed_ids()
    fetch_missing_pubmed(ids, records, cache)
    trials, trial_total, registry_updated = fetch_trials()
    records, duplicates = deduplicate(records)
    excluded = [r['id'] for r in records if r['excluded']]
    records = [r for r in records if not r.pop('excluded')]
    excluded_trials = [r['id'] for r in trials if r['excluded']]
    trials = [r for r in trials if not r.pop('excluded')]
    for r in records:
        r['firstSeen'] = previous.get(r['id'], now)
    records.sort(key=lambda r: (r['sortDate'], r['id']), reverse=True)
    trials.sort(key=lambda r: (r['updated'], r['id']), reverse=True)
    # Guard a silently narrower query or unexpected source loss.
    if old_manifest and len(records) < old_manifest['counts']['publications'] * .95:
        raise RuntimeError('Catalogue shrank by more than 5%; requires review before replacement')
    if not records or not trials:
        raise RuntimeError('Empty source snapshot')
    stage = Path(tempfile.mkdtemp(prefix='sjd-catalogue-'))
    try:
        chunks = []
        for index, start in enumerate(range(0, len(records), 2000)):
            name = f'publications-{index:02}.json'
            write_json(stage / name, records[start:start + 2000])
            chunks.append({'file': name, 'count': min(2000, len(records) - start), 'sha256': hashlib.sha256((stage / name).read_bytes()).hexdigest()})
        write_json(stage / 'trials.json', trials)
        write_json(stage / 'exclusions.json', {'reason': 'Explicit Sjögren–Larsson / Marinesco–Sjögren titles without independent SjD evidence', 'publications': excluded, 'studies': excluded_trials})
        years = Counter(str(r['year']) for r in records if r['year'])
        methods = Counter(m for r in records for m in r['methods'])
        manifest = {
            'schemaVersion': 1, 'lastSuccess': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'lastAttempt': now, 'status': 'ok',
            'counts': {'publications': len(records), 'registeredStudies': len(trials), 'pubmedQueryMatches': pubmed_total,
                       'europePmcQueryMatches': epmc_total, 'registryQueryMatches': trial_total,
                       'pubmedRecords': sum(bool(r['pmid']) for r in records),
                       'preprints': sum('Preprint' in r['studyTypes'] for r in records),
                       'childhood': sum(r['childhood'] for r in records),
                       'omics': sum(bool(r['methods']) for r in records),
                       'duplicatesMerged': duplicates, 'excludedPublications': len(excluded), 'excludedStudies': len(excluded_trials)},
            'years': dict(sorted(years.items())), 'methods': dict(sorted(methods.items())),
            'studyTypes': dict(sorted(Counter(t for r in records for t in r['studyTypes']).items())),
            'publicationTypes': dict(sorted(Counter(t for r in records for t in r['types']).items())),
            'languages': dict(sorted(Counter(r['language'] or 'Unknown' for r in records).items())),
            'queries': {'pubmed': PUBMED_QUERY, 'europePmc': EPMC_QUERY, 'clinicalTrials': TRIAL_QUERY},
            'registryUpdated': registry_updated, 'chunks': chunks,
            'trialsFile': 'trials.json', 'trialsSha256': hashlib.sha256((stage / 'trials.json').read_bytes()).hexdigest(),
        }
        write_json(stage / 'manifest.json', manifest)
        OUTPUT.mkdir(parents=True, exist_ok=True)
        # Nothing in the published directory changes before all sources pass validation.
        for path in stage.iterdir():
            if path.name != 'manifest.json':
                shutil.copyfile(path, OUTPUT / path.name)
        shutil.copyfile(stage / 'manifest.json', OUTPUT / 'manifest.json')
        for old in OUTPUT.glob('publications-*.json'):
            if old.name not in {c['file'] for c in chunks}:
                old.unlink()
        print(json.dumps(manifest['counts'], indent=2), flush=True)
    finally:
        shutil.rmtree(stage)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--resume', action='store_true', help='Resume same-day, same-code validated metadata pages')
    parser.add_argument('--allow-stale', action='store_true', help='On failure retain complete data and record a visible failed refresh')
    args = parser.parse_args()
    try:
        refresh(args.resume)
    except Exception as error:
        manifest_path = OUTPUT / 'manifest.json'
        if not args.allow_stale or not manifest_path.exists():
            raise
        manifest = json.loads(manifest_path.read_text())
        manifest.update(status='failed', lastAttempt=datetime.now(timezone.utc).isoformat(timespec='seconds'), error=str(error))
        write_json(manifest_path, manifest)
        print(f'::warning::Refresh failed; retained last complete snapshot: {error}', flush=True)


if __name__ == '__main__':
    main()
