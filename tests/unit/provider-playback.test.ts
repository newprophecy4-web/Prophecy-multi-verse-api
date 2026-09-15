import {describe,it,expect,vi,afterEach} from 'vitest';
import {formatFromUrl} from '../../src/providers/provider.interface.js';
import {validateSource} from '../../src/playback/source-validation.js';
import {providers} from '../../src/providers/adapters.js';
import type {LocalSource} from '../../src/storage/local-store.js';
const source=(overrides:Partial<LocalSource>={}):LocalSource=>({id:'s',providerId:'nasa-svs',sourceId:'1:0',format:'mp4',mimeType:'video/mp4',licenseStatus:'public-domain',licenseEvidence:'NASA',availability:'available',url:'https://media.example.test/video.mp4',...overrides});
afterEach(()=>vi.restoreAllMocks());
describe('provider playback hardening',()=>{
 it('detects supported media formats',()=>{expect(formatFromUrl('https://x/video.m3u8')).toBe('hls');expect(formatFromUrl('https://x/video.mp4?download=1')).toBe('mp4');expect(formatFromUrl('https://x/video.webm')).toBe('webm');expect(formatFromUrl('https://x/video.mov')).toBeNull();});
 it('rejects unknown rights before network access',async()=>{const fetchSpy=vi.spyOn(globalThis,'fetch');expect(await validateSource(source({licenseStatus:'unknown'}))).toMatchObject({valid:false,reason:'LICENSE_REJECTED'});expect(fetchSpy).not.toHaveBeenCalled();});
 it('rejects expired sources',async()=>{expect(await validateSource(source({expiresAt:new Date(Date.now()-1000).toISOString()}))).toMatchObject({valid:false,reason:'SOURCE_EXPIRED'});});
 it('validates an accessible media response',async()=>{vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(null,{status:200,headers:{'content-type':'video/mp4'}}));expect(await validateSource(source())).toMatchObject({valid:true,contentType:'video/mp4'});});
 it('does not advertise unsupported provider capabilities',()=>{expect(providers.peertube.capabilities.playback).toBe(true);expect(providers.dvids.capabilities.playback).toBe(false);expect(providers['nasa-svs'].capabilities.mp4).toBe(true);});
});
