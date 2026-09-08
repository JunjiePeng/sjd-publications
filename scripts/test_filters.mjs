import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defaultFilters, filterCatalogue, isStale } from '../lib/catalogue.ts';

const manifest = JSON.parse(
  readFileSync(new URL('../public/data/manifest.json', import.meta.url)),
);
const records = manifest.chunks.flatMap((chunk) =>
  JSON.parse(
    readFileSync(new URL(`../public/data/${chunk.file}`, import.meta.url)),
  ),
);

test('default catalogue retains every record, including unknown designs', () => {
  const result = filterCatalogue(records, defaultFilters);
  assert.equal(result.length, manifest.counts.publications);
  assert.ok(result.some((r) => r.studyTypes.includes('Other / unclassified')));
});
test('historical names and diacritics are searchable', () => {
  const plain = filterCatalogue(records, {
    ...defaultFilters,
    query: 'Sjogren syndrome',
  });
  const accented = filterCatalogue(records, {
    ...defaultFilters,
    query: 'Sjögren syndrome',
  });
  assert.ok(plain.length > 1000);
  assert.deepEqual(
    plain.map((r) => r.id),
    accented.map((r) => r.id),
  );
  assert.ok(
    filterCatalogue(records, { ...defaultFilters, yearTo: '1960' }).length > 0,
  );
});
test('identifier lookup finds known classification and omics studies', () => {
  assert.equal(
    filterCatalogue(records, { ...defaultFilters, query: '27789466' })[0].pmid,
    '27789466',
  );
  assert.equal(
    filterCatalogue(records, {
      ...defaultFilters,
      query: '10.1038/s41467-024-54686-0',
    })[0].pmid,
    '39747819',
  );
});
test('combined method and childhood filters only return matching records', () => {
  const children = filterCatalogue(records, {
    ...defaultFilters,
    population: 'childhood',
  });
  assert.equal(children.length, manifest.counts.childhood);
  assert.ok(
    children.some((r) => r.pmid === '33280020'),
    'International childhood SjD cohort',
  );
  const omics = filterCatalogue(records, { ...defaultFilters, method: 'any' });
  assert.equal(omics.length, manifest.counts.omics);
  const combined = filterCatalogue(records, {
    ...defaultFilters,
    method: 'Genomics / genetics',
    population: 'childhood',
  });
  assert.ok(combined.length > 0);
  assert.ok(
    combined.every(
      (r) => r.childhood && r.methods.includes('Genomics / genetics'),
    ),
  );
});
test('year boundaries are inclusive and unknown years are not fabricated', () => {
  const selected = filterCatalogue(records, {
    ...defaultFilters,
    yearFrom: '1990',
    yearTo: '1990',
  });
  assert.ok(selected.length > 0);
  assert.ok(selected.every((r) => r.year === 1990));
  assert.equal(
    filterCatalogue(records, {
      ...defaultFilters,
      yearFrom: '2020',
      yearTo: '1990',
    }).length,
    0,
  );
});
test('original publication-type filtering preserves all source types', () => {
  for (const type of [
    'Case Reports',
    'Review',
    'Randomized Controlled Trial',
  ]) {
    const selected = filterCatalogue(records, {
      ...defaultFilters,
      publicationType: type,
    });
    assert.ok(selected.length > 0, type);
    assert.ok(selected.every((r) => r.types.includes(type)));
  }
});
test('stale state reflects the last successful refresh, not the last attempt', () => {
  assert.equal(
    isStale(
      { ...manifest, lastSuccess: '2026-01-01', lastAttempt: '2026-01-15' },
      Date.parse('2026-01-15'),
    ),
    true,
  );
  assert.equal(
    isStale(
      { ...manifest, lastSuccess: '2026-01-14' },
      Date.parse('2026-01-15'),
    ),
    false,
  );
});
