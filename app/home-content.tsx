import { useState, type SubmitEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pubmedUrl, focusedSearches } from '@/lib/pubmed';

export default function PubMedSearch() {
  const [topic, setTopic] = useState('');
  function search(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.assign(pubmedUrl(topic));
  }
  return (
    <div className="pubmed-view">
      <div className="heading">
        <div>
          <p className="eyebrow">03 / Search the wider literature</p>
          <h1>Find publications on PubMed</h1>
          <p className="subtitle">
            Explore Sjögren’s disease and childhood-onset SjD beyond the curated
            collection.
          </p>
        </div>
      </div>
      <section className="search-panel" aria-label="Search PubMed">
        <form onSubmit={search}>
          <label className="search-label" htmlFor="pubmed-topic">
            What are you researching?
          </label>
          <div className="search-row">
            <Input
              id="pubmed-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. fatigue, biomarkers, salivary ultrasound"
              aria-describedby="search-hint"
            />
            <Button type="submit">Search PubMed ↗</Button>
          </div>
          <p className="hint" id="search-hint">
            Sjögren’s is included automatically. Results open on PubMed, with
            the newest additions first.
          </p>
        </form>
      </section>
      <section aria-labelledby="browse-pubmed">
        <h2 id="browse-pubmed">Start with a focused search</h2>
        <div className="link-grid">
          {focusedSearches.map((item) => (
            <a
              className="topic-link"
              key={item.title}
              href={pubmedUrl(item.query)}
            >
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <span>Browse on PubMed ↗</span>
            </a>
          ))}
        </div>
      </section>
      <p className="source-note">
        A record’s date added to PubMed may differ from its publication date.
        These searches are starting points and may miss relevant papers.{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/help/">
          About PubMed searching
        </a>
        .
      </p>
    </div>
  );
}
