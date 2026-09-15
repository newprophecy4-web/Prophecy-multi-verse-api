import {Queue,Worker,Job} from 'bullmq'; import {env} from '../config/env.js';
const connection={url:env.REDIS_URL}; export const queueNames=['provider-sync','source-health','search-index','cleanup-reconciliation'] as const; export const queues=Object.fromEntries(queueNames.map(name=>[name,new Queue(name,{connection,defaultJobOptions:{attempts:3,backoff:{type:'exponential',delay:1000},removeOnComplete:100,removeOnFail:100}})])) as Record<string,Queue>;
export async function enqueue(name:string,data:unknown,jobId?:string){return queues[name].add(name,data,jobId?{jobId}:undefined)}
export function startWorkers(handler:(name:string,job:Job)=>Promise<unknown>){return queueNames.map(name=>new Worker(name,job=>handler(name,job),{connection,concurrency:2}))}
export async function closeQueues(){await Promise.all(Object.values(queues).map(q=>q.close()))}
