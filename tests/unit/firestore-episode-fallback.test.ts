import {afterEach,describe,expect,it,vi} from 'vitest';
import {env} from '../../src/config/env.js';
import {findCatalogEpisode} from '../../src/storage/catalog.js';
import {FirestoreCatalogRepository} from '../../src/repositories/firestore-catalog.repository.js';
import type {LocalTitle} from '../../src/storage/local-store.js';

const title:LocalTitle={titleId:'fallback-title',title:'Fallback Fixture',alternateTitles:[],type:'series',status:'active',availableAudioLanguages:[],subtitleLanguages:[],providers:['tvmaze'],seasons:[{seasonId:'fallback-season',seasonNumber:2002,episodes:[{episodeId:'45006',seasonNumber:2002,episodeNumber:1,title:'Fallback Episode',sources:[]}]}],sources:[]};

describe('Firestore episode lookup fallback',()=>{
 const originalMode=env.STORAGE_MODE;
 afterEach(()=>{env.STORAGE_MODE=originalMode;vi.restoreAllMocks();});
 it('falls back to title documents when collection-group lookup fails',async()=>{env.STORAGE_MODE='firestore';vi.spyOn(FirestoreCatalogRepository.prototype,'getEpisode').mockRejectedValue(new Error('FAILED_PRECONDITION'));vi.spyOn(FirestoreCatalogRepository.prototype,'list').mockResolvedValue([title]);const found=await findCatalogEpisode('45006');expect(found).toMatchObject({title,episode:title.seasons[0].episodes[0]});});
});
