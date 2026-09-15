import {describe,expect,it} from 'vitest';
import {episodeSearchQuery} from '../../src/playback/resolver.js';
import type {LocalTitle} from '../../src/storage/local-store.js';

const title:LocalTitle={titleId:'query-title',title:'Parent Animation',alternateTitles:[],type:'series',status:'active',availableAudioLanguages:[],subtitleLanguages:[],providers:[],seasons:[],sources:[]};

describe('episode provider query',()=>{
 it('uses parent and episode metadata instead of only the weak episode title',()=>{expect(episodeSearchQuery(title,{title:'Episode 1',seasonNumber:1,episodeNumber:1})).toBe('Parent Animation Episode 1');});
 it('uses season and episode numbers when the child title is not informative',()=>{expect(episodeSearchQuery(title,{title:'Parent Animation',seasonNumber:2,episodeNumber:3})).toBe('Parent Animation S2E3');});
});
