export type PaperIdentity = {
  id: string;
  pmid?: string;
  doi?: string;
  url?: string;
};
export type ReadDates = Readonly<Record<string, string>>;
export type ReadingSnapshot = { dates: ReadDates; storageFailed: boolean };
export const readingPrefix = 'sjd-publications:read:v1:';
export function paperKey(paper: PaperIdentity) {
  const pmid =
    paper.pmid ||
    paper.url?.match(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\/?/)?.[1];
  if (pmid) return `pmid:${pmid}`;
  if (paper.doi)
    return `doi:${paper.doi
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
      .trim()
      .toLowerCase()}`;
  return paper.id;
}
export function readDate(paper: PaperIdentity, dates: ReadDates) {
  return dates[paperKey(paper)];
}
function validDate(value: string | null): value is string {
  return (
    !!value &&
    /^\d{4}-\d\d-\d\dT/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
type StorageAccess = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
>;

/** One key per paper avoids overwriting other papers changed in another tab. */
export function createReadingStore(getStorage: () => StorageAccess) {
  let snapshot: ReadingSnapshot = { dates: {}, storageFailed: false };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load() {
      try {
        const storage = getStorage();
        const dates: Record<string, string> = {};
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (!key?.startsWith(readingPrefix)) continue;
          const value = storage.getItem(key);
          if (validDate(value)) dates[key.slice(readingPrefix.length)] = value;
        }
        snapshot = { dates, storageFailed: false };
      } catch {
        snapshot = { ...snapshot, storageFailed: true };
      }
      emit();
    },
    setRead(
      paper: PaperIdentity,
      read: boolean,
      timestamp = new Date().toISOString(),
    ) {
      const key = paperKey(paper);
      const dates = { ...snapshot.dates };
      if (read) dates[key] = timestamp;
      else delete dates[key];
      let storageFailed = false;
      try {
        const storage = getStorage();
        if (read) storage.setItem(readingPrefix + key, timestamp);
        else storage.removeItem(readingPrefix + key);
      } catch {
        storageFailed = true;
      }
      snapshot = {
        dates,
        storageFailed: snapshot.storageFailed || storageFailed,
      };
      emit();
    },
    onStorage(key: string | null, value: string | null) {
      if (key !== null && !key.startsWith(readingPrefix)) return;
      const dates = { ...snapshot.dates };
      if (key === null) {
        snapshot = { ...snapshot, dates: {} };
      } else {
        const paper = key.slice(readingPrefix.length);
        if (validDate(value)) dates[paper] = value;
        else delete dates[paper];
        snapshot = { ...snapshot, dates };
      }
      emit();
    },
  };
}
