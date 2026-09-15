import type {ProviderAdapter,ProviderCapabilities,ProviderResult} from './provider.interface.js';

type TVMazeShow={id:number;name?:string;type?:string;language?:string;genres?:string[];premiered?:string|null;summary?:string|null;image?:{medium?:string;original?:string}|null;officialSite?:string|null;url?:string};
type TVMazeSearch={score?:number;show?:TVMazeShow};

const capabilities:ProviderCapabilities={search:true,metadata:true,seasons:true,episodes:true,playback:false,hls:false,mp4:false,webm:false,subtitles:false,audioLanguages:false};
const yearOf=(date?:string|null)=>date&&/^\d{4}/.test(date)?Number(date.slice(0,4)):undefined;
export class TVMazeMetadataAdapter implements ProviderAdapter{
 readonly id='tvmaze'; readonly name='TVMaze'; readonly capabilities=capabilities;
 private result(show:TVMazeShow):ProviderResult|null{if(!show.id||!show.name)return null;return {providerId:this.id,externalId:String(show.id),title:show.name,year:yearOf(show.premiered),mediaType:'series',licenseStatus:'unknown',aliases:[...(show.genres??[]),...(show.language?[show.language]:[])]};}
 async search(query:string){const response=await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Object.assign(new Error(`TVMaze metadata ${response.status}`),{code:'METADATA_PROVIDER_UNAVAILABLE',statusCode:503});const data=await response.json() as TVMazeSearch[];return data.map(item=>item.show?this.result(item.show):null).filter((item):item is ProviderResult=>Boolean(item));}
 async getTitle(id:string){const response=await fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(10000)});if(response.status===404)return null;if(!response.ok)throw Object.assign(new Error(`TVMaze metadata ${response.status}`),{code:'METADATA_PROVIDER_UNAVAILABLE',statusCode:503});return this.result(await response.json() as TVMazeShow);}
 async getSeasons(_titleId:string){return []} async getEpisodes(_seasonId:string){return []} async getMedia(_id:string){return []} async resolvePlayback(_sourceId:string){return null} async getUpdates(_cursor?:string){return []}
 async healthCheck(){const started=Date.now();try{const response=await fetch('https://api.tvmaze.com/shows/1',{method:'HEAD',signal:AbortSignal.timeout(5000)});return {status:response.ok?'healthy':'degraded',latency:Date.now()-started} as const}catch{return {status:'degraded' as const,latency:Date.now()-started}}
 }
}
