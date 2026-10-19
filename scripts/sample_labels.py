"""Conservative specimen discovery from bibliographic metadata, not full-text appraisal.

Keep only labels and provenance, never abstract excerpts. A mention is explicitly
weaker than a sentence describing sampling or an assay; neither is manual verification.
"""
import html
import re
import unicodedata

SAMPLES = {
    'PBMCs': r'\b(pbmc[s]?|peripheral blood mononuclear (?:cells?|samples?))\b',
    'Whole / peripheral blood': r'\b(?:whole[- ]blood|peripheral blood(?! mononuclear)|blood (?:samples?|specimens?))\b',
    'Serum': r'\b(?:serum|sera)\b',
    'Plasma': r'\bplasma\b(?![- ](?:cells?|membranes?|blasts?|exchange|therapy|treatment|infusion|donation)\b)',
    'Saliva': r'\bsaliva\b|\bsalivary (?:samples?|specimens?|proteom\w*|metabolom\w*|microbiom\w*|microbiota|exosomes?|extracellular vesicles)\b',
    'Minor / labial salivary gland tissue': r'\b(?:(?:minor|labial|lip) salivary gland\w*(?:\s+\w+){0,3}\s+(?:biops\w*|tissues?|samples?|specimens?)|(?:biops\w*|tissues?|samples?|specimens?)(?:\s+\w+){0,5}\s+(?:minor|labial|lip) salivary glands?|lip biops\w*|msgb|lsgb)\b',
    'Major salivary gland tissue': r'\b(?:(?:parotid|submandibular|sublingual|major salivary)(?:\s+\w+){0,3}\s+(?:biops\w*|tissues?|samples?|specimens?)|(?:biops\w*|tissues?|samples?|specimens?)(?:\s+\w+){0,4}\s+(?:parotid|submandibular|sublingual|major salivary))\b',
    'Salivary gland tissue (site unspecified)': r'\b(?:salivary glands?(?:\s+\w+){0,3}\s+(?:biops\w*|tissues?|samples?|specimens?)|(?:biops\w*|tissues?|samples?|specimens?)(?:\s+\w+){0,4}\s+salivary glands?)\b',
    'Salivary gland epithelial cells': r'\b(?:salivary gland epithelial cells?|sgecs?|sg ecs?)\b',
    'Tears': r'\b(?:tear (?:samples?|fluid|films?|proteom\w*|metabolom\w*|proteins?|collection)|tears)\b',
    'Lacrimal gland tissue': r'\b(?:lacrimal glands?(?:\s+\w+){0,3}\s+(?:tissues?|biops\w*|samples?|specimens?)|(?:tissues?|biops\w*|samples?|specimens?)(?:\s+\w+){0,4}\s+lacrimal glands?)\b',
    'Ocular surface / conjunctival samples': r'\b(?:conjunctival (?:cells?|tissues?|biops\w*|impression cytology|samples?)|corneal (?:cells?|tissues?|samples?)|ocular surface (?:samples?|swabs?|cells?))\b',
    'Oral / buccal swabs': r'\b(?:(?:oral|buccal|tongue|dental)(?:\s+\w+){0,2}\s+(?:swabs?|scrapings?|samples?)|dental plaque)\b',
    'Stool / faecal samples': r'\b(?:stool|fecal|faecal|feces|faeces)\b',
    'Urine': r'\burine\b|\burinary (?:samples?|specimens?|sediment|proteom\w*|metabolom\w*)\b',
    'Cerebrospinal fluid': r'\b(?:cerebrospinal fluid|csf)\b',
    'Skin tissue': r'\b(?:skin (?:biops\w*|tissues?|samples?|specimens?)|biops\w* of (?:the )?skin)\b',
    'Kidney tissue': r'\b(?:(?:kidney|renal) (?:biops\w*|tissues?|samples?|specimens?))\b',
    'Lung tissue': r'\b(?:(?:lung|pulmonary|transbronchial) (?:biops\w*|tissues?|samples?|specimens?))\b',
    'Lymph node tissue': r'\b(?:lymph nodes?(?:\s+\w+){0,2}\s+(?:biops\w*|tissues?|samples?|specimens?)|(?:biops\w*|samples?) of (?:the )?lymph nodes?)\b',
    'Bone marrow': r'\bbone marrow (?:aspirat\w*|biops\w*|cells?|samples?|specimens?)\b',
    'Isolated immune cells': r'\b(?:(?:isolated|sorted|purified) (?:\w+[ -]){0,3}(?:t cells?|b cells?|monocytes?|lymphocytes?|neutrophils?)|(?:t cells?|b cells?|monocytes?|lymphocytes?|neutrophils?) (?:were |were then )?(?:isolated|sorted|purified))\b',
    'Cell cultures / cell lines': r'\b(?:cell (?:cultures?|lines?)|cultured (?:\w+ ){0,3}cells?|primary cell cultures?)\b',
    'Organoids': r'\borganoids?\b',
}
# Molecular profiling can describe the specimen without saying "biopsy" or "tissue".
# Require an assay-to-gland phrase so gland imaging/dysfunction alone stays unlabelled.
GLAND_ASSAY = r'(?:sequenc\w*|transcriptom\w*|proteom\w*|profil\w*)[^.;!?]{0,120}\b(?:of|on|from|to|in)\s+(?:the\s+)?'
SAMPLES['Minor / labial salivary gland tissue'] += r'|' + GLAND_ASSAY + r'(?:minor|labial|lip) salivary glands?\b'
SAMPLES['Major salivary gland tissue'] += r'|' + GLAND_ASSAY + r'(?:parotid|submandibular|sublingual|major salivary) glands?\b'
SAMPLES['Salivary gland tissue (site unspecified)'] += r'|' + GLAND_ASSAY + r'salivary glands?(?: lesions?)?\b'
ACTION = re.compile(r'\b(?:collect\w*|obtain\w*|harvest\w*|isolat\w*|extract\w*|purif\w*|sort(?:ed|ing)|analy[sz]\w*|assay\w*|measur\w*|sequenc\w*|profil\w*|stain\w*|immunohistochem\w*|flow cytometr\w*|rna.seq\w*|scrna\w*|elisa|mass spectrom\w*|cultured|biopsies (?:were )?performed)\b')


