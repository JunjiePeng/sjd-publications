export type PublicationFormat =
  | 'abstract'
  | 'collection'
  | 'conference'
  | 'preprint'
  | 'article'
  | 'other';

export const publicationFormatLabels: Record<PublicationFormat, string> = {
  abstract: 'Abstracts / posters',
  collection: 'Abstract collections',
  conference: 'Conference proceedings / meeting reports',
  preprint: 'Preprints',
  article: 'Journal articles · indexed',
  other: 'Other / format unclear',
};

type FormatRecord = {
  title: string;
  types: string[];
  studyTypes?: string[];
};

type FormatDescription = {
  key: PublicationFormat;
  label: string;
  detail: string;
  attention: boolean;
};

function normalizeType(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ');
}

export function publicationFormat(record: FormatRecord): FormatDescription {
  const types = new Set(record.types.map(normalizeType));
  const has = (...values: string[]) => values.some((value) => types.has(value));
  const abstract = has(
    'abstract',
    'abstracts',
    'meeting abstract',
    'conference abstract',
  );
  const poster = has('poster', 'poster abstract');
  const conference = has(
    'conference proceedings',
    'congress',
    'congresses',
    'meeting report',
  );
  const title = record.title
    .trim()
    .replace(/^\[/, '')
    .replace(/\]\.?$/, '');
  const event = /\b(?:meeting|conference|congress|symposium|workshop)\b/i;

  // These title forms describe a publication's format. A mention of abstracts
  // within a research title, a supplement, or an abstract landing page does not.
  const collectionTitle =
    /^abstracts\s*(?:\.?$|:\s*part\s+[ivxlcdm\d]+\.?$)/i.test(title) ||
    /^(?:scientific|poster|standard poster) abstracts\b/i.test(title) ||
    /^scientific abstract sessions\s*\.?$/i.test(title) ||
    /^proceedings\b.*\babstracts\s*\.?$/i.test(title) ||
    /^world congress\b.*:\s*poster abstracts\s*\.?$/i.test(title) ||
    (/^abstracts (?:from|of|for) (?:the )?(?:\d{4}|\d+(?:st|nd|rd|th))\b/i.test(
      title,
    ) &&
      event.test(title)) ||
    /^(?:book of abstracts|[\w/+-]+\s+abstract book)\s*[.:]?$/i.test(title) ||
    /^(?:ECR|ISNI)\s*(?:19|20)\d{2}\b.*\babstracts\b/i.test(title) ||
    ((abstract || poster || conference) && /\babstracts\b/i.test(title)) ||
    (conference && /\bproceedings and abstract\s*\.?$/i.test(title)) ||
    ((abstract || poster) &&
      /^(?:poster sessions?\b|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday):\s*poster sessions?\b|proceedings of\b)/i.test(
        title,
      ));
  if (collectionTitle) {
    return {
      key: 'collection',
      label: 'Abstract collection',
      detail:
        'The title identifies a collection of abstracts or presentations. This record can contain several studies rather than one full research article.',
      attention: true,
    };
  }
  if (abstract || poster || /^abstract\s*[.:]?$/i.test(title)) {
    return {
      key: 'abstract',
      label: poster ? 'Poster' : 'Abstract',
      detail: poster
        ? 'Indexed as a poster. A separate full journal article is not established by this record.'
        : abstract
          ? 'Indexed as an abstract. This publication is an abstract or presentation summary, even if the source also labels it Journal Article.'
          : 'The title identifies this item as an abstract. A separate full journal article is not established by this record.',
      attention: true,
    };
  }
  if (conference) {
    return {
      key: 'conference',
      label: 'Conference / meeting report',
      detail:
        'Indexed as conference proceedings or a meeting report. These can contain full papers, summaries or abstracts; this metadata does not establish which format is available.',
      attention: true,
    };
  }
  if (
    has('preprint') ||
    record.studyTypes?.some((value) => normalizeType(value) === 'preprint')
  ) {
    return {
      key: 'preprint',
      label: 'Preprint',
      detail:
        'Indexed as a preprint. Check the source for a later peer-reviewed journal version.',
      attention: true,
    };
  }
  if (has('journal article', 'research article', 'review article')) {
    return {
      key: 'article',
      label: 'Journal article · indexed',
      detail:
        'Indexed as a journal article, with no explicit abstract or poster format identified. Indexing is not a guarantee of a complete article or free full-text access.',
      attention: false,
    };
  }
  return {
    key: 'other',
    label: 'Other / format unclear',
    detail:
      'The available title and publication types do not establish the publication format. Check the source record.',
    attention: false,
  };
}
