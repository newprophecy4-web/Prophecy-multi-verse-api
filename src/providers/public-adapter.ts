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
export const rightsFromText=(value: unknown): {status: LicenseStatus; evidence?: string} => {
  const text=String(value??'').toLowerCase();
  if(text.includes('public domain')||text.includes('public-domain')||text.includes('government work'))return {status:'public-domain',evidence:String(value)};
  if(text.includes('creative commons')||text.includes('cc by')||text.includes('cc0')||text.includes('open license'))return {status:'open-license',evidence:String(value)};
  return {status:'unknown',evidence:value?String(value):undefined};
};
export const mediaFromUrl=(sourceId:string,url:string,rights:{status:LicenseStatus;evidence?:string},extra:Partial<ProviderMedia>={}):ProviderMedia|null=>{const format=formatFromUrl(url);if(!format)return null;return {sourceId,format,mimeType:extra.mimeType??mimeForFormat(format),url,licenseStatus:rights.status,licenseEvidence:rights.evidence,...extra};};
export {fetchJson};
