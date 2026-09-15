import {env} from '../config/env.js'; import {FirestoreCatalogRepository} from '../repositories/firestore-catalog.repository.js'; import {readStore as readLocal,getTitle as getLocal,upsertTitle as upsertLocal,findEpisode as findLocal,type LocalTitle} from './local-store.js'; import {normalizeTitle} from '../core/identity/normalize.js';
const firestore=new FirestoreCatalogRepository(); const useFirestore=()=>env.STORAGE_MODE==='firestore';
const languageWords=new Set(['ar','arabic','bn','bengali','dub','dubbed','en','english','fr','french','hi','hindi','ja','japanese','ko','korean','sub','subbed','ta','tamil','te','telugu','ur','urdu']);
const searchTerms=(q:string)=>normalizeTitle(q).split(' ').filter(term=>!languageWords.has(term));
const matches=(title:LocalTitle,terms:string[])=>{const hay=normalizeTitle([title.title,title.originalTitle??'',...title.alternateTitles].join(' '));return terms.every(term=>hay.includes(term));};
export async function readCatalog(){return useFirestore()?{titles:await firestore.list()} : await readLocal()}
export async function searchCatalog(q:string,page=1,limit=20){const terms=searchTerms(q);const all=(await readCatalog()).titles.filter(t=>matches(t,terms));return {total:all.length,results:all.slice((page-1)*limit,page*limit)}}
export async function getCatalogTitle(id:string){return useFirestore()?await firestore.getTitle(id):await getLocal(id)}
export async function upsertCatalogTitle(title:LocalTitle){return useFirestore()?await firestore.upsertTitle(title):await upsertLocal(title)}
export async function findCatalogEpisode(id:string){if(!useFirestore())return findLocal(id);const direct=await firestore.getEpisode(id);if(direct)return direct;for(const t of await firestore.list())for(const season of t.seasons)for(const e of season.episodes)if(e.episodeId===id)return {title:t,episode:e};return null}
