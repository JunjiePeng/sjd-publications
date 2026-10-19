import { useSyncExternalStore } from 'react';
import { BookOpenCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createReadingStore,
  readDate,
  type PaperIdentity,
  type ReadingSnapshot,
} from '@/lib/reading-history';

const store = createReadingStore(() => window.localStorage);
const serverSnapshot: ReadingSnapshot = { dates: {}, storageFailed: false };
let initialized = false;
function subscribe(listener: () => void) {
  const unsubscribe = store.subscribe(listener);
  if (!initialized && typeof window !== 'undefined') {
    initialized = true;
    store.load();
    window.addEventListener('storage', (event) => {
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      store.onStorage(event.key, event.newValue);
    });
  }
  return unsubscribe;
}
export function useReadingHistory() {
  return useSyncExternalStore(
    subscribe,
    store.getSnapshot,
    () => serverSnapshot,
  );
}
export function ReadingStorageNote() {
  const history = useReadingHistory();
  return (
    <p
      className={`reading-storage-note ${history.storageFailed ? 'reading-storage-error' : ''}`}
      role={history.storageFailed ? 'alert' : undefined}
    >
      {history.storageFailed
        ? 'Browser storage is unavailable or full. Read marks changed in this visit may not be remembered after closing or refreshing the page.'
        : 'Your read marks are saved in this browser on this device. Clearing site data removes them; they do not sync to other devices.'}
    </p>
  );
}
export function ReadButton({
  paper,
}: {
  paper: PaperIdentity & { title: string };
}) {
  const history = useReadingHistory();
  const date = readDate(paper, history.dates);
  return (
    <div className="read-control">
      <Button
        variant={date ? 'secondary' : 'outline'}
        size="sm"
        aria-pressed={!!date}
        aria-label={`${date ? 'Mark as unread' : 'Mark as read'}: ${paper.title}`}
        onClick={() => store.setRead(paper, !date)}
      >
        {date ? <Check size={15} /> : <BookOpenCheck size={15} />}
        {date ? 'Read · mark unread' : 'Mark as read'}
      </Button>
      {date && (
        <span>
          Marked read{' '}
          {new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      )}
    </div>
  );
}
