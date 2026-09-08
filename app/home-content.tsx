import { useState, type SubmitEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const diseaseQuery =
  '("Sjogren\'s Syndrome"[MeSH Terms] OR Sjogren*[Title/Abstract] OR Sjögren*[Title/Abstract])';

function pubmedUrl(topic = '') {
  const query = topic.trim()
    ? `${diseaseQuery} AND (${topic.trim()})`
    : diseaseQuery;
  return `https://pubmed.ncbi.nlm.nih.gov/?${new URLSearchParams({ term: query, sort: 'date' })}`;
}

const searches = [
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

export default function Home() {
  const [topic, setTopic] = useState('');
  function search(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.assign(pubmedUrl(topic));
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#main">
            <span className="mark">SjD /</span> Research Explorer
          </a>
          <span className="small">Research workspace</span>
        </div>
      </header>
      <main className="shell" id="main">
        <div className="intro">
          <p className="kicker">Sjögren’s disease · Publications</p>
          <h1>A place to follow the research.</h1>
          <p className="lead">
            Search the Sjögren’s literature, explore childhood disease and
            return to the original papers.
          </p>
        </div>
        <section className="search-panel" aria-label="Search publications">
          <form onSubmit={search}>
            <label className="search-label" htmlFor="topic">
              What are you researching?
            </label>
            <div className="search-row">
              <Input
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. fatigue, biomarkers, salivary ultrasound"
                aria-describedby="search-hint"
              />
              <Button type="submit">Search PubMed ↗</Button>
            </div>
            <p className="small hint" id="search-hint">
              Sjögren’s is included automatically. Results open on PubMed, with
              the newest additions first.
            </p>
          </form>
        </section>
        <section aria-labelledby="browse">
          <h2 id="browse">Start with a focused search</h2>
          <div className="link-grid">
            {searches.map((item) => (
              <a
                className="topic-link"
                key={item.title}
                href={pubmedUrl(item.query)}
              >
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <span className="link-label">Browse on PubMed ↗</span>
              </a>
            ))}
          </div>
        </section>
        <p className="small">
          A record’s date added to PubMed may differ from its publication date.
          These searches are starting points and may miss relevant papers.{' '}
          <a href="https://pubmed.ncbi.nlm.nih.gov/help/">
            About PubMed searching
          </a>
          .
        </p>
      </main>
      <footer className="site-footer">
        <div className="shell">
          <p>SjD Research Explorer · An independent research project</p>
          <p>
            Initial version: PubMed search links. The publication feed and
            reading tools are in development.
          </p>
          <a href="https://github.com/JunjiePeng/sjd-publications">
            Project and development plan ↗
          </a>
        </div>
      </footer>
    </>
  );
}
