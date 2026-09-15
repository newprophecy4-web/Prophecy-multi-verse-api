import type {ProviderAdapter, ProviderCapabilities, ProviderHealth, ProviderMedia, ProviderResult, LicenseStatus} from './provider.interface.js';
import {fetchJson, formatFromUrl, mimeForFormat} from './provider.interface.js';

export abstract class PublicAdapterBase implements ProviderAdapter {
  abstract readonly id: string; abstract readonly name: string; abstract readonly capabilities: ProviderCapabilities;
  abstract search(query: string): Promise<ProviderResult[]>;
  abstract getTitle(id: string): Promise<ProviderResult | null>;
  abstract getMedia(id: string): Promise<ProviderMedia[]>;
  abstract resolvePlayback(sourceId: string): Promise<string | null>;
  async getSeasons() { return []; } async getEpisodes() { return []; } async getUpdates() { return []; }
  async healthCheck(): Promise<ProviderHealth> { return {status:'not_implemented', reason:'Provider health check is not configured'}; }
}
export const peerTubeRightsFromText=(value: unknown): {status: LicenseStatus; evidence?: string} => {
  const evidence=String(value??'').trim(); const text=evidence.toLowerCase().replace(/[._-]/g,' ').replace(/\s+/g,' ');
  if(!evidence||/\bnot\s+(creative commons|cc\b|public domain)\b/.test(text))return {status:'unknown',evidence:evidence||undefined};
  if(/^(cc0|public domain|public-domain|pd)$/.test(text)||text.includes('public domain'))return {status:'public-domain',evidence};
  if(/^(cc\s*by(?:\s+(sa|nd))?|attribution(?:\s+(share alike|no derivatives|noderivatives))?)$/.test(text))return {status:'open-license',evidence};
  return {status:'unknown',evidence:evidence||undefined};
};
export const rightsFromText=(value: unknown): {status: LicenseStatus; evidence?: string} => {
  const evidence=String(value??''); const text=evidence.toLowerCase();
  if(/\bnot\s+(public domain|creative commons|cc\b)/.test(text))return {status:'unknown',evidence:evidence||undefined};
  if(text.includes('public domain')||text.includes('public-domain')||text.includes('government work'))return {status:'public-domain',evidence};
  if(text.includes('creative commons')||text.includes('cc by')||text.includes('cc0')||text.includes('open license'))return {status:'open-license',evidence};
  return {status:'unknown',evidence:value?String(value):undefined};
};
export const mediaFromUrl=(sourceId:string,url:string,rights:{status:LicenseStatus;evidence?:string},extra:Partial<ProviderMedia>={}):ProviderMedia|null=>{const format=formatFromUrl(url);if(!format)return null;return {sourceId,format,mimeType:extra.mimeType??mimeForFormat(format),url,licenseStatus:rights.status,licenseEvidence:rights.evidence,...extra};};
export {fetchJson};
