# SjD Research Explorer

A research website primarily for Junjie Peng to keep up with Sjögren’s disease (SjD), including childhood-onset SjD (cSjD).

- Website: https://JunjiePeng.github.io/sjd-publications/
- Repository: https://github.com/JunjiePeng/sjd-publications
- [Project brief](docs/project-brief.md)
- [Development roadmap](docs/roadmap.md)

## Current version

An interactive overview of six SjD research areas, a searchable collection of 13 selected sources and a comparison of four therapeutic programmes. Findings link to dated sources and distinguish journal articles, conference abstracts and sponsor updates.

The PubMed gateway is retained, including focused searches for childhood disease and clinical trials. The curated collection is mainly adult-focused and manually maintained; it is not an automatically refreshed publication feed.

This project is independent of the public engagement website. The owner explicitly approved a public repository and public URL on 8 September 2026. Do not commit private notes, credentials or personal health information.

## Local development

Requires Node.js 22.13 or newer and pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by the server, with `/sjd-publications/` appended if necessary.

```sh
pnpm lint
pnpm build
```

The React + Vite application builds a static site into `dist/client`. The path prefix is configured in `vite.config.ts` for this GitHub Pages project.

## Deployment

Pull requests run the same lint and static-build checks without deploying. Pushing to `main` runs `.github/workflows/deploy.yml`. It installs the locked dependencies, checks lint, builds the static site and deploys it to GitHub Pages. Pages must use **GitHub Actions** as its publishing source. No hosting credentials or third-party hosting service are needed.

The retained `.openai/hosting.json` only describes static output; this project deliberately deploys to GitHub Pages as requested by the owner.

## Data source

[PubMed help](https://pubmed.ncbi.nlm.nih.gov/help/) and [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25499/) are the starting points for future automated ingestion. Publication date and date added to PubMed must remain distinct.

The lint command checks authored application code and configuration. The untouched generated UI catalogue is excluded from lint because the starter contains pre-existing rule violations.

## Curated research content

`lib/research.ts` holds publication metadata, short editorial summaries, limitations, research areas and treatment context. Sources were checked on 8 September 2026. Display titles are shortened; journal issue or announcement dates are used. Update the linked evidence and displayed review date together. This selection is not a systematic review, treatment guide or substitute for content review.

The optional `search_sjd_publications` WebMCP tool uses the same visible library filters in supporting browsers. Live WebMCP registration and invocation have not been verified because a compatible validation context was unavailable. All manual controls work independently of that capability.
