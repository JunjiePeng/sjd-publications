import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  type CatalogueRecord,
  type RegisteredStudy,
  type Manifest,
  type CatalogueFilters,
  defaultFilters,
  filterCatalogue,
  normalized,
  formatTimestamp,
  isStale,
} from '@/lib/catalogue';

const dataRoot = `${import.meta.env.BASE_URL}data/`;
const number = (value: number) => value.toLocaleString('en-GB');
const cachedPublications = new Map<string, CatalogueRecord[]>();
const cachedTrials = new Map<string, RegisteredStudy[]>();
const pageSize = 25;

async function getJson<T>(file: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(dataRoot + file, { signal });
  if (!response.ok) throw new Error('The catalogue could not be downloaded.');
  return response.json();
}
export function useManifest() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const lifecycle = new AbortController();
    getJson<Manifest>(`manifest.json?v=${Date.now()}`, lifecycle.signal)
      .then((value) => {
        if (value.schemaVersion !== 1 || !value.chunks?.length)
          throw new Error('Unsupported snapshot');
        setManifest(value);
        setError(false);
      })
      .catch(() => {
        if (!lifecycle.signal.aborted) setError(true);
      });
    return () => lifecycle.abort();
  }, [attempt]);
  return {
    manifest,
    error,
    retry: () => {
      setError(false);
      setAttempt((a) => a + 1);
    },
  };
}

export function CatalogueSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="catalogue-filter">
      <span>{label}</span>
      <Select
        value={value}
        onValueChange={(value) => onChange(String(value))}
        items={options}
      >
        <SelectTrigger className="filter-select" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

export function Coverage({ manifest }: { manifest: Manifest }) {
  const count = manifest.counts;
  return (
    <details className="methodology catalogue-coverage">
      <summary>
        Sources, search strategy & coverage <ChevronDown size={17} />
      </summary>
      <div className="method-grid">
        <div>
          <h3>Complete results from three searches</h3>
          <p>
            PubMed: {number(count.pubmedQueryMatches)} matches. Europe PMC:{' '}
            {number(count.europePmcQueryMatches)} matches across PubMed records,
            PMC-only articles and preprints. ClinicalTrials.gov:{' '}
            {number(count.registryQueryMatches)} registered studies before
            exclusions.
          </p>
          <p>
            Every page is retrieved and checked against source totals. Shared
            identifiers are merged; distinct PubMed records and preprint
            versions are retained. {number(count.excludedPublications)}{' '}
            publications and {number(count.excludedStudies)} studies explicitly
            about Sjögren–Larsson or Marinesco–Sjögren syndrome were excluded.{' '}
            <a href={dataRoot + 'exclusions.json'}>
              View exclusion identifiers ↗
            </a>
          </p>
          <p>
            Both current and historical names are searched, including Sjogren,
            Sjögren, Sjøgren and Sjoegren, plus the “Sjogren’s Syndrome” MeSH
            heading. No date, language, age or study-type restrictions are
            applied.
          </p>
          <details>
            <summary>Exact database queries</summary>
            <h4>PubMed</h4>
            <code>{manifest.queries.pubmed}</code>
            <h4>Europe PMC</h4>
            <code>{manifest.queries.europePmc}</code>
            <h4>ClinicalTrials.gov condition search</h4>
            <code>{manifest.queries.clinicalTrials}</code>
          </details>
        </div>
        <div>
          <h3>What coverage means</h3>
          <p>
            This is a broad discovery catalogue, not a claim to every study ever
            conducted. Papers absent from these indexes, unmatched terminology,
            unindexed conference reports and studies registered only elsewhere
            can be missing. Some broad-search matches only mention SjD.
          </p>
          <p>
            Omics, study-design and childhood labels are discovery aids inferred
            from titles, available abstracts and indexing. They may describe a
            discussed method rather than one used in the study. A missing label
            does not exclude a paper. Original publication types are preserved
            in a separate filter.
          </p>
          <p>
            Registered studies are protocols, not proof of efficacy; posted
            results and linked references are identified separately. Preprints
            are labelled and may not have been peer reviewed. Full abstracts and
            paywalled texts are read at the original source.
          </p>
          <h3>Dates & updates</h3>
          <p>
            Weekly refresh, Mondays at 05:17 UTC. A failed refresh keeps the
            last complete snapshot. First added means first seen in this
            catalogue, not newly published. Year filters use the source
            publication year; newest sorts by the source’s first publication
            date. Dates may have only year or month precision.
          </p>
          <p>
            Last complete refresh: {formatTimestamp(manifest.lastSuccess)}.
            <br />
            Registry dataset timestamp:{' '}
            {manifest.registryUpdated || 'Unavailable'}.
          </p>
          <div className="reference-line">
            <a
              href="https://www.ncbi.nlm.nih.gov/books/NBK25499/"
              target="_blank"
              rel="noreferrer"
            >
              PubMed API ↗
            </a>
            <a
              href="https://europepmc.org/RestfulWebService"
              target="_blank"
              rel="noreferrer"
            >
              Europe PMC API ↗
            </a>
            <a
              href="https://clinicaltrials.gov/data-api/api"
              target="_blank"
              rel="noreferrer"
            >
              ClinicalTrials.gov API ↗
            </a>
          </div>
        </div>
      </div>
    </details>
  );
}

