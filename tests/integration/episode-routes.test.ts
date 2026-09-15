import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {buildApp} from '../../src/app.js';
import {upsertCatalogTitle} from '../../src/storage/catalog.js';
import type {LocalTitle} from '../../src/storage/local-store.js';

const fixture:LocalTitle={titleId:'fixture-episode-routes',title:'Episode Route Fixture',alternateTitles:[],type:'series',status:'active',availableAudioLanguages:[],subtitleLanguages:[],providers:['tvmaze'],seasons:[{seasonId:'fixture-season',seasonNumber:2002,episodes:[{episodeId:'45006',seasonNumber:2002,episodeNumber:1,title:'First Episode',sources:[]},{episodeId:'45007',seasonNumber:2002,episodeNumber:2,title:'Second Episode',sources:[]}]}],sources:[]};

describe('episode route regressions',()=>{
 const app=buildApp();
 beforeAll(async()=>{await upsertCatalogTitle(fixture);});
 afterAll(async()=>{await app.close();});
 it.each(['45006','45007'])('returns valid episode %s',async(id)=>{const response=await app.inject(`/api/episodes/${id}`);expect(response.statusCode).toBe(200);const body=JSON.parse(response.body);expect(body.success).toBe(true);expect(body.data.episodeId).toBe(id);expect(body.data.titleId).toBe(fixture.titleId);});
 it('returns a structured 404 for an unknown episode',async()=>{const response=await app.inject('/api/episodes/invalid123');expect(response.statusCode).toBe(404);expect(JSON.parse(response.body)).toMatchObject({success:false,error:{code:'NOT_FOUND',message:'Episode not found'}});});
 it('returns an empty legal source list for an episode without sources',async()=>{const response=await app.inject('/api/episodes/45006/sources');expect(response.statusCode).toBe(200);expect(JSON.parse(response.body)).toMatchObject({success:true,data:{episodeId:'45006',sources:[]}});});
 it('returns unavailable playback without fabricating a URL',async()=>{const response=await app.inject('/api/episodes/45006/playback');expect(response.statusCode).toBe(200);expect(JSON.parse(response.body)).toMatchObject({success:true,available:false,playback:null,sources:[]});});
});
