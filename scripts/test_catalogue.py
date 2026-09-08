import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import refresh_catalogue as catalogue


def raw_record(identifier='123', source='MED', doi='10.1000/example', title='Sjögren syndrome'):
    return {'id': identifier, 'source': source, 'doi': doi, 'title': title, 'pubYear': '1990',
            'pubTypeList': {'pubType': ['Preprint'] if source == 'PPR' else ['Journal Article']}}


class IngestionTests(unittest.TestCase):
    def test_missing_keywords_and_abstracts_do_not_drop_a_record(self):
        raw = raw_record()
        raw['keywordList'] = {'keyword': [None, 'Sjögren']}
        record = catalogue.epmc_record(raw)
        self.assertEqual(record['pmid'], '123')
        self.assertEqual(record['terms'], ['Sjögren'])
        self.assertNotIn('abstract', record)
        self.assertNotIn('abstractText', record)

    def test_nonexclusive_omics_and_childhood_labels(self):
        methods, _, childhood = catalogue.labels('Paediatric Sjögren’s disease', 'single-cell RNA-seq, spatial transcriptomics and proteomics', [], [])
        self.assertTrue(childhood)
        self.assertTrue({'Single-cell', 'Spatial omics', 'Transcriptomics', 'Proteomics'}.issubset(methods))
        self.assertFalse(catalogue.labels('Adult Sjogren syndrome', '', [], [])[2])

    def test_reviews_discussing_trials_are_not_trial_reports(self):
        _, designs, _ = catalogue.labels('A review of Sjogren therapies', 'a randomized trial of a therapy', [], ['Review'])
        self.assertIn('Review', designs)
        self.assertNotIn('Clinical trial', designs)
        self.assertIn('Clinical trial', catalogue.labels('A trial', '', [], ['Randomized Controlled Trial'])[1])

    def test_explicit_other_syndromes_and_mixed_references(self):
        self.assertTrue(catalogue.unrelated('Sjögren–Larsson syndrome: genetics', []))
        self.assertTrue(catalogue.unrelated('Marinesco-Sjögren syndrome', []))
        self.assertFalse(catalogue.unrelated('Sjögren–Larsson and Sjögren syndrome compared', []))
        self.assertFalse(catalogue.unrelated('Sjögren–Larsson syndrome', ["Sjogren's Syndrome"]))
        self.assertFalse(catalogue.unrelated('Gougerot-Sjögren syndrome', []))

    def test_dedupe_keeps_distinct_pmids_and_preprint_versions(self):
        med = catalogue.epmc_record(raw_record())
        same = catalogue.epmc_record(raw_record(source='PMC', identifier='PMC456'))
        distinct = catalogue.epmc_record(raw_record(identifier='124'))
        preprint = catalogue.epmc_record(raw_record(source='PPR', identifier='PPR1'))
        records, count = catalogue.deduplicate([copy.deepcopy(med), same, distinct, preprint, copy.deepcopy(med)])
        self.assertEqual(count, 1)
        self.assertEqual({r['id'] for r in records}, {'pmid:123', 'pmid:124', 'ppr:PPR1', 'pmc:PMC456'})
        merged, count = catalogue.deduplicate([copy.deepcopy(med), same])
        self.assertEqual((len(merged), count), (1, 1))

    def test_article_doi_is_not_taken_from_its_reference_list(self):
        node = catalogue.ET.fromstring('''<PubmedArticle><MedlineCitation><PMID>123</PMID><Article><ArticleTitle>Sjogren study</ArticleTitle></Article></MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="doi">10.1000/this-paper</ArticleId></ArticleIdList><ReferenceList><Reference><ArticleIdList><ArticleId IdType="doi">10.1000/cited-paper</ArticleId></ArticleIdList></Reference></ReferenceList></PubmedData></PubmedArticle>''')
        self.assertEqual(catalogue.pubmed_record(node)['doi'], '10.1000/this-paper')

    def test_registry_query_explicitly_includes_possessive_variants(self):
        for variant in ["Sjogren's", "Sjögren's", 'Sjogrens', 'Sjogren’s', 'Sjoegren']:
            self.assertIn(variant, catalogue.TRIAL_QUERY)

    def test_pubmed_splits_above_ten_thousand_and_validates_union(self):
        calls = []
        def search(term):
            calls.append(term)
            if ' NOT ' in term:
                return 1, {'undated'}
            if '1000-01-01' in term and '2100-12-31' in term or term == catalogue.PUBMED_QUERY:
                return 10001, {str(i) for i in range(9999)}
            if '1000-01-01' in term:
                return 5000, {str(i) for i in range(5000)}
            return 5000, {str(i) for i in range(5000, 10000)}
        with patch.object(catalogue, 'pubmed_search', side_effect=search):
            ids, total = catalogue.pubmed_ids()
        self.assertEqual(len(ids), total)
        self.assertEqual(total, 10001)
        self.assertIn('undated', ids)
        self.assertGreater(len(calls), 3)

    def test_partial_pubmed_metadata_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(catalogue, 'request', return_value=catalogue.ET.fromstring('<PubmedArticleSet/>')):
            with self.assertRaisesRegex(RuntimeError, 'incomplete'):
                catalogue.fetch_missing_pubmed({'123'}, [], Path(tmp))

    def test_epmc_reconciles_live_additions(self):
        first = raw_record('1')
        second = raw_record('2')
        responses = [
            {'hitCount': 1, 'resultList': {'result': [first]}},
            {'hitCount': 2, 'resultList': {'result': [first, second]}},
            {'hitCount': 1, 'resultList': {'result': [second]}},
        ]
        with tempfile.TemporaryDirectory() as tmp, patch.object(catalogue, 'request', side_effect=responses):
            records, total = catalogue.fetch_epmc(Path(tmp))
        self.assertEqual(total, 2)
        self.assertEqual({r['pmid'] for r in records}, {'1', '2'})

    def test_epmc_incomplete_identifier_page_is_rejected(self):
        responses = [{'hitCount': 1, 'resultList': {'result': [raw_record()]}},
                     {'hitCount': 2, 'resultList': {'result': [raw_record()]}}]
        with tempfile.TemporaryDirectory() as tmp, patch.object(catalogue, 'request', side_effect=responses):
            with self.assertRaisesRegex(RuntimeError, 'Incomplete'):
                catalogue.fetch_epmc(Path(tmp))

    def test_failure_preserves_last_complete_data_and_success_time(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            original = {'lastSuccess': '2026-01-01T00:00:00+00:00', 'status': 'ok', 'counts': {'publications': 123}}
            (output / 'manifest.json').write_text(json.dumps(original))
            (output / 'publications-00.json').write_text('[{"id":"pmid:123"}]')
            with patch.object(catalogue, 'OUTPUT', output), patch.object(catalogue, 'refresh', side_effect=RuntimeError('Source unavailable')), patch('sys.argv', ['refresh_catalogue.py', '--allow-stale']):
                catalogue.main()
            current = json.loads((output / 'manifest.json').read_text())
            self.assertEqual(current['lastSuccess'], original['lastSuccess'])
            self.assertEqual(current['status'], 'failed')
            self.assertEqual(current['counts'], original['counts'])
            self.assertEqual((output / 'publications-00.json').read_text(), '[{"id":"pmid:123"}]')


if __name__ == '__main__':
    unittest.main()
