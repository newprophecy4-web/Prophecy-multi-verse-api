import { Client } from '@opensearch-project/opensearch';
import { env } from '../config/env.js';
export const searchClient = new Client({ node: env.OPENSEARCH_URL });
export const TITLE_INDEX = 'moviebox-titles';
export async function ensureSearchIndex(): Promise<boolean> { try { const exists = await searchClient.indices.exists({ index: TITLE_INDEX }); if (!exists.body) { await searchClient.indices.create({ index: TITLE_INDEX, body: { mappings: { properties: { canonicalTitle: { type: 'text' }, aliases: { type: 'text' }, year: { type: 'integer' }, mediaType: { type: 'keyword' }, popularityScore: { type: 'float' } } } } }); } return true; } catch { return false; } }
export async function indexTitle(title: { id: string; canonicalTitle: string; aliases?: string[]; year?: number; mediaType: string; popularityScore?: number }): Promise<boolean> { try { await searchClient.index({ index: TITLE_INDEX, id: title.id, body: title, refresh: true }); return true; } catch { return false; } }
export async function searchTitles(query: string, page = 1, limit = 20): Promise<unknown[]> { try { const result = await searchClient.search({ index: TITLE_INDEX, from: (page - 1) * limit, size: limit, body: { query: { multi_match: { query, fields: ['canonicalTitle^3', 'aliases'] } } } }); return (result.body.hits.hits as Array<{ _source: unknown }>).map(x => x._source); } catch { return []; } }
export async function deleteTitleIndex(id: string): Promise<boolean> { try { await searchClient.delete({ index: TITLE_INDEX, id, refresh: true }); return true; } catch { return false; } }
