'use client';
import { useState } from 'react';
import {
  PublicationCatalogue,
  StudyCatalogue,
  CatalogueLandscape,
  useManifest,
} from './catalogue';
import { type CatalogueFilters } from '@/lib/catalogue';
import PubMedSearch from './home-content';

import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Network,
  FlaskConical,
  Fingerprint,
  Activity,
  Microscope,
  ScanLine,
  HeartPulse,
  Search,
  X,
  ChevronDown,
  CircleHelp,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  publications,
  researchAreas,
  treatments,
  filterPublications,
  getPublication,
  type SourceKind,
} from '@/lib/research';
const icons = [
  FlaskConical,
  Microscope,
  Fingerprint,
  Activity,
  ScanLine,
  HeartPulse,
];
const badgeClass = (kind: string) =>
  kind === 'Conference abstract'
    ? 'conference'
    : kind === 'Sponsor update'
      ? 'update'
      : '';
const kinds: SourceKind[] = [
  'Journal article',
  'Conference abstract',
  'Sponsor update',
];
function SourceLink({ id }: { id: string }) {
  const p = getPublication(id);
  return (
    <a className="source-pill" href={p.url} target="_blank" rel="noreferrer">
      {p.authors.split(' et al.')[0]} · {p.year}
      <ArrowUpRight size={13} />
    </a>
  );
}
function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(String(v))}
      items={options}
    >
      <SelectTrigger className="filter-select" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <span>
        Broad literature catalogue with a selected editorial overview. Read the
        original sources to assess the evidence.
      </span>
      <a href="https://github.com/JunjiePeng/sjd-publications">
        Project on GitHub ↗
      </a>
      <span>Overview reviewed 08 Sep 2026</span>
    </footer>
  );
}
export default function Home() {
  const [view, setView] = useState('publications');
  const {
    manifest,
    error: manifestError,
    retry: retryManifest,
  } = useManifest();
  const [catalogueInitial, setCatalogueInitial] = useState<
    Partial<CatalogueFilters>
  >({});
  const [catalogueVisit, setCatalogueVisit] = useState(0);
  function openCatalogue(filters: Partial<CatalogueFilters>) {
    setCatalogueInitial(filters);
    setCatalogueVisit((v) => v + 1);
    setView('publications');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  const [selected, setSelected] = useState('therapies');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('newest');
  const [drug, setDrug] = useState('ianalumab');
  const area = researchAreas.find((a) => a.id === selected)!;
  const records = filterPublications(query, topic, kind, sort);
  const treatment = treatments.find((t) => t.id === drug)!;
  function showPapers(id: string) {
    setTopic(id);
    setQuery('');
    setKind('all');
    setView('readings');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="masthead shell">
        <a
          className="brand"
          href="#main-content"
          onClick={() => setView('overview')}
          aria-label="SjD Research Explorer home"
        >
          <span className="monogram">SjD</span>
          <span>
            <span className="brand-name">Research Explorer</span>
            <span className="brand-sub" style={{ display: 'block' }}>
              Sjögren’s disease
            </span>
          </span>
        </a>
        <span className="header-note">
          <span className="status-dot" /> SjD & childhood-onset SjD
        </span>
      </header>
      <Tabs
        value={view}
        onValueChange={(v) => setView(String(v))}
        className="main-tabs"
      >
        <div className="nav-wrap">
          <div className="shell">
            <TabsList variant="line" className="nav-tabs">
              <TabsTrigger value="publications" className="nav-tab">
                <BookOpen size={17} /> Publications
                {manifest && (
                  <span className="nav-count">
                    {manifest.counts.publications.toLocaleString()}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="studies" className="nav-tab">
                <FlaskConical size={17} /> Registered studies
                {manifest && (
                  <span className="nav-count">
                    {manifest.counts.registeredStudies.toLocaleString()}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="overview" className="nav-tab">
                <Network size={17} /> Research overview
              </TabsTrigger>
              <TabsTrigger value="readings" className="nav-tab">
                Selected readings
              </TabsTrigger>
              <TabsTrigger value="pubmed" className="nav-tab">
                <Search size={17} /> PubMed search
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        <main id="main-content">
          <TabsContent value="publications" className="page shell">
            {manifest ? (
              <PublicationCatalogue
                key={catalogueVisit}
                manifest={manifest}
                initial={catalogueInitial}
              />
            ) : (
              <div className="catalogue-loading">
                {manifestError ? (
                  <>
                    <h1>Catalogue temporarily unavailable</h1>
                    <p>Please retry the download.</p>
                    <button className="text-link" onClick={retryManifest}>
                      Retry
                    </button>
                  </>
                ) : (
                  <output>Loading catalogue coverage…</output>
                )}
              </div>
            )}
            <Footer />
          </TabsContent>
          <TabsContent value="studies" className="page shell">
            {manifest ? (
              <StudyCatalogue manifest={manifest} />
            ) : (
              <div className="catalogue-loading">
                {manifestError ? (
                  <button className="text-link" onClick={retryManifest}>
                    Retry study catalogue
                  </button>
                ) : (
                  <output>Loading study coverage…</output>
                )}
              </div>
            )}
            <Footer />
          </TabsContent>
          <TabsContent value="overview" className="page shell">
            <div className="heading">
              <div>
                <p className="eyebrow">01 / Research overview</p>
                <h1>The SjD research landscape</h1>
                <p className="subtitle">
                  Explore the evidence, the emerging directions, and the
                  questions still open.
                </p>
              </div>
              <p className="date-stamp">
                Evidence checked<strong>08 September 2026</strong>
              </p>
            </div>
            <section className="snapshot" aria-label="Research snapshot">
              <div>
                <p className="eyebrow">The field at a glance</p>
                <h2>
                  From shared symptoms
                  <br />
                  toward targeted treatment.
                </h2>
              </div>
              <div>
                <p className="eyebrow">Full research catalogue</p>
                <div className="snapshot-stat">
                  {manifest
                    ? manifest.counts.publications.toLocaleString()
                    : '…'}
                  <span>publication records</span>
                </div>
                <p>
                  {manifest
                    ? manifest.counts.registeredStudies.toLocaleString()
                    : '…'}{' '}
                  registered studies · all publication years
                </p>
                <button className="text-link" onClick={() => openCatalogue({})}>
                  Browse the catalogue <ArrowRight size={16} />
                </button>
              </div>
              <div>
                <p className="eyebrow">A central research question</p>
                <h2>What works, for whom?</h2>
                <p>Connecting biology to patient outcomes.</p>
              </div>
            </section>
            {manifest && (
              <CatalogueLandscape manifest={manifest} open={openCatalogue} />
            )}
            <div className="section-heading">
              <div>
                <h2>Selected findings & open questions</h2>
                <p>
                  Select an area to see its findings and unanswered questions.
                </p>
              </div>
              <span className="mini-label">6 connected areas</span>
            </div>
            <section
              className="explorer"
              aria-label="Interactive research overview"
            >
              <div className="area-grid">
                {researchAreas.map((a, i) => {
                  const Icon = icons[i];
                  return (
                    <button
                      key={a.id}
                      className="area"
                      aria-pressed={selected === a.id}
                      aria-controls="research-detail"
                      onClick={() => setSelected(a.id)}
                    >
                      <span className="area-top">
                        <Icon
                          className="area-icon"
                          size={25}
                          strokeWidth={1.5}
                        />
                        <span className="area-number">0{i + 1}</span>
                      </span>
                      <h3>{a.title}</h3>
                      <span className="area-label">{a.label}</span>
                      <ArrowRight className="area-arrow" size={17} />
                    </button>
                  );
                })}
              </div>
              <article
                className="detail"
                id="research-detail"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="badge">{area.status}</span>
                <h3>{area.headline}</h3>
                <p>{area.summary}</p>
                <div className="finding">
                  <h4>What the evidence shows</h4>
                  <p>{area.finding}</p>
                  <div className="source-links">
                    {area.ids.map((id) => (
                      <SourceLink key={id} id={id} />
                    ))}
                  </div>
                </div>
                <div className="question">
                  <h4>The open question</h4>
                  <p>{area.question}</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => showPapers(area.id)}
                >
                  Read selected sources in this area <ArrowRight size={16} />
                </button>
                <span className="source-note">
                  Editorial synthesis · see each source’s design and
                  limitations.
                </span>
              </article>
            </section>
            <aside className="childhood-link">
              <div>
                <strong>Looking for childhood-onset SjD?</strong>
                <p>
                  The catalogue includes childhood-related publications and
                  studies. The editorial summaries below remain mainly
                  adult-focused.
                </p>
              </div>
              <button
                className="text-link"
                onClick={() => openCatalogue({ population: 'childhood' })}
              >
                Childhood SjD publications <ArrowRight size={16} />
              </button>
            </aside>
            <section className="treatment-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">From mechanism to clinical evidence</p>
                  <h2>Selected therapeutic developments</h2>
                </div>
                <span className="mini-label">Select a treatment</span>
              </div>
              <div className="treatment-card">
                <Table className="treatment-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Treatment / target</TableHead>
                      <TableHead scope="col">Evidence included</TableHead>
                      <TableHead scope="col">Development context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatments.map((t) => (
                      <TableRow
                        key={t.id}
                        data-state={t.id === drug ? 'selected' : undefined}
                      >
                        <TableCell>
                          <button
                            onClick={() => setDrug(t.id)}
                            aria-pressed={t.id === drug}
                            aria-controls="treatment-detail"
                            className="drug-button"
                          >
                            <span className="drug-marker" />
                            <span>
                              <strong>{t.name}</strong>
                              <small>{t.mechanism}</small>
                            </span>
                            <ArrowRight size={15} />
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className={`badge ${badgeClass(t.kind)}`}>
                            {t.evidence}
                          </span>
                          <small>{t.note}</small>
                        </TableCell>
                        <TableCell>{t.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div
                  className="treatment-detail"
                  id="treatment-detail"
                  aria-live="polite"
                >
                  <span className="eyebrow">
                    Reading the evidence / {treatment.name}
                  </span>
                  <p>{treatment.detail}</p>
                  <div className="source-links">
                    <SourceLink id={treatment.id} />
                    {treatment.statusId !== treatment.id && (
                      <SourceLink id={treatment.statusId} />
                    )}
                  </div>
                </div>
              </div>
              <p className="source-note">
                Selected programmes, not an exhaustive pipeline. Different
                populations, endpoints and follow-up periods prevent direct
                efficacy ranking. Status is tied to the cited dated source.
              </p>
            </section>
            <section className="reading-note">
              <CircleHelp size={23} strokeWidth={1.5} />
              <div>
                <h3>A note on “progress”</h3>
                <p>
                  Mechanistic findings explain biology; trials test
                  interventions; regulatory decisions apply to specific
                  indications and places. Open questions here are editorial
                  synthesis, not established findings.
                </p>
              </div>
            </section>
            <details className="methodology">
              <summary>
                Scope, evidence labels & key terms <ChevronDown size={17} />
              </summary>
              <div className="method-grid">
                <div>
                  <h3>How the editorial overview was assembled</h3>
                  <p>
                    A selective starting collection of landmark classification
                    and outcome papers, patient-stratification studies, recent
                    tissue research and therapeutic developments. Sources were
                    checked on 8 September 2026. These selected interpretations
                    are separate from the complete, automatically refreshed
                    catalogue.
                  </p>
                  <p>
                    Publication titles are shortened for readability. Dates use
                    the cited journal issue or announcement. No citation-count
                    or evidence-quality scores are inferred.
                  </p>
                </div>
                <div>
                  <h3>How to read the labels</h3>
                  <p>
                    <strong>Journal article:</strong> a published research
                    paper. <strong>Conference abstract:</strong> a shorter
                    conference report. <strong>Sponsor update:</strong> a
                    company’s account of development or regulatory events.
                  </p>
                  <p>
                    <strong>ESSDAI:</strong> systemic disease activity.{' '}
                    <strong>ClinESSDAI:</strong> its clinical version without
                    the biological domain. <strong>ESSPRI:</strong>{' '}
                    patient-reported dryness, fatigue and pain.{' '}
                    <strong>Sicca:</strong> dryness symptoms.{' '}
                    <a
                      href={getPublication('star').url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Endpoint reference ↗
                    </a>
                  </p>
                </div>
              </div>
            </details>
            <Footer />
          </TabsContent>
          <TabsContent value="readings" className="page shell">
            <div className="heading">
              <div>
                <p className="eyebrow">Selected editorial reading list</p>
                <h1>Selected readings, with context</h1>
                <p className="subtitle">
                  References supporting the overview, with findings and
                  limitations. The Publications tab contains the full research
                  catalogue.
                </p>
              </div>
              <p className="date-stamp">
                Curated collection
                <strong>{publications.length} sources · 2017–2026</strong>
              </p>
            </div>
            <div className="library-toolbar">
              <label className="search-box">
                <Search size={19} />
                <span className="sr-only">Search publications</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a topic, treatment, author or DOI…"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </label>
              <Filter
                label="Filter by research area"
                value={topic}
                onChange={setTopic}
                options={[
                  { value: 'all', label: 'All research areas' },
                  ...researchAreas.map((a) => ({
                    value: a.id,
                    label: a.title,
                  })),
                ]}
              />
              <Filter
                label="Filter by source type"
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'all', label: 'All source types' },
                  ...kinds.map((k) => ({ value: k, label: k })),
                ]}
              />
            </div>
            <div className="results-line">
              <output>
                Showing <strong>{records.length}</strong> of{' '}
                {publications.length} sources
                {topic !== 'all' && (
                  <> · {researchAreas.find((a) => a.id === topic)?.title}</>
                )}
              </output>
              <Filter
                label="Sort publications"
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                ]}
              />
            </div>
            <div className="publication-list">
              {records.length === 0 ? (
                <Empty className="empty-state">
                  <EmptyHeader>
                    <Search size={28} />
                    <EmptyTitle>No matching publications</EmptyTitle>
                    <EmptyDescription>
                      Try a treatment name, a broader term, or reset the
                      filters.
                    </EmptyDescription>
                  </EmptyHeader>
                  <button
                    className="text-link"
                    onClick={() => {
                      setQuery('');
                      setTopic('all');
                      setKind('all');
                    }}
                  >
                    Reset search and filters <ArrowRight size={15} />
                  </button>
                </Empty>
              ) : (
                records.map((p) => (
                  <article className="publication" key={p.id}>
                    <div className="publication-year">
                      {p.year}
                      <span>{p.journal}</span>
                    </div>
                    <div className="publication-body">
                      <div className="pub-meta">
                        <span className={`badge ${badgeClass(p.kind)}`}>
                          {p.kind}
                        </span>
                        <span>{p.design}</span>
                      </div>
                      <h2>
                        <a href={p.url} target="_blank" rel="noreferrer">
                          {p.title}
                          <ArrowUpRight size={18} />
                        </a>
                      </h2>
                      <p className="authors">{p.authors}</p>
                      <p className="pub-summary">{p.summary}</p>
                      <details className="paper-details">
                        <summary>
                          Limitations & reference <ChevronDown size={16} />
                        </summary>
                        <div>
                          <p>{p.limitation}</p>
                          <div className="reference-line">
                            {p.doi && (
                              <a
                                href={`https://doi.org/${p.doi}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                DOI: {p.doi} ↗
                              </a>
                            )}
                            {p.trial && (
                              <a
                                href={`https://clinicaltrials.gov/study/${p.trial}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Trial: {p.trial} ↗
                              </a>
                            )}
                            <a href={p.url} target="_blank" rel="noreferrer">
                              Original source ↗
                            </a>
                          </div>
                        </div>
                      </details>
                      <div className="topic-tags">
                        {p.topics.map((id) => (
                          <button
                            key={id}
                            onClick={() => {
                              setTopic(id);
                              setQuery('');
                              setKind('all');
                            }}
                          >
                            {researchAreas.find((a) => a.id === id)?.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
            <p className="source-note">
              Titles are shortened. Journal papers, conference abstracts and
              sponsor announcements are labelled separately. Inclusion does not
              imply endorsement.
            </p>
            <Footer />
          </TabsContent>
          <TabsContent value="pubmed" className="page shell">
            <PubMedSearch />
            <Footer />
          </TabsContent>
        </main>
      </Tabs>
    </>
  );
}
