import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createReadingStore,
  paperKey,
  readDate,
  readingPrefix,
} from '../lib/reading-history.ts';

const date = '2026-10-19T12:00:00.000Z';
const paper = { id: 'pmid:123', pmid: '123', doi: '10.1000/test' };
function memoryStorage() {
  const entries = new Map();
  return {
    get length() {
      return entries.size;
    },
    key(index) {
      return [...entries.keys()][index] ?? null;
    },
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      entries.set(key, value);
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
}
test('read marks survive a new visit and marking unread removes only that paper', () => {
  const storage = memoryStorage();
  storage.setItem('unrelated-preference', 'preserve');
  const first = createReadingStore(() => storage);
  first.load();
  first.setRead(paper, true, date);
  const second = createReadingStore(() => storage);
  second.load();
  assert.equal(readDate(paper, second.getSnapshot().dates), date);
  second.setRead(paper, false);
  const third = createReadingStore(() => storage);
  third.load();
  assert.equal(readDate(paper, third.getSnapshot().dates), undefined);
  assert.equal(storage.getItem('unrelated-preference'), 'preserve');
});
test('stable identifiers connect catalogue and curated versions despite title changes', () => {
  assert.equal(
    paperKey({ id: 'curated', url: 'https://pubmed.ncbi.nlm.nih.gov/123/' }),
    paperKey(paper),
  );
  assert.equal(
    paperKey({ ...paper, id: 'new-source', title: 'A revised title' }),
    paperKey(paper),
  );
  assert.equal(
    paperKey({ id: 'a', doi: 'https://doi.org/10.1000/ABC' }),
    paperKey({ id: 'b', doi: '10.1000/abc' }),
  );
  assert.equal(paperKey({ id: 'sponsor-update' }), 'sponsor-update');
});
test('blocked storage or quota failure keeps this visit usable and reports failure', () => {
  for (const getStorage of [
    () => {
      throw new Error('blocked');
    },
    () => ({
      ...memoryStorage(),
      setItem() {
        throw new Error('quota');
      },
    }),
  ]) {
    const store = createReadingStore(getStorage);
    store.load();
    store.setRead(paper, true, date);
    assert.equal(readDate(paper, store.getSnapshot().dates), date);
    assert.equal(store.getSnapshot().storageFailed, true);
    store.setRead(paper, false);
    assert.equal(readDate(paper, store.getSnapshot().dates), undefined);
  }
});
test('corrupt values are ignored without changing stored data', () => {
  const storage = memoryStorage();
  storage.setItem(readingPrefix + 'bad', 'not a date');
  storage.setItem(readingPrefix + paperKey(paper), date);
  const store = createReadingStore(() => storage);
  store.load();
  assert.deepEqual(store.getSnapshot().dates, { 'pmid:123': date });
  assert.equal(storage.getItem(readingPrefix + 'bad'), 'not a date');
});
test('cross-tab updates preserve other read marks and propagate removals', () => {
  const storage = memoryStorage();
  const store = createReadingStore(() => storage);
  let calls = 0;
  const unsubscribe = store.subscribe(() => calls++);
  store.setRead(paper, true, date);
  store.onStorage(readingPrefix + 'pmid:456', date);
  assert.deepEqual(store.getSnapshot().dates, {
    'pmid:123': date,
    'pmid:456': date,
  });
  store.onStorage('unrelated', null);
  assert.equal(calls, 2);
  store.onStorage(readingPrefix + 'pmid:456', null);
  assert.equal(readDate(paper, store.getSnapshot().dates), date);
  store.onStorage(null, null);
  assert.deepEqual(store.getSnapshot().dates, {});
  unsubscribe();
  store.setRead(paper, true, date);
  assert.equal(calls, 4);
});
