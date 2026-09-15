import {normalizeTitle} from '../identity/normalize.js';
export type MatchInput={title:string;originalTitle?:string;year?:number;mediaType?:string;externalId?:string};
export function matchScore(a:MatchInput,b:MatchInput):number{let s=0; if(normalizeTitle(a.title)===normalizeTitle(b.title))s+=.7; if(a.originalTitle&&b.originalTitle&&normalizeTitle(a.originalTitle)===normalizeTitle(b.originalTitle))s+=.15; if(a.year&&b.year&&a.year===b.year)s+=.1; if(a.mediaType&&b.mediaType&&a.mediaType===b.mediaType)s+=.05; return Math.min(1,s)}
export function shouldAutoMerge(score:number,threshold=.85){return score>=threshold}
