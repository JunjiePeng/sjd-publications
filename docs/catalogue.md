# Catalogue coverage and maintenance

The catalogue retrieves complete result sets for the queries recorded in `public/data/manifest.json`. “All publications” means all retained matches in this snapshot, with no default date, language, population, design or publication-type restriction. It does not mean every study in existence.

## Sources and completeness

1. **Europe PMC:** title/abstract name variants and the historical Sjogren’s Syndrome MeSH heading, restricted to MED (PubMed), PMC-only and PPR (preprint) sources. Core metadata are retrieved with cursor pagination. A fresh, compact identifier enumeration is checked against the reported count; records added while metadata downloaded are reconciled by identifier. An incomplete enumeration aborts the update.
2. **PubMed:** MeSH plus title/abstract and keyword variants of Sjogren, Sjögren, Sjøgren and Sjoegren. ESearch results above 9,999 are recursively divided by publication date, including a complementary out-of-range/undated query. Unique identifiers must equal the unfiltered total. All matches missing from Europe PMC results are retrieved with EFetch and checked batch by batch. Records before 1000 or after 2100 are not silently excluded: the complementary query retrieves them, and aborts if it itself exceeds the API limit.
3. **ClinicalTrials.gov:** the same name variants, including explicit straight/curly possessive and plural forms, in the condition search, with all study types, statuses, ages and result-availability states. Pagination must reach the reported total. Observational studies and unpublished registrations are retained. Other registries are not comprehensively covered.

Queries emphasize recall. A record can discuss SjD incidentally, and important papers without matching names or indexing can be absent. Searches in other bibliographic databases, registries, conference websites and research repositories remain useful. This catalogue is not a systematic review or a quality assessment.

## Identifiers, exclusions and rights

Shared PMIDs are merged. DOI matching merges records without conflicting PMIDs; ambiguous shared DOIs remain separate. Distinct PMIDs are retained even if a publisher supplied the same DOI; preprint versions remain separate from journal versions. These are counts of publication records, not unique underlying research projects. One trial can have multiple papers.

Explicit Sjögren–Larsson or Marinesco–Sjögren titles are excluded only when there is no independent SjD name in the title or specific SjD MeSH heading. Mixed comparisons are preserved. Excluded identifiers are published in `exclusions.json` for inspection. Historical Gougerot-Sjögren terminology is retained.

Only bibliographic metadata and limited public study fields are published. Abstracts are used transiently to derive discovery labels; full abstracts, full texts, affiliations and contact details are not republished. Links lead to original records and publisher texts. Copyright and access conditions apply at those sources.

## Discovery labels

The site preserves every original publication-type label and offers a separate exact filter. Broader design categories and omics methods are inferred from indexing and title/abstract terms. Clinical-trial labels use indexed trial types or strong trial terms in the title; a review mentioning a trial in its abstract is not automatically a trial report. Unknown records remain “Other / unclassified.”

The twelve molecular categories include genomics/genetics, transcriptomics, single-cell, spatial omics, proteomics, metabolomics, epigenomics, microbiome/metagenomics, multi-omics, lipidomics, glycomics and immune repertoire. They overlap. A method may be discussed rather than performed, and papers can use unrecognized vocabulary. Genetics is deliberately broader than genome-wide experiments. Omics labels therefore describe discovery coverage, not validated study-method counts.

The childhood-related filter matches child, pediatric/paediatric, juvenile, adolescent and infant terminology in metadata. Registry entries also qualify when children are eligible. This does not establish childhood onset or exclusive pediatric enrollment. Absence of a label is not proof that a record is irrelevant.

## Publication format and link destinations

Format labels use the original publication types and conservative title signals. An exact `Abstract` or `Poster` type takes precedence over the generic `Journal Article` type. `English Abstract` describes the language of an abstract and does not make a publication abstract-only. Abstract collections are separate from individual abstracts. Conference proceedings and meeting reports are not assumed to be abstracts; they receive a separate label. A generic indexed journal-article type does not independently verify the full publication format. Unclear formats remain included by default, and the format filter can hide recognised abstracts, posters and abstract collections.

The title still links to the original source record. A visible destination label explains when that is a PubMed record/abstract page, which can describe a full journal article. Publisher DOI and PMC links are shown when identifiers are available. A PMC identifier alone is never used to classify an item as a full article: PMC also hosts conference abstracts and abstract collections. Publisher access may require a subscription. These labels do not claim that every abstract-only publication has been identified.

## Sample filters and reading history

Twenty-four overlapping specimen categories cover blood fractions, saliva, gland and other tissues, tears, microbiome specimens and cell models. `scripts/sample_labels.py` derives labels from titles, abstracts and subject headings/keywords during every refresh. Each label records its source and either “mention” or “sampling” evidence. Sampling evidence requires a nearby sampling/assay term in an abstract sentence, suppresses explicit negated sampling sentences, and is not assigned to indexed reviews, meta-analyses, editorials or comments. It is still an automated metadata hint, not a full-text verification of actual sample use. The UI explains this distinction and allows stronger-evidence filtering. Unknown samples remain discoverable; lack of a label does not mean no samples were used. Human and animal specimens are not separately classified. Counts are catalogue-wide and overlapping.

Read marks are explicit user actions, stored as one timestamp per stable paper identifier in this origin’s localStorage. PMID is preferred, then normalized DOI, then a record ID; verified PMIDs link curated journal readings to catalogue entries. Changes propagate between open tabs. There is no server account or cross-device sync, and the public dataset contains no reading history. Clearing site data removes marks; private browsing may discard them when the session ends. Storage failures leave the current visit usable and show a warning that changes may not persist. Opening a paper does not automatically mark it read. The read/unread catalogue filter combines with all other filters.

## Dates and snapshots

Publication year comes from source bibliographic metadata (often the issue year). Original publication date, electronic date, indexing date, revision date and first-seen-in-this-catalogue are separate. “Newest publication” uses the source first publication/electronic date; undated entries sort last. No missing day is displayed as a confirmed day. A source may normalize an imprecise date internally for sorting. “Most recently added here” sorts first-seen timestamps, which are identical for the initial import.

The first complete snapshot is committed to the repository. Weekly scheduled runs refresh all sources, preserve first-seen dates, validate hashes/counts/known records, commit the new snapshot, and deploy that same data from GitHub Pages. If any source fails, incomplete data are discarded and the prior complete snapshot is retained. The failure attempt is visible separately from the last successful refresh. A reduction exceeding 5% requires investigation before replacement. Snapshots older than eight days show an overdue indicator.

GitHub schedules may be delayed or disabled for inactive public repositories. Check Actions if the site is overdue. A failed build or validation prevents deployment; the previous working site remains available. No claims are made about changes after the displayed refresh timestamp.

## Validation

`scripts/test_catalogue.py` tests pagination beyond PubMed’s 10,000-result limit, missing source fields, incremental index changes, incomplete retrieval rejection, deduplication, exclusions, nonexclusive labels and failure retention. `scripts/validate_catalogue.py` validates the committed snapshot, checks content hashes, unique identifiers, source totals, historical coverage and known SjD references. `scripts/test_filters.mjs` exercises filters against the actual complete snapshot. `scripts/test_samples.py` checks specimen extraction and provenance; `scripts/test_reading_history.mjs` checks persistence, identifier consistency, storage failures and cross-tab changes. These checks run in pull requests and before deployment.

Primary API references: [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25499/), [Europe PMC REST service](https://europepmc.org/RestfulWebService), [ClinicalTrials.gov API](https://clinicaltrials.gov/data-api/api).
