import {
  publicationLinks,
  recordDestination,
  type PublicationSource,
} from '@/lib/publication-links';

export function PublicationLinks({ paper }: { paper: PublicationSource }) {
  return (
    <div className="publication-links">
      <p>Title link opens: {recordDestination(paper.url)}.</p>
      <div aria-label="Publication access links">
        {publicationLinks(paper).map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
            {link.label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
