import {afterEach,describe,expect,it} from 'vitest';
import {env} from '../../src/config/env.js';
import {providers} from '../../src/providers/adapters.js';
import {resolveTitleSources} from '../../src/playback/resolver.js';
import {upsertCatalogTitle} from '../../src/storage/catalog.js';
import type {LocalTitle} from '../../src/storage/local-store.js';

const title=(id:string):LocalTitle=>({titleId:id,title:`Performance Fixture ${id}`,alternateTitles:[],type:'series',status:'active',availableAudioLanguages:[],subtitleLanguages:[],providers:['tvmaze'],seasons:[],sources:[]});
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

describe('resolver performance safeguards',()=>{
 const originals=new Map(Object.entries(providers).map(([id,provider])=>[id,{search:provider.search,getMedia:provider.getMedia}]));
 const originalTimeout=env.PROVIDER_TIMEOUT_MS;
 afterEach(()=>{for(const [id,methods] of originals){providers[id].search=methods.search;providers[id].getMedia=methods.getMedia;}env.PROVIDER_TIMEOUT_MS=originalTimeout;});
 it('runs independent provider searches concurrently',async()=>{for(const provider of Object.values(providers))if(provider.capabilities.search&&provider.capabilities.metadata)provider.search=async()=>{await sleep(100);return [];};await upsertCatalogTitle(title('parallel'));const started=Date.now();const result=await resolveTitleSources('parallel');expect(result?.sources).toEqual([]);expect(Date.now()-started).toBeLessThan(260);});
 it('isolates a timed-out provider while healthy providers complete',async()=>{env.PROVIDER_TIMEOUT_MS=50;let healthyCalls=0;for(const provider of Object.values(providers))if(provider.capabilities.search&&provider.capabilities.metadata)provider.search=async()=>[];providers.peertube.search=async()=>{await sleep(150);return [];};providers['internet-archive'].search=async()=>{healthyCalls+=1;return [];};await upsertCatalogTitle(title('timeout-isolation'));const started=Date.now();const result=await resolveTitleSources('timeout-isolation');expect(result?.sources).toEqual([]);expect(healthyCalls).toBe(1);expect(Date.now()-started).toBeLessThan(140);});
});
