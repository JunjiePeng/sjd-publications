import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  publicationFormat,
  publicationFormatLabels,
} from '../lib/publication-format.ts';

const manifest = JSON.parse(
  readFileSync(new URL('../public/data/manifest.json', import.meta.url)),
);
const records = manifest.chunks.flatMap((chunk) =>
  JSON.parse(
    readFileSync(new URL(`../public/data/${chunk.file}`, import.meta.url)),
  ),
);
const byId = new Map(records.map((record) => [record.id, record]));
const actual = (id) => {
  assert.ok(byId.has(id), `Real metadata sentinel is present: ${id}`);
  return publicationFormat(byId.get(id));
};

test('explicit abstract types override the broad Journal Article index label', () => {
  const format = actual('pmid:1278724');
  assert.equal(format.key, 'abstract');
  assert.equal(format.label, 'Abstract');
  assert.equal(format.attention, true);
  assert.equal(
    publicationFormat({
      title: 'A Sjögren disease study',
      types: ['Journal Article', 'MEETING-ABSTRACT'],
    }).key,
    'abstract',
  );
});

test('English Abstract identifies a translated summary, not an abstract-only item', () => {
  const record = byId.get('pmid:41399064');
  assert.ok(record.types.includes('English Abstract'));
  const format = publicationFormat(record);
  assert.equal(format.key, 'article');
  assert.equal(format.label, 'Journal article · indexed');
});

test('collections are distinct from individual abstracts and posters', () => {
  assert.equal(actual('pmid:41821386').key, 'collection');
  assert.equal(actual('pmc:PMC13390741').key, 'collection');
  assert.equal(actual('pmc:PMC1045054').key, 'collection');
  assert.equal(actual('pmc:PMC13344552').key, 'collection');
  assert.equal(actual('pmid:2595629').key, 'collection');
  assert.equal(actual('pmid:6985099').key, 'collection');
  assert.equal(actual('pmc:PMC8853075').key, 'collection');
  assert.equal(actual('pmc:PMC3334046').key, 'abstract');
  const poster = publicationFormat({
    title: 'Salivary gland transcriptomics in Sjögren disease',
    types: ['Poster'],
  });
  assert.equal(poster.key, 'abstract');
  assert.equal(poster.label, 'Poster');
});

test('conference proceedings and clinical conferences do not imply abstract-only', () => {
  assert.equal(actual('pmid:30156541').key, 'conference');
  assert.equal(actual('pmid:23728867').key, 'conference');
  assert.equal(actual('pmid:102404').key, 'article');
  assert.equal(
    publicationFormat({
      title: 'An update on Sjögren disease',
      types: ['Congresses', 'Review'],
    }).key,
    'conference',
  );
  assert.equal(
    publicationFormat({
      title: 'A clinicopathological conference',
      types: ['Clinical Conference', 'Journal Article'],
    }).key,
    'article',
  );
});

test('papers discussing abstracts and supplement publications stay articles', () => {
  assert.equal(actual('pmid:32249306').key, 'article');
  for (const title of [
    'Reporting quality of rheumatology conference abstracts',
    'Abstracts of randomized trials: a comparative study',
    'Abstracts of conference presentations: reporting quality and completeness',
    'Abstracts: a comparison of reporting quality',
    'Evaluation of book of abstracts metadata',
    'Sjögren disease clinical advances: a journal supplement',
  ]) {
    assert.equal(
      publicationFormat({ title, types: ['Journal Article'] }).key,
      'article',
      title,
    );
  }
});

test('preprints and uncertain formats have explicit non-article labels', () => {
  assert.equal(
    publicationFormat({ title: 'New findings', types: ['Preprint'] }).key,
    'preprint',
  );
  assert.equal(
    publicationFormat({
      title: 'New findings',
      types: [],
      studyTypes: ['Preprint'],
    }).key,
    'preprint',
  );
  assert.equal(
    publicationFormat({ title: 'New findings', types: [] }).key,
    'other',
  );
});

test('every catalogue record receives one supported format without mutation', () => {
  for (const record of records) {
    const before = JSON.stringify(record);
    const format = publicationFormat(record);
    assert.ok(Object.hasOwn(publicationFormatLabels, format.key));
    assert.ok(format.detail);
    assert.equal(JSON.stringify(record), before);
    if (record.types.some((type) => type.toLowerCase() === 'abstract')) {
      assert.ok(['abstract', 'collection'].includes(format.key));
    }
  }
});
