import {query} from '../pool.js';
export type TitleRow={id:string;canonical_title:string;original_title:string|null;media_type:string;status:string;year:number|null;rating:number|null};
export async function findTitleById(id:string){const result=await query<TitleRow>('SELECT id, canonical_title, original_title, media_type, status, year, rating FROM titles WHERE id=$1',[id]); return result.rows[0]??null}
export async function searchTitles(term:string,limit=20,offset=0){const result=await query<TitleRow>('SELECT id, canonical_title, original_title, media_type, status, year, rating FROM titles WHERE canonical_title ILIKE $1 OR original_title ILIKE $1 ORDER BY popularity_score DESC LIMIT $2 OFFSET $3',[`%${term}%`,limit,offset]); return result.rows}
