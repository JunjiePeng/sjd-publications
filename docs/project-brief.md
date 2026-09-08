# Project brief

Decision date: 8 September 2026.

## Purpose and audience

Make it easier for Junjie Peng to follow new Sjögren’s disease research. This is a compact research workspace primarily for personal use. The owner permits a public website and public GitHub repository.

Keep this project, navigation, design, content and deployment independent from the public engagement website.

## Agreed direction

- A regularly updated publication feed.
- Search and filters by topic, childhood disease and study type.
- Titles, authors, journal, publication date and links to original records.
- Saved papers and read/unread status.
- Potential later additions: personal notes and a view of papers added since the previous visit.
- Selected summaries may cover the research question, finding, limitations and relevance. Such summaries need review and a clear distinction from the authors’ claims.

## Data and update design

Start with PubMed through the NCBI E-utilities API. Include both older “Sjögren’s syndrome” terminology and newer disease terminology. Validate coverage against a known set of adult and childhood papers, including spelling variants, and exclude unrelated similarly named conditions.

Track PMID and DOI for deduplication. Preserve publication date, electronic publication date where available, date first seen and source update time. Offer “published recently” and “new to the feed” as distinct concepts. Display last successful refresh; retain previous results when an update fails.

GitHub Pages hosts static files only. A future scheduled GitHub Actions workflow could retrieve public bibliographic metadata into a static dataset. Any secret API key belongs in GitHub Actions secrets, never in browser code or repository files. Check source terms before reproducing abstracts or full text.

Read state and notes need a separate design decision: browser storage is device-local, while cross-device sync requires an authenticated service. Do not publish personal notes in generated data or commits.

## Initial scope

The first repository version contains a working PubMed search gateway, these planning documents, a responsive design and GitHub Pages deployment. It is not yet an automatically updated dashboard.

## Success criteria for the dashboard

- New relevant papers are easy to identify.
- Childhood research can be found without excluding records that lack age indexing.
- Search results link reliably to original publications.
- An interrupted data update cannot silently present stale data as current.
- Tracking read and saved papers is faster than the current manual workflow.
