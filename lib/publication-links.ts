export type PublicationSource = {
  url: string;
  doi?: string;
  pmcid?: string;
  id?: string;
};

export function recordDestination(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Source page';
  }
  if (parsed.hostname === 'pubmed.ncbi.nlm.nih.gov')
    return 'PubMed record / abstract';
  if (parsed.hostname === 'pmc.ncbi.nlm.nih.gov') return 'PMC text';
  if (parsed.hostname === 'europepmc.org') return 'Europe PMC record';
  if (parsed.hostname === 'acrabstracts.org') return 'Conference abstract';
  if (['doi.org', 'dx.doi.org'].includes(parsed.hostname))
    return 'Publisher page';
  return 'Source page';
}

export function publicationLinks(paper: PublicationSource) {
  const links = [{ url: paper.url, label: recordDestination(paper.url) }];
  const doi = paper.doi?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').trim();
  if (doi) {
    const url = `https://doi.org/${doi}`;
    if (paper.url !== url)
      links.push({ url, label: 'Publisher page · access varies' });
  }
  const pmcid = paper.pmcid || paper.id?.match(/^pmc:(PMC\d+)$/i)?.[1];
  if (
    pmcid &&
    /^PMC\d+$/i.test(pmcid) &&
    !paper.url.startsWith('https://pmc.ncbi.nlm.nih.gov/')
  ) {
    links.push({
      url: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid.toUpperCase()}/`,
      label: 'Read on PMC',
    });
  }
  return links;
}
