import {findCatalogEpisode, getCatalogTitle, upsertCatalogTitle} from '../storage/catalog.js';
import type {LocalSource, LocalTitle} from '../storage/local-store.js';
import {providers} from '../providers/adapters.js';
import {InternetArchiveAdapter} from '../providers/internet-archive.js';
import {PROVIDER_PRIORITY, LEGAL_LICENSE_STATUSES, formatFromUrl, mimeForFormat} from '../providers/provider.interface.js';
import {syncProvider} from '../sync/sync.service.js';
import {validateSource} from './source-validation.js';

const ia = providers['internet-archive'] ?? new InternetArchiveAdapter();
const inFlight = new Map<string, Promise<LocalTitle | null>>();
const valid = (s: LocalSource) => LEGAL_LICENSE_STATUSES.includes(s.licenseStatus as never) && s.availability==='available' && (!s.expiresAt || new Date(s.expiresAt)>new Date()) && Boolean(s.url || providers[s.providerId] || s.providerId==='internet-archive');
const priority=(id:string)=>{const i=PROVIDER_PRIORITY.indexOf(id as never);return i<0?999:i;};
const score=(s:LocalSource, audio?:string, subtitle?:string) => { if(!valid(s)) return -Infinity; const format=s.format==='hls'?3:s.format==='mp4'?2:1; const language=audio && (s.audioLanguage===audio||s.language===audio)?50:0; const sub=subtitle && s.subtitles?.some(x=>x.language===subtitle)?20:0; const quality=s.resolution?Number((s.resolution.split('x')[0]??0)):0; return 10000-priority(s.providerId)*500+format*100+language+sub+quality/100; };
const rank=(sources:LocalSource[],audio?:string,subtitle?:string)=>sources.filter(valid).sort((a,b)=>score(b,audio,subtitle)-score(a,audio,subtitle));
const playbackUrl=async(s:LocalSource)=>{if(s.url)return s.url;const adapter=s.providerId==='internet-archive'?ia:providers[s.providerId];return adapter?adapter.resolvePlayback(s.sourceId):null;};
async function resolveMissing(title:LocalTitle):Promise<LocalTitle|null>{
  const key=title.titleId; const existing=inFlight.get(key); if(existing)return existing;
  const work=(async()=>{const query=title.title; const adapters=Object.values(providers).filter(p=>p.capabilities.search && p.capabilities.metadata); const results=await Promise.allSettled(adapters.map(async adapter=>{const records=await adapter.search(query);for(const record of records.slice(0,5))await syncProvider(adapter,record.title); return records;})); if(results.some(r=>r.status==='fulfilled')) return getCatalogTitle(title.titleId); return title;})(); inFlight.set(key,work); try{return await work;}finally{inFlight.delete(key);}}
async function resolveSources(title:LocalTitle, episodeId:string|undefined, sources:LocalSource[], duration:number|undefined, preferredAudio?:string, preferredSubtitle?:string){
  let ranked=rank(sources,preferredAudio,preferredSubtitle); if(ranked.length===0){const refreshed=await resolveMissing(title); ranked=rank((episodeId?refreshed?.seasons.flatMap(s=>s.episodes).find(e=>e.episodeId===episodeId)?.sources??[]:refreshed?.sources??[]),preferredAudio,preferredSubtitle);}
  for(const source of ranked){const url=await playbackUrl(source).catch(()=>null); if(!url)continue; const candidate={...source,url,availability:'available'}; const validation=await validateSource(candidate); if(!validation.valid)continue; const format=formatFromUrl(url)??(source.format as 'hls'|'mp4'|'webm'); if(!['hls','mp4','webm'].includes(format))continue; return {success:true,available:true,titleId:title.titleId,...(episodeId?{episodeId}:{}),playback:{type:format,url,mimeType:source.mimeType||mimeForFormat(format),quality:source.quality??null,resolution:source.resolution??null,language:source.language??preferredAudio??null,audioLanguage:source.audioLanguage??preferredAudio??null,subtitles:source.subtitles??(preferredSubtitle?[{language:preferredSubtitle}]:[]),duration:source.duration??duration??null,provider:source.providerId,sourceId:source.sourceId,isHLS:format==='hls',isMP4:format==='mp4',isDirect:Boolean(source.url),licenseStatus:source.licenseStatus,licenseEvidence:source.licenseEvidence??null},sources:ranked};}
  return {success:true,available:false,playback:null,sources:ranked};
}
export async function resolvePlayback(episodeId:string,preferredAudio?:string,preferredSubtitle?:string){const found=await findCatalogEpisode(episodeId);if(!found)return {success:false,available:false,reason:'EPISODE_NOT_FOUND',playback:null};return resolveSources(found.title,episodeId,found.episode.sources,found.episode.duration,preferredAudio,preferredSubtitle);}
export async function resolveTitlePlayback(titleId:string,preferredAudio?:string,preferredSubtitle?:string){const title=await getCatalogTitle(titleId);if(!title)return {success:false,available:false,reason:'TITLE_NOT_FOUND',playback:null};return resolveSources(title,undefined,title.sources,title.duration,preferredAudio,preferredSubtitle);}
export async function resolveTitleSources(titleId:string){const title=await getCatalogTitle(titleId);if(!title)return null;const refreshed=rank(title.sources);if(refreshed.length)return {title,sources:refreshed};const resolved=await resolveMissing(title);return resolved?{title:resolved,sources:rank(resolved.sources)}:{title,sources:[]};}
