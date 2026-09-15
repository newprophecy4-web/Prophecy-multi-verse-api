import pg from 'pg'; import {env} from '../config/env.js';
const {Pool}=pg;
export const pool=new Pool({connectionString:env.DATABASE_URL, max:10, idleTimeoutMillis:30000, connectionTimeoutMillis:5000, statement_timeout:10000});
export async function query<T extends pg.QueryResultRow=pg.QueryResultRow>(text:string, values:unknown[]=[]):Promise<pg.QueryResult<T>>{return pool.query<T>(text,values)}
export async function transaction<T>(fn:(client:pg.PoolClient)=>Promise<T>):Promise<T>{const client=await pool.connect(); try{await client.query('BEGIN'); const result=await fn(client); await client.query('COMMIT'); return result}catch(error){await client.query('ROLLBACK'); throw error}finally{client.release()}}
export async function closeDatabase(){await pool.end()}
