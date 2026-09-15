import {createHash} from 'node:crypto';
export function canonicalTitleId(title:string,year:number|undefined,mediaType:string){return `title_${createHash('sha256').update(`${title}:${year??''}:${mediaType}`).digest('hex').slice(0,24)}`}
