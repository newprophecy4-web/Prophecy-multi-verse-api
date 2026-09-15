export type CanonicalTitle={id:string;canonicalTitle:string;originalTitle?:string;year?:number;mediaType:string;status:string};
export type ProviderItem={providerId:string;externalId:string;titleId:string;payload:unknown};
export interface TitleRepository { findById(id:string):Promise<CanonicalTitle|null>; findCandidates(normalizedTitle:string):Promise<CanonicalTitle[]>; upsertFromProvider(input:{title:CanonicalTitle;providerItem:ProviderItem;aliases:string[]}):Promise<CanonicalTitle>; search(term:string,page:number,limit:number):Promise<CanonicalTitle[]>; }
export interface EpisodeRepository { listByTitle(titleId:string):Promise<unknown[]>; }
export interface PlaybackRepository { listSources(episodeId:string):Promise<unknown[]>; }
