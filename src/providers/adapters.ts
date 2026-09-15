import type {ProviderAdapter, ProviderCapabilities, ProviderHealth, ProviderMedia, ProviderResult} from './provider.interface.js';
import {fetchJson, formatFromUrl, mimeForFormat, type LicenseStatus} from './provider.interface.js';
import {InternetArchiveAdapter, PrelingerAdapter} from './internet-archive.js';
import {PeerTubeAdapter} from './peertube.js';
import {NasaSvsAdapter} from './nasa-svs.js';
import {LibraryOfCongressAdapter} from './library-of-congress.js';
import {DvidsAdapter} from './dvids.js';
import {NationalArchivesAdapter} from './national-archives.js';

const unsupportedCapabilities: ProviderCapabilities = {search:false, metadata:false, seasons:false, episodes:false, playback:false, hls:false, mp4:false, webm:false, subtitles:false, audioLanguages:false};
const unsupported = (id: string, name: string): ProviderAdapter => ({
  id, name, capabilities: unsupportedCapabilities,
  async search() { return []; }, async getTitle() { return null; }, async getSeasons() { return []; }, async getEpisodes() { return []; },
  async getMedia() { return []; }, async resolvePlayback() { return null; }, async getUpdates() { return []; },
  async healthCheck(): Promise<ProviderHealth> { return {status:'not_implemented', reason:'No stable documented public playback API is configured for this provider'}; }
});

const wikimediaCaps: ProviderCapabilities = {search:true, metadata:true, seasons:false, episodes:false, playback:true, hls:false, mp4:true, webm:true, subtitles:false, audioLanguages:false};
type WikiSearch = {query?: {search?: Array<{title: string}>}};
type WikiInfo = {query?: {pages?: Record<string, {title?: string; missing?: boolean; imageinfo?: Array<{url?: string; thumburl?: string; mime?: string; width?: number; height?: number; extmetadata?: Record<string, {value?: string}>}>}>}};
const rights = (meta?: Record<string, {value?: string}>): {status: LicenseStatus; evidence?: string} => {
  const text = `${meta?.LicenseShortName?.value ?? ''} ${meta?.UsageTerms?.value ?? ''} ${meta?.Copyrighted?.value ?? ''}`.toLowerCase();
  if (text.includes('public domain')) return {status:'public-domain', evidence: meta?.UsageTerms?.value};
  if (text.includes('creative commons') || text.includes('cc by') || text.includes('cc0')) return {status:'open-license', evidence: meta?.UsageTerms?.value};
  return {status:'unknown', evidence: meta?.UsageTerms?.value};
};
export class WikimediaAdapter implements ProviderAdapter {
  readonly id='wikimedia'; readonly name='Wikimedia Commons'; readonly capabilities=wikimediaCaps;
  async search(query: string) {
    const data = await fetchJson<WikiSearch>(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${query} filetype:video`)}&srnamespace=6&srlimit=20&format=json`);
    const titles = data.query?.search ?? [];
    return Promise.all(titles.map(x => this.getTitle(x.title))).then(xs => xs.filter((x): x is ProviderResult => Boolean(x)));
  }
  async getTitle(id: string) {
    const data = await fetchJson<WikiInfo>(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(id)}&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json`);
    const page = Object.values(data.query?.pages ?? {})[0]; const info = page?.imageinfo?.[0];
    if (!page?.title || !info?.url || !['video/mp4','video/webm'].includes(info.mime ?? '')) return null;
    const license = rights(info.extmetadata); return {providerId:this.id, externalId:page.title, title:page.title.replace(/^File:/,''), mediaType:'other', licenseStatus:license.status, licenseEvidence:license.evidence, thumbnail:info.thumburl} as ProviderResult;
  }
  async getMedia(id: string): Promise<ProviderMedia[]> {
    const title = await this.getTitle(id); if (!title) return [];
    const data = await fetchJson<WikiInfo>(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(id)}&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json`);
    const info = Object.values(data.query?.pages ?? {})[0]?.imageinfo?.[0]; const format = info?.url ? formatFromUrl(info.url) : null; if (!info?.url || !format) return [];
    const license = rights(info.extmetadata); return [{sourceId:'0', format, mimeType:info.mime ?? mimeForFormat(format), url:info.url, licenseStatus:license.status, licenseEvidence:license.evidence, resolution:info.width && info.height ? `${info.width}x${info.height}` : undefined}];
  }
  async resolvePlayback(sourceId: string) { const slash=sourceId.lastIndexOf('/'); const external=slash>0?sourceId.slice(0,slash):sourceId; return (await this.getMedia(external))[0]?.url ?? null; }
  async getSeasons() { return []; } async getEpisodes() { return []; } async getUpdates() { return []; }
  async healthCheck(): Promise<ProviderHealth> { const started=Date.now(); try { await fetchJson('https://commons.wikimedia.org/w/api.php?action=query&meta=siteinfo&format=json', 5000); return {status:'healthy', latency:Date.now()-started}; } catch { return {status:'degraded', latency:Date.now()-started}; } }
}

export const providers: Record<string, ProviderAdapter> = {
  peertube: new PeerTubeAdapter(),
  'internet-archive': new InternetArchiveAdapter(),
  wikimedia: new WikimediaAdapter(),
  'nasa-svs': new NasaSvsAdapter(),
  'library-of-congress': new LibraryOfCongressAdapter(),
  dvids: new DvidsAdapter(), noaa: unsupported('noaa','NOAA'), usgs: unsupported('usgs','USGS'),
  'national-archives': new NationalArchivesAdapter(),
  prelinger: new PrelingerAdapter(),
};
