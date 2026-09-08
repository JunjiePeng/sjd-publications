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
      ].join(' '),
    );
    searchTexts.set(record, text);
  }
  return text;
}
export function filterCatalogue(
  records: CatalogueRecord[],
  filters: CatalogueFilters,
) {
  const words = normalized(filters.query).trim().split(/\s+/).filter(Boolean);
  const filtered = records.filter(
    (r) =>
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
