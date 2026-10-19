import { readDate, type ReadDates } from './reading-history.ts';
export type SampleAnnotation = {
  name: string;
  evidence: 'sampling' | 'mention';
  source: 'abstract' | 'title' | 'indexing';
};
export type CatalogueRecord = {
  id: string;
  pmid: string;
  doi: string;
  pmcid: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  date: string;
  sortDate: string;
  electronicDate: string;
  indexedDate: string;
  sourceUpdated: string;
  firstSeen: string;
  types: string[];
  methods: string[];
  studyTypes: string[];
  terms: string[];
  samples?: SampleAnnotation[];
  childhood: boolean;
  language: string;
  sources: string[];
  url: string;
};
export type RegisteredStudy = {
  id: string;
  title: string;
  status: string;
  studyType: string;
  phases: string[];
  sponsor: string;
  conditions: string[];
  methods: string[];
  childhood: boolean;
  ages: string;
  startDate: string;
  firstPosted: string;
  updated: string;
  enrollment: number | null;
  enrollmentType: string;
  interventions: string[];
  hasResults: boolean;
  pmids: string[];
  url: string;
};
export type Manifest = {
  schemaVersion: number;
  lastSuccess: string;
  lastAttempt: string;
  status: 'ok' | 'failed';
  error?: string;
  counts: Record<string, number>;
  years: Record<string, number>;
  methods: Record<string, number>;
  samples?: Record<string, number>;
  sampleLabelsVersion?: number;
  sampleEvidenceCounts?: { sampling: number; unknown: number };
  studyTypes: Record<string, number>;
  publicationTypes: Record<string, number>;
  languages: Record<string, number>;
  queries: { pubmed: string; europePmc: string; clinicalTrials: string };
  registryUpdated: string;
  chunks: { file: string; count: number; sha256: string }[];
  trialsFile: string;
  trialsSha256: string;
};
export type CatalogueFilters = {
  query: string;
  method: string;
  studyType: string;
  population: string;
  yearFrom: string;
  yearTo: string;
  publicationType: string;
  sort: string;
  sample: string;
  sampleEvidence: string;
  reading: 'all' | 'read' | 'unread';
};
export const defaultFilters: CatalogueFilters = {
  query: '',
  method: 'all',
  studyType: 'all',
  population: 'all',
  yearFrom: '',
  yearTo: '',
  publicationType: 'all',
  sort: 'newest',
  sample: 'all',
  sampleEvidence: 'all',
  reading: 'all',
};
export function normalized(value: string) {
  return value
    .replaceAll('ø', 'o')
    .replaceAll('Ø', 'O')
    .replace(/[’‘]/g, "'")
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll('sjoegren', 'sjogren');
}
const searchTexts = new WeakMap<CatalogueRecord, string>();
function searchText(record: CatalogueRecord) {
  let text = searchTexts.get(record);
  if (!text) {
    text = normalized(
      [
        record.title,
        record.authors,
        record.journal,
        record.pmid,
        record.doi,
        record.pmcid,
        ...record.terms,
        ...record.methods,
        ...record.types,
        ...(record.samples || []).map((sample) => sample.name),
      ].join(' '),
    );
    searchTexts.set(record, text);
  }
  return text;
}
export function filterCatalogue(
  records: CatalogueRecord[],
  filters: CatalogueFilters,
  readDates: ReadDates = {},
) {
  const words = normalized(filters.query).trim().split(/\s+/).filter(Boolean);
  const filtered = records.filter(
    (r) =>
      (filters.reading === 'all' ||
        (filters.reading === 'read'
          ? !!readDate(r, readDates)
          : !readDate(r, readDates))) &&
      matchesSample(r.samples || [], filters.sample, filters.sampleEvidence) &&
      (filters.method === 'all' ||
        (filters.method === 'any'
          ? r.methods.length > 0
          : r.methods.includes(filters.method))) &&
      (filters.studyType === 'all' ||
        r.studyTypes.includes(filters.studyType)) &&
      (filters.population === 'all' || r.childhood) &&
      (filters.publicationType === 'all' ||
        r.types.includes(filters.publicationType)) &&
      (!filters.yearFrom ||
        (r.year > 0 && r.year >= Number(filters.yearFrom))) &&
      (!filters.yearTo || (r.year > 0 && r.year <= Number(filters.yearTo))) &&
      words.every((word) => searchText(r).includes(word)),
  );
  return filtered.sort((a, b) => {
    const aDate = filters.sort === 'added' ? a.firstSeen : a.sortDate;
    const bDate = filters.sort === 'added' ? b.firstSeen : b.sortDate;
    if (!aDate) return bDate ? 1 : a.id.localeCompare(b.id);
    if (!bDate) return -1;
    return (
      (filters.sort === 'oldest'
        ? aDate.localeCompare(bDate)
        : bDate.localeCompare(aDate)) || b.id.localeCompare(a.id)
    );
  });
}
export function matchesSample(
  samples: SampleAnnotation[],
  sample: string,
  evidence: string,
) {
  if (sample === 'unknown') return samples.length === 0;
  if (sample === 'all' && evidence === 'all') return true;
  return samples.some(
    (annotation) =>
      (sample === 'all' || annotation.name === sample) &&
      (evidence === 'all' || annotation.evidence === 'sampling'),
  );
}
export function formatTimestamp(value: string) {
  return (
    new Date(value).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC'
  );
}
export function isStale(manifest: Manifest, now = Date.now()) {
  return (
    now - new Date(manifest.lastSuccess).getTime() > 8 * 24 * 60 * 60 * 1000
  );
}
