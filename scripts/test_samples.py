import copy
import unittest
from sample_labels import sample_annotations
from refresh_catalogue import epmc_record, pubmed_record, deduplicate, ET


def labels(abstract='', title='', terms=None, types=None):
    return {a['name']: a for a in sample_annotations(title, abstract, terms or [], types or [])}


class SampleTests(unittest.TestCase):
    def test_multiple_specimens_with_sampling_context(self):
        result = labels('PBMCs were isolated from peripheral blood. Serum and saliva were collected. Stool samples were sequenced.')
        self.assertTrue({'PBMCs', 'Whole / peripheral blood', 'Serum', 'Saliva', 'Stool / faecal samples'}.issubset(result))
        self.assertTrue(all(a['evidence'] == 'sampling' and a['source'] == 'abstract' for a in result.values()))

    def test_mentions_reviews_and_titles_do_not_claim_samples_used(self):
        for result in [labels('Serum biomarkers may be useful.'), labels(title='Serum biomarkers'), labels(terms=['Serum']), labels('Serum was collected in previous studies.', types=['Review'])]:
            self.assertEqual(result['Serum']['evidence'], 'mention')

    def test_plasma_cells_and_noninvasive_gland_tests_are_not_specimens(self):
        self.assertNotIn('Plasma', labels('Plasma cells, plasma-cell depletion and plasma exchange were studied.'))
        self.assertFalse(labels('Minor salivary gland ultrasound and parotid swelling were assessed. Schirmer testing was performed.'))
        self.assertEqual(labels('Plasma was collected.')['Plasma']['evidence'], 'sampling')

    def test_gland_sites_and_cell_models(self):
        result = labels('Minor salivary gland biopsies were obtained. Parotid tissue was analysed. Salivary gland epithelial cells were cultured in organoids.')
        self.assertTrue({'Minor / labial salivary gland tissue', 'Major salivary gland tissue', 'Salivary gland epithelial cells', 'Organoids'}.issubset(result))
        self.assertNotIn('Salivary gland tissue (site unspecified)', result)

    def test_molecular_assays_of_glands_without_the_word_biopsy(self):
        result = labels('Here we combine single-cell RNA-sequencing, spatial transcriptomics and proteomics of minor salivary glands of patients.')
        self.assertEqual(result['Minor / labial salivary gland tissue']['evidence'], 'sampling')
        result = labels('We apply single-cell RNA sequencing and spatial transcriptomics to salivary gland lesions.')
        self.assertEqual(result['Salivary gland tissue (site unspecified)']['evidence'], 'sampling')
        self.assertFalse(labels('Salivary gland ultrasound and gland dysfunction were evaluated.'))

    def test_missing_metadata_and_explicit_negated_sampling(self):
        self.assertEqual(labels(), {})
        self.assertNotIn('Saliva', labels('We did not collect saliva samples.'))

    def test_both_sources_store_labels_without_abstract_text(self):
        epmc = epmc_record({'id': '123', 'source': 'MED', 'title': 'Sjogren study', 'abstractText': 'Serum was collected.'})
        pubmed = pubmed_record(ET.fromstring('<PubmedArticle><MedlineCitation><PMID>123</PMID><Article><ArticleTitle>Sjogren study</ArticleTitle><Abstract><AbstractText>Serum was collected.</AbstractText></Abstract></Article></MedlineCitation></PubmedArticle>'))
        for record in [epmc, pubmed]:
            self.assertEqual(record['samples'], [{'name': 'Serum', 'evidence': 'sampling', 'source': 'abstract'}])
            self.assertNotIn('abstract', record)
            self.assertNotIn('abstractText', record)

    def test_deduplication_keeps_stronger_evidence_and_additional_samples(self):
        first = epmc_record({'id': '123', 'source': 'MED', 'title': 'Serum in Sjogren study'})
        second = copy.deepcopy(first)
        second['samples'] = sample_annotations('', 'Serum and saliva were collected.', [], [])
        records, _ = deduplicate([first, second])
        result = {a['name']: a for a in records[0]['samples']}
        self.assertEqual(set(result), {'Serum', 'Saliva'})
        self.assertEqual(result['Serum']['evidence'], 'sampling')


if __name__ == '__main__':
    unittest.main()
