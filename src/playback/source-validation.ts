import type {LocalSource} from '../storage/local-store.js';
import {LEGAL_LICENSE_STATUSES, formatFromUrl} from '../providers/provider.interface.js';
import {isTrustedPeerTubeHost} from '../providers/peertube.js';

export type ValidationResult={valid:boolean;reason?:string;contentType?:string};
export async function validateSource(source:LocalSource, timeoutMs=Number(process.env.PROVIDER_TIMEOUT_MS??8000)):Promise<ValidationResult>{
  if(!LEGAL_LICENSE_STATUSES.includes(source.licenseStatus as never))return {valid:false,reason:'LICENSE_REJECTED'};
  if(source.availability!=='available')return {valid:false,reason:'SOURCE_UNAVAILABLE'};
  if(source.expiresAt&&new Date(source.expiresAt)<=new Date())return {valid:false,reason:'SOURCE_EXPIRED'};
  if(!source.url)return {valid:false,reason:'SOURCE_URL_MISSING'};
  let parsed:URL;try{parsed=new URL(source.url);}catch{return {valid:false,reason:'INVALID_URL'};}
  if(parsed.protocol!=='https:')return {valid:false,reason:'INSECURE_URL'};
  const host=parsed.hostname.toLowerCase();if(host==='localhost'||host==='127.0.0.1'||host==='::1'||host.endsWith('.local')||host.startsWith('10.')||host.startsWith('192.168.'))return {valid:false,reason:'PRIVATE_PROVIDER_HOST'};
  const domains:Record<string,string[]>= {'internet-archive':['archive.org'],'wikimedia':['wikimedia.org'],'nasa-svs':['svs.gsfc.nasa.gov'],'library-of-congress':['loc.gov'],'national-archives':['archives.gov'],'noaa':['noaa.gov'],'usgs':['usgs.gov'],'dvids':['dvidshub.net','cloudfront.net']};const expected=domains[source.providerId];if(source.providerId==='peertube'&&!isTrustedPeerTubeHost(host))return {valid:false,reason:'PROVIDER_IDENTITY_MISMATCH'};if(expected&&!expected.some(domain=>host===domain||host.endsWith(`.${domain}`)))return {valid:false,reason:'PROVIDER_IDENTITY_MISMATCH'};
  const format=formatFromUrl(source.url);if(!format&&!['hls','mp4','webm'].includes(source.format))return {valid:false,reason:'UNSUPPORTED_FORMAT'};
  try{const url=source.url;const rangeRequest=()=>fetch(url,{headers:{range:'bytes=0-1'},signal:AbortSignal.timeout(timeoutMs)});let response:Response;try{response=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(timeoutMs)});}catch{response=await rangeRequest();}if(response.status===403||response.status===405||response.status===501)response=await rangeRequest();if(response.status<200||response.status>=400)return {valid:false,reason:`HTTP_${response.status}`};const contentType=response.headers.get('content-type')??undefined;if(contentType&&!(/video\/(mp4|webm)/i.test(contentType)||/mpegurl/i.test(contentType)||/octet-stream/i.test(contentType)))return {valid:false,reason:'UNSUPPORTED_MIME',contentType};return {valid:true,contentType};}catch{return {valid:false,reason:'SOURCE_UNREACHABLE'};}
}
