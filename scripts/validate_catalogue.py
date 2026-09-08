"""Validate the committed metadata snapshot before any build or deployment."""
from collections import Counter
import hashlib
import json
from pathlib import Path


def validate(root=None):
    root = root or Path(__file__).resolve().parents[1] / 'public/data'
    manifest = json.loads((root / 'manifest.json').read_text())
    records = []
    for chunk in manifest['chunks']:
        content = (root / chunk['file']).read_bytes()
        assert hashlib.sha256(content).hexdigest() == chunk['sha256'], f'Corrupt chunk: {chunk["file"]}'
        batch = json.loads(content)
        assert len(batch) == chunk['count'], 'Incomplete publication chunk'
        records.extend(batch)
    assert len(records) == manifest['counts']['publications'], 'Publication count mismatch'
    assert len({r['id'] for r in records}) == len(records), 'Duplicate publication identifiers'
    assert all(r['url'].startswith(('https://pubmed.ncbi.nlm.nih.gov/', 'https://europepmc.org/')) for r in records)
    assert all(r['firstSeen'] and isinstance(r['year'], int) for r in records)
    assert all('abstract' not in r and 'abstractText' not in r for r in records)
    assert Counter(m for r in records for m in r['methods']) == manifest['methods']
    assert Counter(t for r in records for t in r['studyTypes']) == manifest['studyTypes']
    # Established classification, outcomes, therapeutic and tissue-omics papers.
    sentinels = {'27789466', '41284548', '39747819', '37399108', '38287621', '38229348', '33280020'}
    assert sentinels.issubset({r['pmid'] for r in records}), 'Known SjD publications are missing'
    assert min(r['year'] for r in records if r['year']) < 1950, 'Historical coverage missing'
    assert any(r['childhood'] for r in records), 'Childhood coverage missing'
    trials_bytes = (root / manifest['trialsFile']).read_bytes()
    assert hashlib.sha256(trials_bytes).hexdigest() == manifest['trialsSha256'], 'Corrupt studies snapshot'
    trials = json.loads(trials_bytes)
    assert len(trials) == manifest['counts']['registeredStudies']
    assert len({r['id'] for r in trials}) == len(trials)
    assert {'Interventional', 'Observational'}.issubset({r['studyType'] for r in trials})
    assert any(r['hasResults'] for r in trials) and any(not r['hasResults'] for r in trials)
    assert all(r['url'] == 'https://clinicaltrials.gov/study/' + r['id'] for r in trials)
    print(f'Validated {len(records):,} publications and {len(trials):,} registered studies; all chunk hashes and known papers match.')


if __name__ == '__main__':
    validate()
