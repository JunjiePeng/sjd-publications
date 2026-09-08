export const REVIEW_DATE = '2026-09-08';
export type SourceKind =
  | 'Journal article'
  | 'Conference abstract'
  | 'Sponsor update';
export type Publication = {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  date: string;
  kind: SourceKind;
  design: string;
  topics: string[];
  summary: string;
  limitation: string;
  url: string;
  doi?: string;
  trial?: string;
};
export const publications: Publication[] = [
  {
    id: 'amgen-2026',
    title: 'Dazodalibep: phase 3 programme update',
    authors: 'Amgen',
    journal: 'Q2 2026 results',
    year: 2026,
    date: '2026-08',
    kind: 'Sponsor update',
    design: 'Pipeline update',
    topics: ['therapies', 'symptoms'],
    summary:
      'Amgen reports two phase 3 SjD studies underway, covering systemic disease activity and high symptom burden with low systemic activity.',
    limitation:
      'A programme update is not a report of phase 3 efficacy. Expected completion dates can change.',
    url: 'https://amgen.gcs-web.com/news-releases/news-release-details/amgen-reports-second-quarter-2026-financial-results',
  },
  {
    id: 'novartis-2026',
    title: 'Ianalumab: longer follow-up and development outlook',
    authors: 'Novartis',
    journal: 'Q2 2026 investor presentation',
    year: 2026,
    date: '2026-07-21',
    kind: 'Sponsor update',
    design: 'Development update',
    topics: ['therapies'],
    summary:
      'The July presentation includes pooled NEPTUNUS data and describes an anticipated US launch in the second half of 2026.',
    limitation:
      'A sponsor’s launch expectation is not regulatory approval. This source does not establish current US authorisation.',
    url: 'https://www.novartis.com/sites/novartis_com/files/q2-2026-investor-presentation.pdf',
  },
  {
    id: 'telitacicept-approval',
    title: 'Telitacicept: SjD indication approved in China',
    authors: 'RemeGen',
    journal: 'HKEX company announcement',
    year: 2026,
    date: '2026-06-08',
    kind: 'Sponsor update',
    design: 'Country-specific regulatory update',
    topics: ['therapies'],
    summary:
      'RemeGen reports NMPA approval for adults with active SjD (ESSDAI ≥5) on conventional therapy, following a phase 3 programme.',
    limitation:
      'The announcement concerns China. It does not establish approval, reimbursement or access in another country; consult the local label.',
    url: 'https://www.hkexnews.hk/listedco/listconews/sehk/2026/0608/2026060801486.pdf',
  },
  {
    id: 'nipocalimab',
    title: 'Nipocalimab in active SjD: the DAHLIAS trial',
    authors: 'Noaiseh G et al.',
    journal: 'The Lancet',
    year: 2025,
    date: '2025-11-22',
    kind: 'Journal article',
    design: 'Phase 2 randomised trial · 163 participants',
    topics: ['therapies'],
    summary:
      'The higher-dose FcRn-blockade group improved clinical systemic activity at week 24 versus placebo. The lower-dose comparison did not reach statistical significance.',
    limitation:
      'Participants were anti-Ro IgG positive. The results do not establish efficacy in seronegative SjD or long-term disease modification.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41284548/',
    doi: '10.1016/S0140-6736(25)01430-8',
    trial: 'NCT04968912',
  },
  {
    id: 'ianalumab',
    title: 'Ianalumab: phase 3 results from NEPTUNUS-1 and NEPTUNUS-2',
    authors: 'Grader-Beck T et al.',
    journal: 'ACR Convergence · LB24',
    year: 2025,
    date: '2025-10-29',
    kind: 'Conference abstract',
    design: 'Two phase 3 randomised trials',
    topics: ['therapies'],
    summary:
      'Both trials met their primary systemic disease activity endpoint. The placebo-adjusted changes were modest and require interpretation alongside symptom and safety outcomes.',
    limitation:
      'This record links to a conference abstract, not a full journal report. Statistical significance does not establish benefit for every symptom or patient.',
    url: 'https://acrabstracts.org/abstract/ianalumab-demonstrates-significant-reduction-in-disease-activity-in-patients-with-sjogrens-disease-efficacy-and-safety-results-from-two-global-phase-3-randomized-placebo-controlled-double-blind-s/',
    trial: 'NCT05350072',
  },
  {
    id: 'inamo',
    title: 'Distinct immune and tissue patterns across antibody-defined SjD',
    authors: 'Inamo J, Takeshita M et al.',
    journal: 'Nature Communications',
    year: 2025,
    date: '2025-09-22',
    kind: 'Journal article',
    design: 'Single-cell & spatial tissue study',
    topics: ['biology', 'subtypes'],
    summary:
      'Salivary-gland profiling identified shared cytotoxic T-cell expansion, antibody-associated signalling differences and inflammatory fibroblast populations.',
    limitation:
      'A tissue association study does not prove causality or validate a test for selecting treatment. External and prospective validation is needed.',
    url: 'https://www.nature.com/articles/s41467-025-63935-9',
    doi: '10.1038/s41467-025-63935-9',
  },
  {
    id: 'nayar',
    title: 'Mapping tertiary lymphoid structures in salivary glands',
    authors: 'Nayar S, Turner JD, Asam S et al.',
    journal: 'Nature Communications',
    year: 2025,
    date: '2025-01-02',
    kind: 'Journal article',
    design: 'Spatial multi-omics & functional studies',
    topics: ['biology'],
    summary:
      'Single-cell sequencing, spatial transcriptomics, proteomics and functional work map the cellular organization of local immune structures.',
    limitation:
      'The study generates mechanistic and therapeutic hypotheses; it does not demonstrate clinical benefit from targeting these structures.',
    url: 'https://www.nature.com/articles/s41467-024-54686-0',
    doi: '10.1038/s41467-024-54686-0',
  },
  {
    id: 'dazodalibep',
    title: 'Dazodalibep: blocking CD40 ligand in two SjD populations',
    authors: 'St. Clair EW, Baer AN, Ng WF et al.',
    journal: 'Nature Medicine',
    year: 2024,
    date: '2024-06-05',
    kind: 'Journal article',
    design: 'Phase 2 randomised trial · 183 participants',
    topics: ['therapies', 'symptoms'],
    summary:
      'The systemic-activity population and the high-symptom-burden population each met their respective primary endpoint at day 169.',
    limitation:
      'The populations used different endpoints. These phase 2 findings require confirmation and cannot be used to rank drugs across trials.',
    url: 'https://www.nature.com/articles/s41591-024-03009-3',
    doi: '10.1038/s41591-024-03009-3',
    trial: 'NCT04129164',
  },
  {
    id: 'telitacicept',
    title: 'Telitacicept: a phase 2 study of dual BAFF/APRIL inhibition',
    authors: 'Xu D et al.',
    journal: 'Rheumatology',
    year: 2024,
    date: '2024-03-01',
    kind: 'Journal article',
    design: 'Phase 2 randomised trial · 42 participants',
    topics: ['therapies'],
    summary:
      'The 160 mg group improved systemic disease activity versus placebo at week 24; the 240 mg comparison did not reach statistical significance.',
    limitation:
      'The trial was small and anti-SSA positive. Its results alone cannot establish long-term safety or generalisability.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37399108/',
    doi: '10.1093/rheumatology/kead265',
    trial: 'NCT04078386',
  },
  {
    id: 'star',
    title: 'STAR: developing a multidomain treatment-response measure',
    authors: 'Seror R et al.',
    journal: 'Annals of the Rheumatic Diseases',
    year: 2022,
    date: '2022-07',
    kind: 'Journal article',
    design: 'Endpoint development & preliminary validation',
    topics: ['outcomes'],
    summary:
      'Trial reanalysis and expert–patient consensus produced a composite score spanning systemic activity, symptoms, gland function and biological measures.',
    limitation:
      'This is a measurement-development study. Performance and thresholds need evaluation in the context of each trial.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9209686/',
    doi: '10.1136/annrheumdis-2021-222054',
  },
  {
    id: 'cress',
    title: 'CRESS: assessing response across five complementary domains',
    authors: 'Arends S et al.',
    journal: 'The Lancet Rheumatology',
    year: 2021,
    date: '2021-08',
    kind: 'Journal article',
    design: 'Endpoint development & validation',
    topics: ['outcomes'],
    summary:
      'CRESS combines clinical systemic activity, patient symptoms, tear function, salivary function and serology into a response measure.',
    limitation:
      'Composite measures can capture several dimensions, but different definitions can classify the same patient differently.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38287621/',
    doi: '10.1016/S2665-9913(21)00122-3',
  },
  {
    id: 'tarn',
    title: 'Symptom-based subgroups across international SjD cohorts',
    authors: 'Tarn JR et al.',
    journal: 'The Lancet Rheumatology',
    year: 2019,
    date: '2019-10',
    kind: 'Journal article',
    design: 'Observational cohorts & trial reanalysis',
    topics: ['subtypes', 'symptoms'],
    summary:
      'Four symptom-based groups were identified in the UK registry and examined in independent cohorts. Trial reanalyses suggested differences in treatment response.',
    limitation:
      'Retrospective subgroup signals are hypothesis-generating and require prospective testing before directing treatment.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38229348/',
  },
  {
    id: 'criteria',
    title: 'The 2016 ACR/EULAR framework for classifying primary SjD',
    authors: 'Shiboski CH et al.',
    journal: 'Annals of the Rheumatic Diseases',
    year: 2017,
    date: '2017-01',
    kind: 'Journal article',
    design: 'Consensus & international cohort validation',
    topics: ['diagnosis'],
    summary:
      'A weighted combination of anti-SSA, gland biopsy, ocular tests and salivary flow standardises classification for research.',
    limitation:
      'Classification criteria support consistent study populations; they are not a stand-alone diagnostic tool for an individual.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27789466/',
    doi: '10.1136/annrheumdis-2016-210571',
  },
];
export const researchAreas = [
  {
    id: 'therapies',
    title: 'Targeted therapies',
    label: 'Clinical trials & regulatory progress',
    status: 'Clinical evidence',
    headline: 'The therapeutic landscape is changing.',
    summary:
      'Trials are testing B-cell pathways, immune co-stimulation and antibody recycling. Regulatory progress now differs by country.',
    finding:
      'Ianalumab phase 3 results, published phase 2 studies and China’s telitacicept approval mark different kinds of progress.',
    question:
      'Which patients benefit most, and how durable are improvements in symptoms and organ disease?',
    ids: ['ianalumab', 'dazodalibep', 'nipocalimab', 'telitacicept-approval'],
  },
  {
    id: 'biology',
    title: 'Tissue & immune biology',
    label: 'Single-cell & spatial studies',
    status: 'Mechanistic evidence',
    headline: 'Looking inside the inflamed gland.',
    summary:
      'Spatial and single-cell approaches reveal how immune and tissue cells organize inflammation.',
    finding:
      'Recent studies map local lymphoid structures and identify inflammatory fibroblast populations alongside immune-cell changes.',
    question:
      'Which tissue processes cause disease, and which can be modified safely in people?',
    ids: ['nayar', 'inamo'],
  },
  {
    id: 'subtypes',
    title: 'Patient heterogeneity',
    label: 'Biological & symptom-based groups',
    status: 'Observational evidence',
    headline: 'One diagnosis, different patterns.',
    summary:
      'Clinical symptoms and antibody-associated tissue profiles reveal different patterns within SjD.',
    finding:
      'Cohort studies identify symptom subgroups; tissue studies show distinct signalling in anti-SSA and anti-centromere profiles.',
    question:
      'Can these groups prospectively predict treatment response in independent populations?',
    ids: ['tarn', 'inamo'],
  },
  {
    id: 'outcomes',
    title: 'Measuring what matters',
    label: 'Symptoms, activity & function',
    status: 'Endpoint development',
    headline: 'Response has more than one dimension.',
    summary:
      'Systemic activity, patient symptoms and gland function capture different aspects of SjD.',
    finding:
      'STAR and CRESS combine multiple domains to assess treatment response more broadly than a single measure.',
    question:
      'Which endpoints best capture durable, meaningful improvement for patients?',
    ids: ['star', 'cress'],
  },
  {
    id: 'diagnosis',
    title: 'Classification & diagnosis',
    label: 'Consistent research populations',
    status: 'Validated classification',
    headline: 'Defining who enters a study.',
    summary:
      'The ACR/EULAR framework combines antibody, biopsy and objective glandular tests to define research populations.',
    finding:
      'Its weighted criteria offer a shared framework for studies. Clinical diagnosis still needs individual assessment.',
    question:
      'How can research better represent people missed by conventional recruitment criteria?',
    ids: ['criteria'],
  },
  {
    id: 'symptoms',
    title: 'Symptoms & daily life',
    label: 'Dryness, fatigue & pain',
    status: 'Patient-centred research',
    headline: 'Symptoms deserve their own evidence.',
    summary:
      'A low systemic activity score can coexist with substantial symptoms. Dedicated study populations make these experiences visible.',
    finding:
      'The dazodalibep phase 2 programme included a high-symptom-burden group with limited systemic activity.',
    question:
      'Can future studies improve daily function and symptoms across the full spectrum of SjD?',
    ids: ['dazodalibep', 'tarn', 'amgen-2026'],
  },
];
export const treatments = [
  {
    id: 'ianalumab',
    name: 'Ianalumab',
    mechanism: 'BAFF receptor / B cells',
    evidence: 'Phase 3 results reported',
    note: 'NEPTUNUS-1 & 2 · ACR 2025',
    kind: 'Conference abstract',
    status: 'Sponsor development update · Jul 2026',
    statusId: 'novartis-2026',
    detail:
      'The two trials reported positive primary endpoints. A July 2026 sponsor outlook anticipates a US launch; that expectation is not evidence of approval.',
  },
  {
    id: 'telitacicept',
    name: 'Telitacicept',
    mechanism: 'BAFF + APRIL',
    evidence: 'Phase 2 published; phase 3 reported',
    note: 'Phase 2 · Rheumatology 2024',
    kind: 'Journal article',
    status: 'China approval reported · Jun 2026',
    statusId: 'telitacicept-approval',
    detail:
      'The Chinese indication reported by RemeGen covers adults with active disease (ESSDAI ≥5) on conventional therapy. Approval does not automatically extend to other countries.',
  },
  {
    id: 'dazodalibep',
    name: 'Dazodalibep',
    mechanism: 'CD40 ligand',
    evidence: 'Phase 2 published',
    note: 'Nature Medicine · 2024',
    kind: 'Journal article',
    status: 'Phase 3 underway · Aug 2026 update',
    statusId: 'amgen-2026',
    detail:
      'Phase 2 included both systemic-activity and symptom-burden populations. Amgen’s Q2 2026 update describes two phase 3 trials underway; confirmatory results are not established by that update.',
  },
  {
    id: 'nipocalimab',
    name: 'Nipocalimab',
    mechanism: 'Neonatal Fc receptor (FcRn)',
    evidence: 'Phase 2 published',
    note: 'DAHLIAS · The Lancet 2025',
    kind: 'Journal article',
    status: 'Proof of concept in anti-Ro-positive SjD',
    statusId: 'nipocalimab',
    detail:
      'The higher-dose group improved clinical systemic activity versus placebo at week 24. The study does not establish benefit in seronegative disease.',
  },
];
export function filterPublications(
  query = '',
  topic = 'all',
  kind = 'all',
  sort = 'newest',
) {
  const normalise = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const terms = normalise(query).trim().split(/\s+/).filter(Boolean);
  return publications
    .filter(
      (p) =>
        (topic === 'all' || p.topics.includes(topic)) &&
        (kind === 'all' || p.kind === kind) &&
        terms.every((term) =>
          normalise(
            [
              p.title,
              p.authors,
              p.journal,
              p.summary,
              p.design,
              p.year,
              p.doi,
              p.trial,
              ...p.topics,
            ].join(' '),
          ).includes(term),
        ),
    )
    .sort((a, b) =>
      sort === 'oldest'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
}
export const getPublication = (id: string) =>
  publications.find((p) => p.id === id)!;
