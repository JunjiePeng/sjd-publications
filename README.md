# SjD Research Explorer

A research website primarily for Junjie Peng to keep up with Sjögren’s disease (SjD), including childhood-onset SjD (cSjD).

- Website: https://JunjiePeng.github.io/sjd-publications/
- Repository: https://github.com/JunjiePeng/sjd-publications
- [Project brief](docs/project-brief.md)
- [Development roadmap](docs/roadmap.md)

## Current version

A broad, searchable catalogue of Sjögren’s publications and registered studies, using current disease and historical syndrome terminology. The initial snapshot is committed under `public/data`; its manifest provides exact counts, queries, timestamps, source coverage and exclusions.

- All matching PubMed records, supplemented by Europe PMC articles and preprints, with no date, language, age or publication-type limit.
- All matching ClinicalTrials.gov registrations, including interventional and observational studies, all recruitment statuses and studies without published results.
- Search by title, author, journal, subject heading, DOI or PMID; filters for publication years, original publication types, study-design labels, childhood-related literature and twelve molecular/omics categories.
- An interactive overview with publication-year and omics navigation, six editorial research themes, thirteen selected references and four therapeutic programmes.

The complete catalogue and the selected editorial readings are separate. Catalogue data refresh automatically; editorial interpretations remain manually reviewed and mainly adult-focused. This is broad database coverage, not a claim to every study ever conducted. See [coverage and ingestion](docs/catalogue.md).

This project is independent of the public engagement website. The owner explicitly approved a public repository and public URL on 8 September 2026. Do not commit private notes, credentials or personal health information.

## Local development

Requires Node.js 22.13 or newer and pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by the server, with `/sjd-publications/` appended if necessary.

```sh
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/validate_catalogue.py
node --experimental-strip-types --test scripts/test_filters.mjs
pnpm lint
pnpm build
```

The React + Vite application builds a static site into `dist/client`. The path prefix is configured in `vite.config.ts` for this GitHub Pages project.

## Deployment

Pull requests validate ingestion logic, committed data, filters, lint and the static build without deploying. Pushing to `main` runs `.github/workflows/deploy.yml` and deploys to GitHub Pages. Pages must use **GitHub Actions** as its publishing source.

The same workflow refreshes all three sources each Monday at 05:17 UTC. Manual runs offer a refresh option. Complete validated data are committed to `main` before the build and deployment, so the repository and website use the same snapshot. If a refresh fails, the last complete dataset remains and a visible failure status is published. No API keys or hosting credentials are required. GitHub may delay scheduled runs, and may disable schedules in inactive public repositories; the website flags snapshots older than eight days.

The retained `.openai/hosting.json` only describes static output; this project deliberately deploys to GitHub Pages as requested by the owner.

## Refresh the catalogue locally

Requires Python 3.10 or newer; no third-party Python packages are needed.

```sh
python3 scripts/refresh_catalogue.py
python3 scripts/validate_catalogue.py
```

`--resume` can reuse normalized metadata pages from the same day and script revision after a failed import. `--allow-stale` is intended for scheduled runs: retain complete records on failure and update the visible refresh status. Raw abstracts are used transiently for discovery labels and are never written to the public dataset. Temporary caches are ignored by Git.

The lint command checks authored application code and configuration. The untouched generated UI catalogue is excluded from lint because the starter contains pre-existing rule violations.

## Curated research content

`lib/research.ts` holds publication metadata, short editorial summaries, limitations, research areas and treatment context. Sources were checked on 8 September 2026. Display titles are shortened; journal issue or announcement dates are used. Update the linked evidence and displayed review date together. This selection is not a systematic review, treatment guide or substitute for content review.

The optional `search_sjd_publications` WebMCP tool searches the full loaded publication catalogue and updates its visible filters in supporting browsers. It returns a total and at most 25 records; it is available when the Publications view is loaded. Live WebMCP registration and invocation have not been verified because a compatible validation context was unavailable. All manual controls work independently of that capability.
