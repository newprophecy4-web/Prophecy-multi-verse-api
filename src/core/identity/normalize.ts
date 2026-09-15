export function normalizeTitle(value:string):string{return value.normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\\s+/g,' ')}
export function aliasKey(value:string):string{return normalizeTitle(value)}
