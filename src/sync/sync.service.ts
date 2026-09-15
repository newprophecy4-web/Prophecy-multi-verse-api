import {normalizeTitle} from '../core/identity/normalize.js';
import {canonicalTitleId} from '../core/identity/canonical-id.js';
import type {ProviderAdapter, ProviderResult, ProviderMedia} from '../providers/provider.interface.js';
import {mimeForFormat} from '../providers/provider.interface.js';
import {readCatalog, upsertCatalogTitle} from '../storage/catalog.js';
import type {LocalTitle, LocalSource} from '../storage/local-store.js';
import {env} from '../config/env.js';

const expiry=()=>new Date(Date.now()+env.CACHE_TTL_SECONDS*1000).toISOString();
const sourceFrom=(record:ProviderResult, media:ProviderMedia):LocalSource=>({id:`${record.providerId}:${record.externalId}:${media.sourceId}`,providerId:record.providerId,sourceId:`${record.externalId}/${media.sourceId}`,format:media.format,mimeType:media.mimeType??mimeForFormat(media.format),licenseStatus:media.licenseStatus,licenseEvidence:media.licenseEvidence??record.licenseEvidence,availability:media.url?'available':'unavailable',duration:media.duration,resolution:media.resolution,url:media.url,language:media.language??record.language,subtitles:media.subtitles,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),expiresAt:expiry()});

async function loadSeasons(adapter:ProviderAdapter, externalId:string, existing:LocalTitle['seasons']) {
  if(!adapter.capabilities.seasons||!adapter.capabilities.episodes) return existing;
  const rawSeasons=await adapter.getSeasons(externalId).catch(()=>[]);
  return Promise.all(rawSeasons.map(async (season:any)=>{
    const seasonId=String(season.seasonId??season.id??'');
    const rawEpisodes=await adapter.getEpisodes(seasonId).catch(()=>[]);
    return {seasonId,seasonNumber:Number(season.seasonNumber??season.number??0),episodes:rawEpisodes.map((episode:any)=>({episodeId:String(episode.episodeId??episode.id??''),seasonNumber:Number(episode.seasonNumber??episode.season??season.seasonNumber??0),episodeNumber:Number(episode.episodeNumber??episode.number??0),title:String(episode.title??episode.name??''),description:episode.description,airDate:episode.airDate,duration:episode.duration,thumbnail:episode.thumbnail,sources:[]}))};
  }));
}
export async function cacheProviderResult(adapter:ProviderAdapter,record:ProviderResult){
  const id=canonicalTitleId(record.title,record.year,record.mediaType); const store=await readCatalog();
  const existing=store.titles.find(t=>normalizeTitle(t.title)===normalizeTitle(record.title)&&t.year===record.year);
  const media=await adapter.getMedia(record.externalId).catch(()=>[]); const sources=media.map(m=>sourceFrom(record,m));
  const seasons=await loadSeasons(adapter,record.externalId,existing?.seasons??[]);
  const title:LocalTitle={titleId:existing?.titleId??id,title:record.title,originalTitle:record.originalTitle,alternateTitles:record.aliases??[],description:record.description,year:record.year,type:record.mediaType,status:'active',availableAudioLanguages:existing?.availableAudioLanguages??[],subtitleLanguages:existing?.subtitleLanguages??[],poster:record.thumbnail,providers:[...new Set([...(existing?.providers??[]),record.providerId])],seasons,sources:[...(existing?.sources??[]),...sources],createdAt:existing?.createdAt??new Date().toISOString(),updatedAt:new Date().toISOString(),expiresAt:expiry()};
  return upsertCatalogTitle(title);
}
export async function syncProvider(adapter:ProviderAdapter,searchTerm:string){const records=await adapter.search(searchTerm);for(const record of records)await cacheProviderResult(adapter,record);return records;}
export async function syncProviderItem(adapter:ProviderAdapter,externalId:string){const record=await adapter.getTitle(externalId);if(!record)throw new Error(`Provider item not found: ${externalId}`);await cacheProviderResult(adapter,record);return record;}