def text(value):
    stripped = html.unescape(re.sub(r'<[^>]*>', ' ', value or ''))
    return ''.join(c for c in unicodedata.normalize('NFKD', stripped) if not unicodedata.combining(c)).lower()


def matches(value):
    names = {name for name, pattern in SAMPLES.items() if re.search(pattern, value)}
    if names.intersection({'Minor / labial salivary gland tissue', 'Major salivary gland tissue'}):
        names.discard('Salivary gland tissue (site unspecified)')
    return names


def sample_annotations(title, abstract, terms, publication_types):
    evidence = {}
    secondary = any(re.search(r'review|meta.analysis|editorial|comment', t.lower()) for t in publication_types)
    # Indexing/title matches identify candidates without claiming a specimen was used.
    for source, values in [('indexing', terms), ('title', [title])]:
        for value in values:
            for name in matches(text(value)):
                evidence[name] = {'name': name, 'evidence': 'mention', 'source': source}
    # A local sampling/assay context is stronger than a background disease mention.
    for sentence in re.split(r'[.;!?]|\n', text(abstract)):
        if re.search(r'\b(?:no|not|without)\b.{0,35}\b(?:collect\w*|obtain\w*|analy[sz]\w*|measur\w*|sampl\w*)', sentence):
            continue
        for name in matches(sentence):
            pattern = re.compile(SAMPLES[name])
            supported = not secondary and any(ACTION.search(sentence[max(0, m.start() - 140):m.end() + 140]) for m in pattern.finditer(sentence))
            annotation = {'name': name, 'evidence': 'sampling' if supported else 'mention', 'source': 'abstract'}
            if evidence.get(name, {}).get('evidence') != 'sampling':
                evidence[name] = annotation
    return [evidence[name] for name in sorted(evidence)]
