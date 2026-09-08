const diseaseQuery =
  '("Sjogren\'s Syndrome"[MeSH Terms] OR Sjogren*[Title/Abstract] OR Sjögren*[Title/Abstract])';

export function pubmedUrl(topic = '') {
  const query = topic.trim()
    ? `${diseaseQuery} AND (${topic.trim()})`
    : diseaseQuery;
  return `https://pubmed.ncbi.nlm.nih.gov/?${new URLSearchParams({ term: query, sort: 'date' })}`;
}

export const focusedSearches = [
  {
    title: 'All SjD research',
    detail: 'Browse the most recently added Sjögren’s records.',
    query: '',
  },
  {
    title: 'Childhood SjD',
    detail: 'Focus on childhood, juvenile and paediatric research.',
    query:
      'child*[Title/Abstract] OR pediatric*[Title/Abstract] OR paediatric*[Title/Abstract] OR juvenile[Title/Abstract] OR adolescent*[Title/Abstract]',
  },
  {
    title: 'Clinical trials',
    detail: 'Find records indexed as clinical trials.',
    query: 'clinical trial[Publication Type]',
  },
];
