import { createHash } from 'node:crypto';
import { query, transaction } from '../database/pool.js';
import { normalizeTitle } from '../core/identity/normalize.js';
import { matchScore } from '../core/matching/matcher.js';
import type { ProviderAdapter, ProviderResult } from '../providers/provider.interface.js';

export async function syncProvider(adapter: ProviderAdapter, searchTerm: string): Promise<ProviderResult[]> {
  const records = await adapter.search(searchTerm);
  const results: ProviderResult[] = [];
  for (const record of records) {
    if (!record.title || !record.externalId) continue;
    const normalized = normalizeTitle(record.title);
    const existing = await query<{ id: string; canonical_title: string; year: number | null; media_type: string }>(
      'SELECT id, canonical_title, year, media_type FROM titles WHERE canonical_title=$1 LIMIT 1', [record.title]);
    let titleId = existing.rows[0]?.id;
    if (!titleId) {
      const candidates = await query<{ id: string; canonical_title: string; year: number | null; media_type: string }>(
        'SELECT id, canonical_title, year, media_type FROM titles WHERE canonical_title ILIKE $1 LIMIT 20', [`%${normalized}%`]);
      const candidate = candidates.rows.find(candidate => matchScore(
        { title: record.title, year: record.year, mediaType: record.mediaType },
        { title: candidate.canonical_title, year: candidate.year ?? undefined, mediaType: candidate.media_type }) >= 0.85)?.id;
      if (candidate) titleId = candidate;
    }
    const canonicalId: string = titleId || `title_${createHash('sha256').update(`${record.providerId}:${record.externalId}`).digest('hex').slice(0, 24)}`;
    await transaction(async client => {
      await client.query('INSERT INTO providers(id,name,capabilities,priority) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING', [record.providerId, record.providerId, JSON.stringify(adapter.capabilities), 100]);
      await client.query('INSERT INTO titles(id,canonical_title,original_title,year,media_type,status) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET original_title=COALESCE(titles.original_title,EXCLUDED.original_title),updated_at=now()', [canonicalId, record.title, record.originalTitle ?? null, record.year ?? null, record.mediaType, 'active']);
      await client.query('INSERT INTO provider_items(provider_id,external_id,title_id,payload) VALUES($1,$2,$3,$4) ON CONFLICT(provider_id,external_id) DO UPDATE SET title_id=EXCLUDED.title_id,payload=EXCLUDED.payload,fetched_at=now()', [record.providerId, record.externalId, canonicalId, JSON.stringify(record)]);
      await client.query('INSERT INTO title_aliases(title_id,language,type,value,normalized_value) VALUES($1,$2,$3,$4,$5) ON CONFLICT(title_id,language,type,normalized_value) DO NOTHING', [canonicalId, 'und', 'provider', record.title, normalized]);
    });
    results.push(record);
  }
  return results;
}