export function RefreshStatus({ manifest }: { manifest: Manifest }) {
  const stale = isStale(manifest);
  return (
    <div
      className={`refresh-status ${manifest.status === 'failed' || stale ? 'refresh-warning' : ''}`}
    >
      <span className="status-dot" />
      {manifest.status === 'failed' ? (
        <span>
          The refresh on {formatTimestamp(manifest.lastAttempt)} failed. Showing
          the last complete catalogue from{' '}
          {formatTimestamp(manifest.lastSuccess)}.
        </span>
      ) : (
        <span>
          Complete snapshot · {formatTimestamp(manifest.lastSuccess)}
          {stale ? ' · Update overdue' : ' · Updated weekly'}
        </span>
      )}
    </div>
  );
}

export function CatalogueLandscape({
  manifest,
  open,
}: {
  manifest: Manifest;
  open: (filters: Partial<CatalogueFilters>) => void;
}) {
  const years = Object.entries(manifest.years).filter(
    ([year]) => Number(year) >= 2000,
  );
  const maximum = Math.max(...years.map(([, count]) => count));
  return (
    <section
      className="catalogue-landscape"
      aria-labelledby="catalogue-landscape-title"
    >
      <div className="section-heading">
        <div>
          <h2 id="catalogue-landscape-title">
            Explore the full research catalogue
          </h2>
          <p>Select a year or an omics area to open its publications.</p>
        </div>
        <span className="mini-label">
          Counts describe coverage, not evidence quality
        </span>
      </div>
      <div className="landscape-grid">
        <div className="landscape-panel">
          <h3>Publications by year</h3>
          <p className="source-note">
            2000 onward · all earlier records remain searchable · current year
            is incomplete
          </p>
          <div className="year-bars">
            {years.map(([year, count]) => (
              <button
                key={year}
                onClick={() => open({ yearFrom: year, yearTo: year })}
                aria-label={`${year}: ${number(count)} publications`}
                title={`${year}: ${number(count)}`}
              >
                <span className="year-bar-track">
                  <span
                    style={{
                      height: `${Math.max(2, (count / maximum) * 100)}%`,
                    }}
                  />
                </span>
                <span>{year.slice(2)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="landscape-panel">
          <h3>Omics & molecular methods</h3>
          <div className="omics-links">
            {Object.entries(manifest.methods)
              .sort((a, b) => b[1] - a[1])
              .map(([method, count]) => (
                <button key={method} onClick={() => open({ method })}>
                  <span>{method}</span>
                  <strong>{number(count)}</strong>
                  <ArrowRight size={14} />
                </button>
              ))}
          </div>
          <p className="source-note">
            Overlapping keyword-based labels; one paper can appear in several
            areas.
          </p>
        </div>
      </div>
    </section>
  );
}

function Pages({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <Pagination className="catalogue-pagination" aria-label="Result pages">
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => onChange(1)}
          >
            First
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
          >
            Previous
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="page-count">
            {page} / {Math.max(1, total)}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="outline"
            disabled={page >= total}
            onClick={() => onChange(page + 1)}
          >
            Next
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="outline"
            disabled={page >= total}
            onClick={() => onChange(total)}
          >
            Last
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PublicationCard({ record: p }: { record: CatalogueRecord }) {
  return (
    <article className="publication catalogue-publication">
      <div className="publication-year">
        {p.year || 'Undated'}
        <span>{p.journal || 'Source not supplied'}</span>
      </div>
      <div className="publication-body">
        <div className="pub-meta">
          <span
            className={`badge ${p.studyTypes.includes('Preprint') ? 'conference' : ''}`}
          >
            {p.studyTypes.includes('Preprint')
              ? 'Preprint · not peer reviewed'
              : p.types.includes('Journal Article')
                ? 'Journal article'
                : p.types[0] || 'Unclassified publication'}
          </span>
          {p.types.includes('Retracted Publication') && (
            <span className="badge conference">Retracted publication</span>
          )}
          {p.types.includes('Published Erratum') && (
            <span className="badge conference">Correction / erratum</span>
          )}
          {p.childhood && <span className="badge">Childhood-related</span>}
        </div>
        <h2>
          <a href={p.url} target="_blank" rel="noreferrer">
            {p.title || 'Untitled indexed record'}
            <ArrowUpRight size={18} />
          </a>
        </h2>
        <p className="authors">{p.authors || 'Authors not supplied'}</p>
        <div className="topic-tags">
          {p.methods.map((method) => (
            <span key={method}>{method}</span>
          ))}
        </div>
        <details className="paper-details">
          <summary>
            Study labels, dates & reference <ChevronDown size={16} />
          </summary>
          <div>
            <dl className="record-facts">
              <dt>Discovery labels</dt>
              <dd>{p.studyTypes.join(' · ')}</dd>
              <dt>Indexed publication types</dt>
              <dd>{p.types.join(' · ') || 'Not supplied'}</dd>
              <dt>Publication date</dt>
              <dd>{p.date || 'Not supplied'}</dd>
              {p.electronicDate && (
                <>
                  <dt>Electronic publication</dt>
                  <dd>{p.electronicDate}</dd>
                </>
              )}
              <dt>First indexed</dt>
              <dd>{p.indexedDate || 'Not supplied'}</dd>
              <dt>First added here</dt>
              <dd>{formatTimestamp(p.firstSeen)}</dd>
              <dt>Source metadata revised</dt>
              <dd>{p.sourceUpdated || 'Not supplied'}</dd>
              <dt>Language</dt>
              <dd>{p.language || 'Not supplied'}</dd>
              <dt>Source</dt>
              <dd>{p.sources.join(' · ')}</dd>
            </dl>
            <div className="reference-line">
              {p.pmid && (
                <a href={p.url} target="_blank" rel="noreferrer">
                  PMID {p.pmid} ↗
                </a>
              )}
              {p.doi && (
                <a
                  href={`https://doi.org/${p.doi}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  DOI {p.doi} ↗
                </a>
              )}
              {p.pmcid && (
                <a
                  href={`https://pmc.ncbi.nlm.nih.gov/articles/${p.pmcid}/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.pmcid} ↗
                </a>
              )}
            </div>
            {p.terms.length > 0 && (
              <p className="source-note">
                Subject headings & keywords: {p.terms.join('; ')}
              </p>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}

export function PublicationCatalogue({
  manifest,
  initial = {},
}: {
  manifest: Manifest;
  initial?: Partial<CatalogueFilters>;
}) {
  const [records, setRecords] = useState<CatalogueRecord[] | null>(
    () => cachedPublications.get(manifest.lastSuccess) || null,
  );
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<CatalogueFilters>({
    ...defaultFilters,
    ...initial,
  });
  const [page, setPage] = useState(1);
  const deferredFilters = useDeferredValue(filters);
  const results = useMemo(
    () => (records ? filterCatalogue(records, deferredFilters) : []),
    [records, deferredFilters],
  );
  const pages = Math.ceil(results.length / pageSize);
  const currentPage = Math.min(page, Math.max(1, pages));
  function update(patch: Partial<CatalogueFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }
  useEffect(() => {
    if (cachedPublications.has(manifest.lastSuccess)) return;
    const lifecycle = new AbortController();
    const result: CatalogueRecord[][] = [];
    let done = 0;
    async function load() {
      try {
        // Four downloads at a time; never show a partial set as a complete result.
        for (let index = 0; index < manifest.chunks.length; index += 4) {
          await Promise.all(
            manifest.chunks
              .slice(index, index + 4)
              .map(async (chunk, offset) => {
                const batch = await getJson<CatalogueRecord[]>(
                  `${chunk.file}?v=${chunk.sha256}`,
                  lifecycle.signal,
                );
                if (batch.length !== chunk.count)
                  throw new Error('Incomplete chunk');
                result[index + offset] = batch;
                done += batch.length;
                setLoaded(done);
              }),
          );
        }
        const all = result.flat();
        if (
          all.length !== manifest.counts.publications ||
          new Set(all.map((r) => r.id)).size !== all.length
        )
          throw new Error('Incomplete catalogue');
        cachedPublications.set(manifest.lastSuccess, all);
        setRecords(all);
      } catch {
        if (!lifecycle.signal.aborted) {
          setError(true);
          lifecycle.abort();
        }
      }
    }
    void load();
    return () => lifecycle.abort();
  }, [manifest, attempt]);
  useEffect(() => {
    if (!records) return;
    type Tool = {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'search_sjd_publications',
            title: 'Search the full SjD publication catalogue',
            description:
              'Search all loaded publication metadata. Updates visible filters and returns a count and up to 25 matches.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', maxLength: 500 },
                method: {
                  type: 'string',
                  enum: ['all', 'any', ...Object.keys(manifest.methods)],
                },
                childhood: { type: 'boolean' },
              },
              required: ['query'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute(input) {
              if (!input || typeof input !== 'object')
                throw new Error('Expected an object');
              const args = input as Record<string, unknown>;
              if (
                typeof args.query !== 'string' ||
                args.query.length > 500 ||
                Object.keys(args).some(
                  (key) => !['query', 'method', 'childhood'].includes(key),
                ) ||
                (args.childhood !== undefined &&
                  typeof args.childhood !== 'boolean') ||
                (args.method !== undefined &&
                  (typeof args.method !== 'string' ||
                    !['all', 'any', ...Object.keys(manifest.methods)].includes(
                      args.method,
                    )))
              )
                throw new Error('Invalid search input');
              const next = {
                ...defaultFilters,
                query: args.query,
                method: typeof args.method === 'string' ? args.method : 'all',
                population: args.childhood ? 'childhood' : 'all',
              };
              setFilters(next);
              setPage(1);
              const matches = filterCatalogue(records, next);
              return {
                count: matches.length,
                totalCatalogue: records.length,
                records: matches.slice(0, pageSize).map((r) => ({
                  title: r.title,
                  year: r.year,
                  url: r.url,
                  methods: r.methods,
                })),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Optional browser capability. */
    }
    return () => lifecycle.abort();
  }, [records, manifest]);
  return (
    <>
      <div className="heading catalogue-heading">
        <div>
          <p className="eyebrow">Full publication catalogue</p>
          <h1>Sjögren’s research, across the literature</h1>
          <p className="subtitle">
            Disease and syndrome terminology · every publication year · all
            study types and languages.
          </p>
        </div>
        <div className="catalogue-total">
          <strong>{number(manifest.counts.publications)}</strong>
          <span>publication records</span>
        </div>
      </div>
      <RefreshStatus manifest={manifest} />
      <div className="catalogue-quick">
        <Button
          variant="outline"
          onClick={() => {
            setFilters(defaultFilters);
            setPage(1);
          }}
        >
          All publications
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setFilters({ ...defaultFilters, method: 'any' });
            setPage(1);
          }}
        >
          All omics & molecular methods
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setFilters({ ...defaultFilters, studyType: 'Clinical trial' });
            setPage(1);
          }}
        >
          Clinical trial reports
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setFilters({ ...defaultFilters, population: 'childhood' });
            setPage(1);
          }}
        >
          Childhood SjD
        </Button>
      </div>
      <div className="catalogue-controls">
        <label className="search-box">
          <Search size={19} />
          <span className="sr-only">Search the full catalogue</span>
          <Input
            type="search"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Title, author, subject, journal, DOI or PMID…"
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              onClick={() => update({ query: '' })}
            >
              <X size={16} />
            </Button>
          )}
        </label>
        <div className="catalogue-filter-grid">
          <CatalogueSelect
            label="Study design"
            value={filters.studyType}
            onChange={(studyType) => update({ studyType })}
            options={[
              { value: 'all', label: 'All designs, including unclassified' },
              ...Object.entries(manifest.studyTypes).map(([type, count]) => ({
                value: type,
                label: `${type} (${number(count)})`,
              })),
            ]}
          />
          <CatalogueSelect
            label="Omics / method"
            value={filters.method}
            onChange={(method) => update({ method })}
            options={[
              { value: 'all', label: 'All methods' },
              { value: 'any', label: 'Any omics / molecular method' },
              ...Object.entries(manifest.methods).map(([method, count]) => ({
                value: method,
                label: `${method} (${number(count)})`,
              })),
            ]}
          />
          <CatalogueSelect
            label="Population"
            value={filters.population}
            onChange={(population) => update({ population })}
            options={[
              { value: 'all', label: 'All ages and models' },
              { value: 'childhood', label: 'Childhood-related literature' },
            ]}
          />
          <div className="catalogue-year-range">
            <label htmlFor="catalogue-year-from">
              From year
              <Input
                id="catalogue-year-from"
                type="number"
                min="1000"
                max="9999"
                placeholder="Any"
                value={filters.yearFrom}
                onChange={(e) => update({ yearFrom: e.target.value })}
              />
            </label>
            <label htmlFor="catalogue-year-to">
              To year
              <Input
                id="catalogue-year-to"
                type="number"
                min="1000"
                max="9999"
                placeholder="Any"
                value={filters.yearTo}
                onChange={(e) => update({ yearTo: e.target.value })}
              />
            </label>
          </div>
        </div>
        <details className="extra-filters">
          <summary>Original publication-type filter</summary>
          <CatalogueSelect
            label="Indexed publication type"
            value={filters.publicationType}
            onChange={(publicationType) => update({ publicationType })}
            options={[
              { value: 'all', label: 'All indexed types' },
              ...Object.entries(manifest.publicationTypes).map(
                ([type, count]) => ({
                  value: type,
                  label: `${type} (${number(count)})`,
                }),
              ),
            ]}
          />
        </details>
      </div>
      <p className="source-note">
        Design, omics and childhood labels are inferred discovery aids, not
        manual study appraisal. All unclassified records remain included.
      </p>
      {!records ? (
        <div className="catalogue-loading">
          {error ? (
            <>
              <h2>Could not load the complete catalogue</h2>
              <p>No partial result count is shown. Please retry.</p>
              <Button
                onClick={() => {
                  setLoaded(0);
                  setError(false);
                  setAttempt((a) => a + 1);
                }}
              >
                Retry download
              </Button>
            </>
          ) : (
            <>
              <output>
                Loading publication metadata: {number(loaded)} /{' '}
                {number(manifest.counts.publications)}
              </output>
              <Progress
                value={(loaded / manifest.counts.publications) * 100}
                aria-label="Publication metadata downloaded"
              />
            </>
          )}
        </div>
      ) : (
        <>
          <div className="results-line" id="catalogue-results">
            <output aria-live="polite" aria-busy={filters !== deferredFilters}>
              <strong>{number(results.length)}</strong> matching publications ·{' '}
              {results.length
                ? `${number((currentPage - 1) * pageSize + 1)}–${number(Math.min(currentPage * pageSize, results.length))}`
                : '0'}{' '}
              shown
            </output>
            <CatalogueSelect
              label="Sort by"
              value={filters.sort}
              onChange={(sort) => update({ sort })}
              options={[
                { value: 'newest', label: 'Newest publication first' },
                { value: 'oldest', label: 'Oldest publication first' },
                { value: 'added', label: 'Most recently added here' },
              ]}
            />
          </div>
          {results.length ? (
            <>
              <Pages page={currentPage} total={pages} onChange={setPage} />
              <div className="publication-list">
                {results
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((record) => (
                    <PublicationCard key={record.id} record={record} />
                  ))}
              </div>
              <Pages
                page={currentPage}
                total={pages}
                onChange={(page) => {
                  setPage(page);
                  document
                    .getElementById('catalogue-results')
                    ?.scrollIntoView({ behavior: 'instant', block: 'start' });
                }}
              />
            </>
          ) : (
            <Empty className="empty-state">
              <EmptyHeader>
                <EmptyTitle>No matching publications</EmptyTitle>
                <EmptyDescription>
                  Try fewer words or remove a filter. Keyword labels do not
                  identify every relevant study.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                onClick={() => {
                  setFilters(defaultFilters);
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </Empty>
          )}
        </>
      )}
      <Coverage manifest={manifest} />
    </>
  );
}

export function StudyCatalogue({ manifest }: { manifest: Manifest }) {
  const [studies, setStudies] = useState<RegisteredStudy[] | null>(
    () => cachedTrials.get(manifest.lastSuccess) || null,
  );
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [population, setPopulation] = useState('all');
  const [postedResults, setPostedResults] = useState('all');
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (cachedTrials.has(manifest.lastSuccess)) return;
    const lifecycle = new AbortController();
    getJson<RegisteredStudy[]>(
      `${manifest.trialsFile}?v=${manifest.trialsSha256}`,
      lifecycle.signal,
    )
      .then((data) => {
        if (
          data.length !== manifest.counts.registeredStudies ||
          new Set(data.map((r) => r.id)).size !== data.length
        )
          throw new Error('Incomplete studies');
        cachedTrials.set(manifest.lastSuccess, data);
        setStudies(data);
      })
      .catch(() => {
        if (!lifecycle.signal.aborted) setError(true);
      });
    return () => lifecycle.abort();
  }, [manifest, attempt]);
  const words = normalized(useDeferredValue(query))
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const results = (studies || []).filter(
    (study) =>
      (status === 'all' || study.status === status) &&
      (type === 'all' || study.studyType === type) &&
      (population === 'all' || study.childhood) &&
      (postedResults === 'all' || study.hasResults) &&
      words.every((word) =>
        normalized(
          [
            study.title,
            study.id,
            study.sponsor,
            ...study.conditions,
            ...study.interventions,
            ...study.methods,
          ].join(' '),
        ).includes(word),
      ),
  );
  const pages = Math.ceil(results.length / pageSize);
  const currentPage = Math.min(page, Math.max(1, pages));
  return (
    <>
      <div className="heading catalogue-heading">
        <div>
          <p className="eyebrow">ClinicalTrials.gov study register</p>
          <h1>Clinical trials & observational studies</h1>
          <p className="subtitle">
            All registration statuses, including studies without publications or
            posted results.
          </p>
        </div>
        <div className="catalogue-total">
          <strong>{number(manifest.counts.registeredStudies)}</strong>
          <span>registered studies</span>
        </div>
      </div>
      <RefreshStatus manifest={manifest} />
      <div className="catalogue-controls">
        <label className="search-box" htmlFor="registered-study-search">
          <Search size={19} />
          <span className="sr-only">Search registered studies</span>
          <Input
            id="registered-study-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Study title, treatment, sponsor or NCT number…"
          />
        </label>
        <div className="catalogue-filter-grid">
          <CatalogueSelect
            label="Recruitment status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All statuses' },
              ...Array.from(new Set(studies?.map((s) => s.status)))
                .sort()
                .map((value) => ({ value, label: value })),
            ]}
          />
          <CatalogueSelect
            label="Study type"
            value={type}
            onChange={(value) => {
              setType(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All study types' },
              ...Array.from(new Set(studies?.map((s) => s.studyType)))
                .sort()
                .map((value) => ({ value, label: value })),
            ]}
          />
          <CatalogueSelect
            label="Population"
            value={population}
            onChange={(value) => {
              setPopulation(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All ages' },
              {
                value: 'childhood',
                label: 'Childhood-related / children eligible',
              },
            ]}
          />
          <CatalogueSelect
            label="Results availability"
            value={postedResults}
            onChange={(value) => {
              setPostedResults(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All studies' },
              { value: 'posted', label: 'Results posted to registry' },
            ]}
          />
        </div>
      </div>
      <p className="source-note">
        Sorted by registry update. Recruitment status is registry-reported and
        may be out of date; check the linked record. Registries outside
        ClinicalTrials.gov are not included.
      </p>
      {!studies ? (
        <div className="catalogue-loading">
          {error ? (
            <>
              <p>Could not load registered studies.</p>
              <Button
                onClick={() => {
                  setError(false);
                  setAttempt((a) => a + 1);
                }}
              >
                Retry download
              </Button>
            </>
          ) : (
            <output>Loading registered studies…</output>
          )}
        </div>
      ) : (
        <>
          <div className="results-line">
            <output>
              <strong>{number(results.length)}</strong> matching studies
            </output>
            <Button
              variant="ghost"
              onClick={() => {
                setQuery('');
                setStatus('all');
                setType('all');
                setPopulation('all');
                setPostedResults('all');
                setPage(1);
              }}
            >
              Reset filters
            </Button>
          </div>
          {results.length ? (
            <>
              <Pages page={currentPage} total={pages} onChange={setPage} />
              <div className="publication-list">
                {results
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((study) => (
                    <article
                      key={study.id}
                      className="publication catalogue-publication"
                    >
                      <div className="publication-year">
                        <span>{study.id}</span>
                        <strong>{study.studyType}</strong>
                        <span>{study.phases.join(' / ')}</span>
                      </div>
                      <div className="publication-body">
                        <div className="pub-meta">
                          <span className="badge">{study.status}</span>
                          <span
                            className={`badge ${study.hasResults ? '' : 'conference'}`}
                          >
                            {study.hasResults
                              ? 'Registry results posted'
                              : 'No registry results posted'}
                          </span>
                        </div>
                        <h2>
                          <a href={study.url} target="_blank" rel="noreferrer">
                            {study.title}
                            <ArrowUpRight size={18} />
                          </a>
                        </h2>
                        <p className="authors">{study.sponsor}</p>
                        <p>
                          {study.interventions.join(' · ') ||
                            study.conditions.join(' · ')}
                        </p>
                        <p className="source-note">
                          Updated {study.updated || 'unknown'} · Started{' '}
                          {study.startDate || 'unknown'}
                        </p>
                        <details className="paper-details">
                          <summary>
                            Study details & linked references{' '}
                            <ChevronDown size={16} />
                          </summary>
                          <div>
                            <dl className="record-facts">
                              <dt>Conditions</dt>
                              <dd>{study.conditions.join(' · ')}</dd>
                              <dt>Enrollment</dt>
                              <dd>
                                {study.enrollment ?? 'Not supplied'}{' '}
                                {study.enrollmentType.toLowerCase()}
                              </dd>
                              <dt>Age eligibility</dt>
                              <dd>{study.ages || 'Not supplied'}</dd>
                              <dt>First registered</dt>
                              <dd>{study.firstPosted || 'Not supplied'}</dd>
                              <dt>Omics / method labels</dt>
                              <dd>
                                {study.methods.join(' · ') ||
                                  'No label detected'}
                              </dd>
                            </dl>
                            {study.pmids.length ? (
                              <>
                                <p className="source-note">
                                  Registry-linked references may include
                                  background papers, not only study results.
                                </p>
                                <div className="reference-line">
                                  {study.pmids.map((pmid) => (
                                    <a
                                      key={pmid}
                                      href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      PMID {pmid} ↗
                                    </a>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p>
                                No PubMed references supplied by the registry.
                              </p>
                            )}
                          </div>
                        </details>
                      </div>
                    </article>
                  ))}
              </div>
              <Pages page={currentPage} total={pages} onChange={setPage} />
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No matching studies</EmptyTitle>
                <EmptyDescription>
                  Try a broader term or reset the filters.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </>
      )}
      <Coverage manifest={manifest} />
    </>
  );
}
