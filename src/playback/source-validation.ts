import type {LocalSource} from '../storage/local-store.js';
import {LEGAL_LICENSE_STATUSES, formatFromUrl} from '../providers/provider.interface.js';

export type ValidationResult={valid:boolean;reason?:string;contentType?:string};
export async function validateSource(source:LocalSource, timeoutMs=Number(process.env.PROVIDER_TIMEOUT_MS??8000)):Promise<ValidationResult>{
  if(!LEGAL_LICENSE_STATUSES.includes(source.licenseStatus as never))return {valid:false,reason:'LICENSE_REJECTED'};
  if(source.availability!=='available')return {valid:false,reason:'SOURCE_UNAVAILABLE'};
  if(source.expiresAt&&new Date(source.expiresAt)<=new Date())return {valid:false,reason:'SOURCE_EXPIRED'};
  if(!source.url)return {valid:false,reason:'SOURCE_URL_MISSING'};
  let parsed:URL;try{parsed=new URL(source.url);}catch{return {valid:false,reason:'INVALID_URL'};}
  if(parsed.protocol!=='https:')return {valid:false,reason:'INSECURE_URL'};
  const format=formatFromUrl(source.url);if(!format&&!['hls','mp4','webm'].includes(source.format))return {valid:false,reason:'UNSUPPORTED_FORMAT'};
  try{let response=await fetch(source.url,{method:'HEAD',signal:AbortSignal.timeout(timeoutMs)});if(response.status===405||response.status===501)response=await fetch(source.url,{headers:{range:'bytes=0-1'},signal:AbortSignal.timeout(timeoutMs)});if(response.status<200||response.status>=400)return {valid:false,reason:`HTTP_${response.status}`};const contentType=response.headers.get('content-type')??undefined;if(contentType&&!(/video\/(mp4|webm)/i.test(contentType)||/mpegurl/i.test(contentType)||/octet-stream/i.test(contentType)))return {valid:false,reason:'UNSUPPORTED_MIME',contentType};return {valid:true,contentType};}catch{return {valid:false,reason:'SOURCE_UNREACHABLE'};}
}
