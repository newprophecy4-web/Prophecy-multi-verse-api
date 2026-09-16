import {afterEach,describe,expect,it,vi} from 'vitest';
import {unlink} from 'node:fs/promises';
import {buildApp} from '../../src/app.js';
import {metadataProviders} from '../../src/search/discovery.js';
import {env} from '../../src/config/env.js';
import type {ProviderResult} from '../../src/providers/provider.interface.js';

const file=`/tmp/smart-search-${process.pid}.json`;
const lookism:ProviderResult={providerId:'tvmaze',externalId:'999001',title:'Lookism',originalTitle:'Lookism',description:'A metadata-only fixture',year:2022,mediaType:'series',licenseStatus:'unknown',aliases:['Korean Drama']};

describe('Smart Search',()=>{
 const originalMode=env.STORAGE_MODE;
 const originalFile=process.env.LOCAL_STORE_FILE;
 afterEach(async()=>{env.STORAGE_MODE=originalMode;if(originalFile===undefined)delete process.env.LOCAL_STORE_FILE;else process.env.LOCAL_STORE_FILE=originalFile;vi.restoreAllMocks();await unlink(file).catch(()=>{});});
 it('discovers into an empty catalog, persists, reuses cache, and leaves playback unavailable',async()=>{
  env.STORAGE_MODE='local';process.env.LOCAL_STORE_FILE=file;const provider=metadataProviders[0];const search=vi.spyOn(provider,'search').mockResolvedValue([lookism]);vi.spyOn(provider,'getMedia').mockResolvedValue([]);vi.spyOn(provider,'getSeasons').mockResolvedValue([]);
  const app=buildApp();try{const first=await app.inject('/api/search?q= LOOKISM ');expect(first.statusCode).toBe(200);expect(JSON.parse(first.body)).toMatchObject({success:true,data:{total:1,results:[{title:'Lookism',metadataAvailable:true,playbackAvailable:false,discovery:{source:'metadata-provider',cached:false}}]}});const titleId=JSON.parse(first.body).data.results[0].titleId;expect((await app.inject(`/api/titles/${titleId}`)).statusCode).toBe(200);expect((await app.inject(`/api/titles/${titleId}/seasons`)).statusCode).toBe(200);expect((await app.inject(`/api/titles/${titleId}/episodes`)).statusCode).toBe(200);const playback=await app.inject(`/api/titles/${titleId}/playback`);expect(JSON.parse(playback.body)).toMatchObject({success:true,available:false,playback:null});const second=await app.inject('/api/search?q=lookism english');expect(second.statusCode).toBe(200);expect(JSON.parse(second.body).data.results).toHaveLength(1);expect(JSON.parse(second.body).data.results[0].discovery).toMatchObject({source:'catalog-cache',cached:true});expect(search).toHaveBeenCalledTimes(1);}finally{await app.close();}
 },15000);
 it('returns a clean empty result for provider timeout and malformed records',async()=>{env.STORAGE_MODE='local';process.env.LOCAL_STORE_FILE=file;const provider=metadataProviders[0];vi.spyOn(provider,'search').mockResolvedValue([undefined as unknown as ProviderResult]);const app=buildApp();try{const response=await app.inject('/api/search?q=unknown-title');expect(response.statusCode).toBe(200);expect(JSON.parse(response.body)).toMatchObject({success:true,data:{total:0,results:[]}});}finally{await app.close();}});
 it('returns a clean empty result when metadata discovery times out',async()=>{env.STORAGE_MODE='local';process.env.LOCAL_STORE_FILE=file;const provider=metadataProviders[0];vi.spyOn(provider,'search').mockRejectedValue(new Error('timeout'));const app=buildApp();try{const response=await app.inject('/api/search?q=timeout-title');expect(response.statusCode).toBe(200);expect(JSON.parse(response.body)).toMatchObject({success:true,data:{total:0,results:[]}});}finally{await app.close();}});
 it('deduplicates equivalent provider results before persistence',async()=>{env.STORAGE_MODE='local';process.env.LOCAL_STORE_FILE=file;const provider=metadataProviders[0];vi.spyOn(provider,'search').mockResolvedValue([lookism,{...lookism,externalId:'999002',aliases:['Lookism'] }]);vi.spyOn(provider,'getMedia').mockResolvedValue([]);vi.spyOn(provider,'getSeasons').mockResolvedValue([]);const app=buildApp();try{const response=await app.inject('/api/search?q=lookism');expect(response.statusCode).toBe(200);expect(JSON.parse(response.body).data.results).toHaveLength(1);}finally{await app.close();}});
 it('rejects invalid and empty search queries with HTTP 400',async()=>{const app=buildApp();try{expect((await app.inject('/api/search?q=')).statusCode).toBe(400);expect((await app.inject('/api/search')).statusCode).toBe(400);}finally{await app.close();}});
});
