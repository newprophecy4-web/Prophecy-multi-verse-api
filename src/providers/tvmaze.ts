import type {ProviderAdapter,ProviderCapabilities,ProviderResult} from './provider.interface.js';
import {fetchJson} from './provider.interface.js';

type TVMazeShow={id:number;name?:string;type?:string;language?:string;genres?:string[];premiered?:string|null;summary?:string|null;image?:{medium?:string;original?:string}|null;officialSite?:string|null;url?:string};
type TVMazeSearch={score?:number;show?:TVMazeShow}; type TVMazeSeason={id:number;number?:number;name?:string;episodeOrder?:number|null;premiereDate?:string|null;endDate?:string|null}; type TVMazeEpisode={id:number;name?:string;season?:number;number?:number;airdate?:string|null;runtime?:number|null;summary?:string|null;image?:{medium?:string;original?:string}|null};
const capabilities:ProviderCapabilities={search:true,metadata:true,seasons:true,episodes:true,playback:false,hls:false,mp4:false,webm:false,subtitles:false,audioLanguages:false};
const yearOf=(date?:string|null)=>date&&/^\d{4}/.test(date)?Number(date.slice(0,4)):undefined;
export class TVMazeMetadataAdapter implements ProviderAdapter{
 readonly id='tvmaze'; readonly name='TVMaze'; readonly capabilities=capabilities;
 private result(show:TVMazeShow):ProviderResult|null{if(!show.id||!show.name)return null;return {providerId:this.id,externalId:String(show.id),title:show.name,description:show.summary??undefined,year:yearOf(show.premiered),mediaType:'series',licenseStatus:'unknown',aliases:[...(show.genres??[]),...(show.language?[show.language]:[])],thumbnail:show.image?.original??show.image?.medium,language:show.language};}
 async search(query:string){const data=await fetchJson<TVMazeSearch[]>(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);return data.map(item=>item.show?this.result(item.show):null).filter((item):item is ProviderResult=>Boolean(item));}
 async getTitle(id:string){const response=await fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(10000)});if(response.status===404)return null;if(!response.ok)throw Object.assign(new Error(`TVMaze metadata ${response.status}`),{code:'METADATA_PROVIDER_UNAVAILABLE',statusCode:503});return this.result(await response.json() as TVMazeShow);}
 async getSeasons(titleId:string){const data=await fetchJson<TVMazeSeason[]>(`https://api.tvmaze.com/shows/${encodeURIComponent(titleId)}/seasons`);return data.map(s=>({seasonId:String(s.id),seasonNumber:s.number??0,episodeOrder:s.episodeOrder??null,premiereDate:s.premiereDate??null,endDate:s.endDate??null}));}
 async getEpisodes(seasonId:string){const data=await fetchJson<TVMazeEpisode[]>(`https://api.tvmaze.com/seasons/${encodeURIComponent(seasonId)}/episodes`);return data.map(e=>({episodeId:String(e.id),episodeNumber:e.number??0,seasonNumber:e.season??0,title:e.name??`Episode ${e.number??''}`,description:e.summary??undefined,airDate:e.airdate??undefined,duration:e.runtime??undefined,thumbnail:e.image?.original??e.image?.medium}));}
 async getMedia(){return []} async resolvePlayback(){return null} async getUpdates(){return []}
 async healthCheck(){const started=Date.now();try{const response=await fetch('https://api.tvmaze.com/shows/1',{method:'HEAD',signal:AbortSignal.timeout(5000)});return {status:response.ok?'healthy':'degraded',latency:Date.now()-started} as const}catch{return {status:'degraded' as const,latency:Date.now()-started}}}
}
