import {env} from '../config/env.js'; import {FirestoreCatalogRepository} from '../repositories/firestore-catalog.repository.js'; import {readStore as readLocal,searchLocal as searchLocalStore,getTitle as getLocal,upsertTitle as upsertLocal,findEpisode as findLocal,type LocalTitle} from './local-store.js';
const firestore=new FirestoreCatalogRepository(); const useFirestore=()=>env.STORAGE_MODE==='firestore';
export async function readCatalog(){return useFirestore()?{titles:await firestore.list()} : await readLocal()}
export async function searchCatalog(q:string,page=1,limit=20){if(!useFirestore())return searchLocalStore(q,page,limit);const term=q.toLowerCase();const all=(await firestore.list()).filter(t=>[t.title,t.originalTitle??'',...t.alternateTitles].join(' ').toLowerCase().includes(term));return {total:all.length,results:all.slice((page-1)*limit,page*limit)}}
export async function getCatalogTitle(id:string){return useFirestore()?await firestore.getTitle(id):await getLocal(id)}
export async function upsertCatalogTitle(title:LocalTitle){return useFirestore()?await firestore.upsertTitle(title):await upsertLocal(title)}
export async function findCatalogEpisode(id:string){if(!useFirestore())return findLocal(id);for(const t of await firestore.list())for(const season of t.seasons)for(const e of season.episodes)if(e.episodeId===id)return {title:t,episode:e};return null}
