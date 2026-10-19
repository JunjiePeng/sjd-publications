import test from 'node:test';
import assert from 'node:assert/strict';
import {
  publicationLinks,
  recordDestination,
} from '../lib/publication-links.ts';

test('PubMed abstract pages are labelled as records, not conference-abstract publications', () => {
  assert.equal(
    recordDestination('https://pubmed.ncbi.nlm.nih.gov/39747819/'),
    'PubMed record / abstract',
  );
  assert.equal(
    recordDestination('https://acrabstracts.org/abstract/example/'),
    'Conference abstract',
  );
  assert.equal(
    recordDestination('https://pubmed.ncbi.nlm.nih.gov.example.org/'),
    'Source page',
  );
});

test('source record, publisher and PMC links are offered without promising publisher access', () => {
  assert.deepEqual(
    publicationLinks({
      url: 'https://pubmed.ncbi.nlm.nih.gov/123/',
      doi: '10.1000/paper',
      pmcid: 'PMC123',
    }),
    [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/123/',
        label: 'PubMed record / abstract',
      },
      {
        url: 'https://doi.org/10.1000/paper',
        label: 'Publisher page · access varies',
      },
      {
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC123/',
        label: 'Read on PMC',
      },
    ],
  );
});

test('PMC-only records get a PMC reading link without inventing identifiers', () => {
  const url = 'https://europepmc.org/article/PMC/PMC456';
  assert.equal(
    publicationLinks({ url, id: 'pmc:PMC456' })[1].url,
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC456/',
  );
  assert.equal(publicationLinks({ url, pmcid: 'not-a-pmc-id' }).length, 1);
  assert.equal(
    publicationLinks({
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC456/',
      pmcid: 'PMC456',
    }).length,
    1,
  );
});

test('DOI URL normalization avoids duplicate DOI links', () => {
  assert.equal(
    publicationLinks({
      url: 'https://doi.org/10.1000/paper',
      doi: 'https://doi.org/10.1000/paper',
    }).length,
    1,
  );
});
