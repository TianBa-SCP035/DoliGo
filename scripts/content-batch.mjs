import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const clean = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
const text = value => typeof value === 'string' && clean(value).length > 0;
const https = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
export function fingerprint(item) {
  // Meaning is part of a word identity: different senses must not collapse.
  const body = item.kind === 'reading'
    ? (item.paragraphs ?? []).map(p => clean(p.en)).join(' ')
    : [clean(item.headword).toLowerCase(), clean(item.posZh ?? item.pos), clean(item.senseZh)].join('|');
  return createHash('sha256').update(item.kind + ':' + body).digest('hex');
}
export function stableId(item) { return 'bulk-' + item.kind + '-' + fingerprint(item).slice(0, 24); }

export function stageBatch(bundle, existing = []) {
  if (!bundle || bundle.schemaVersion !== 1 || !Array.isArray(bundle.items) || !Array.isArray(bundle.sources))
    throw new Error('Expected schemaVersion:1, sources:[], items:[]');
  const sources = new Map();
  for (const source of bundle.sources) {
    if (!text(source.id) || sources.has(source.id)) throw new Error('Missing or duplicate source id');
    sources.set(source.id, source);
  }
  const ids = new Set(existing.map(x => x.id));
  const fingerprints = new Set(existing.map(fingerprint));
  const result = { schemaVersion: 1, ready: [], review: [], rejected: [], duplicates: [] };
  for (const raw of bundle.items) {
    const item = raw && typeof raw === 'object' ? { ...raw } : {};
    const errors = [];
    const pending = [];
    if (!['word', 'reading'].includes(item.kind)) errors.push('unsupported-kind');
    if (item.kind === 'word') {
      if (!text(item.headword)) errors.push('missing-headword');
      if (!text(item.senseZh)) pending.push('missing-Chinese-sense');
      if (!text(item.exampleEn) || !text(item.exampleZh)) pending.push('missing-bilingual-example');
    }
    if (item.kind === 'reading') {
      if (!text(item.title) || !text(item.titleEn)) pending.push('missing-bilingual-title');
      if (!Array.isArray(item.paragraphs) || !item.paragraphs.length || item.paragraphs.some(p => !p || !text(p.en))) errors.push('missing-English-paragraphs');
      else if (item.paragraphs.some(p => !text(p.zh))) pending.push('missing-Chinese-paragraphs');
    }
    const source = sources.get(item.sourceId);
    if (!source) errors.push('unknown-source');
    else {
      if (!https(source.url) || !text(source.license) || !https(source.licenseUrl) || !text(source.attribution)) errors.push('incomplete-provenance');
      // No license-name whitelist: a reviewer must verify the actual terms and scope.
      if (source.reuseDecision === 'denied') errors.push('reuse-denied');
      else if (source.reuseDecision !== 'approved' || !text(source.reviewedBy) || !text(source.reviewedAt)) pending.push('source-review-required');
      if (!['original', 'adapted', 'verbatim'].includes(item.textMode)) pending.push('text-mode-required');
      if (item.textMode === 'adapted' && (!text(item.changeNotice) || !text(item.adaptedLicense))) pending.push('adaptation-notice-required');
    }
    if (errors.length) { result.rejected.push({ item, reasons: errors }); continue; }
    const hash = fingerprint(item);
    item.id = text(item.id) ? item.id : stableId(item);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(item.id)) { result.rejected.push({ item, reasons: ['invalid-id'] }); continue; }
    if (ids.has(item.id) || fingerprints.has(hash)) { result.duplicates.push({ item, reasons: [ids.has(item.id) ? 'existing-id' : 'same-content-or-sense'] }); continue; }
    // Only ready items reserve identities. A pending item must not mask a reviewed copy.
    if (pending.length) { result.review.push({ item, reasons: pending }); continue; }
    item.source = source;
    if (item.kind === 'reading') {
      item.paragraphs = item.paragraphs.map((p, i) => ({ ...p, id: p.id ?? item.id + '-p' + (i + 1) }));
      const paragraphIds = item.paragraphs.map(p => p.id);
      if (new Set(paragraphIds).size !== paragraphIds.length) { result.rejected.push({ item, reasons: ['duplicate-paragraph-id'] }); continue; }
    }
    ids.add(item.id); fingerprints.add(hash); result.ready.push(item);
  }
  result.counts = Object.fromEntries(['ready', 'review', 'rejected', 'duplicates'].map(k => [k, result[k].length]));
  return result;
}

export function existingContent(directory) {
  directory = directory instanceof URL ? fileURLToPath(directory) : directory;
  const entries = [];
  for (const filename of readdirSync(directory).filter(f => f.endsWith('.json'))) {
    const pack = JSON.parse(readFileSync(join(directory, filename), 'utf8').replace(/^\uFEFF/, ''));
    for (const item of pack.readings ?? []) entries.push({ ...item, kind: 'reading' });
    for (const item of pack.wordCards ?? pack.cards ?? []) entries.push({ ...item, kind: 'word', senseZh: item.senseZh ?? item.meaningZh });
  }
  return entries;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node scripts/content-batch.mjs input.json NEW-staging-directory');
  const bundle = JSON.parse(readFileSync(resolve(input), 'utf8').replace(/^\uFEFF/, ''));
  const result = stageBatch(bundle, existingContent(new URL('../src/content/', import.meta.url)));
  // Exclusive directory creation: never overwrite previous runs or official packs.
  mkdirSync(resolve(output), { recursive: false });
  writeFileSync(join(resolve(output), 'staged.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(result.counts));
  console.log('Staged only. Catalog, UI and learning records unchanged.');
}
