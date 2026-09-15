import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
export type LocalSource={id:string;providerId:string;sourceId:string;format:string;mimeType:string;licenseStatus:string;licenseEvidence?:string;availability:string;quality?:string;duration?:number;resolution?:string;url?:string;language?:string;audioLanguage?:string;subtitles?:Array<{language:string;url?:string}>;createdAt?:string;updatedAt?:string;expiresAt?:string};
export type LocalTitle={titleId:string;title:string;originalTitle?:string;alternateTitles:string[];description?:string;year?:number;type:string;status:string;rating?:number;duration?:number;country?:string;language?:string;availableAudioLanguages:string[];subtitleLanguages:string[];poster?:string;backdrop?:string;providers:string[];seasons:LocalSeason[];sources:LocalSource[];createdAt?:string;updatedAt?:string;expiresAt?:string};
export type LocalSeason={seasonId:string;seasonNumber:number;episodes:LocalEpisode[]};
export type LocalEpisode={episodeId:string;seasonNumber:number;episodeNumber:number;title:string;description?:string;airDate?:string;duration?:number;thumbnail?:string;sources:LocalSource[]};
type Store={titles:LocalTitle[]};
const file=()=>process.env.LOCAL_STORE_FILE??path.resolve('data/catalog.json'); const empty=():Store=>({titles:[]});
export async function readStore():Promise<Store>{try{return JSON.parse(await readFile(file(),'utf8')) as Store}catch{return empty()}}
export async function writeStore(store:Store){await mkdir(path.dirname(file()),{recursive:true});await writeFile(file(),JSON.stringify(store,null,2),'utf8')}
export async function searchLocal(q:string,page=1,limit=20){const s=await readStore();const term=q.toLowerCase();const all=s.titles.filter(t=>[t.title,t.originalTitle??'',...t.alternateTitles].join(' ').toLowerCase().includes(term));return {total:all.length,results:all.slice((page-1)*limit,page*limit)}}
export async function getTitle(id:string){return (await readStore()).titles.find(t=>t.titleId===id)??null}
export async function upsertTitle(title:LocalTitle){const s=await readStore();const i=s.titles.findIndex(t=>t.titleId===title.titleId);if(i>=0)s.titles[i]={...s.titles[i],...title};else s.titles.push(title);await writeStore(s);return title}
export async function findEpisode(id:string){for(const t of (await readStore()).titles)for(const season of t.seasons)for(const e of season.episodes)if(e.episodeId===id)return {title:t,episode:e};return null}
