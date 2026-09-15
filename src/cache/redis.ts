import { Redis } from 'ioredis'; import {env} from '../config/env.js';
export const redis=new Redis(env.REDIS_URL,{lazyConnect:true,maxRetriesPerRequest:1,enableOfflineQueue:false});
let connected=false; export async function connectRedis(){try{if(redis.status==='wait')await redis.connect(); connected=true; return true}catch{return false}}
export async function getCache<T>(key:string){if(!connected)return null; try{const v=await redis.get(key); return v?JSON.parse(v) as T:null}catch{return null}}
export async function setCache(key:string,value:unknown,ttlSeconds:number){if(!connected)return false; try{await redis.set(key,JSON.stringify(value),'EX',ttlSeconds);return true}catch{return false}}
export async function invalidateCache(...keys:string[]){if(!connected||!keys.length)return false;try{await redis.del(...keys);return true}catch{return false}}
export async function acquireLock(key:string,ttlSeconds=30){if(!connected)return false;try{return (await redis.set(`lock:${key}`,'1','EX',ttlSeconds,'NX'))==='OK'}catch{return false}}
export async function closeRedis(){try{await redis.quit()}catch{redis.disconnect()}}
