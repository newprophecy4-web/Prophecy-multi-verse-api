export type ProviderStatus = 'healthy' | 'degraded' | 'unavailable' | 'not_implemented';
export type LicenseStatus = 'public-domain' | 'open-license' | 'authorized' | 'unknown' | 'restricted' | 'private';
export type MediaFormat = 'hls' | 'mp4' | 'webm';
export type ProviderCapabilities = {
  search: boolean; metadata: boolean; seasons: boolean; episodes: boolean; playback: boolean;
  hls: boolean; mp4: boolean; webm: boolean; subtitles: boolean; audioLanguages: boolean;
};
export type ProviderMedia = {
  sourceId: string; format: MediaFormat; mimeType?: string; url?: string; licenseStatus: LicenseStatus;
  licenseEvidence?: string; duration?: number; resolution?: string; language?: string;
  subtitles?: Array<{language: string; url?: string}>; title?: string;
};
export type ProviderResult = {
  providerId: string; externalId: string; title: string; originalTitle?: string; description?: string;
  year?: number; mediaType: 'movie' | 'series' | 'documentary' | 'other'; licenseStatus: LicenseStatus;
  licenseEvidence?: string; aliases?: string[]; thumbnail?: string; language?: string;
};
export type ProviderHealth = {status: ProviderStatus; latency?: number; reason?: string};
export interface ProviderAdapter {
  readonly id: string; readonly name: string; readonly capabilities: ProviderCapabilities;
  search(query: string): Promise<ProviderResult[]>;
  getTitle(id: string): Promise<ProviderResult | null>;
  getSeasons(titleId: string): Promise<unknown[]>;
  getEpisodes(seasonId: string): Promise<unknown[]>;
  getMedia(id: string): Promise<ProviderMedia[]>;
  resolvePlayback(sourceId: string): Promise<string | null>;
  getUpdates(cursor?: string): Promise<ProviderResult[]>;
  healthCheck(): Promise<ProviderHealth>;
}

export const LEGAL_LICENSE_STATUSES: LicenseStatus[] = ['public-domain', 'open-license', 'authorized'];
export const PROVIDER_PRIORITY = ['peertube', 'internet-archive', 'wikimedia', 'nasa-svs', 'library-of-congress', 'dvids', 'noaa', 'usgs', 'national-archives', 'prelinger'] as const;

export const mimeForFormat = (format: MediaFormat) => format === 'hls' ? 'application/vnd.apple.mpegurl' : format === 'mp4' ? 'video/mp4' : 'video/webm';
export const formatFromUrl = (url: string): MediaFormat | null => {
  const path = url.toLowerCase().split('?')[0];
  if (path.endsWith('.m3u8')) return 'hls';
  if (path.endsWith('.mp4')) return 'mp4';
  if (path.endsWith('.webm')) return 'webm';
  return null;
};

export async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
  if (!response.ok) throw Object.assign(new Error(`Provider request failed: ${response.status}`), {status: response.status});
  return response.json() as Promise<T>;
}
