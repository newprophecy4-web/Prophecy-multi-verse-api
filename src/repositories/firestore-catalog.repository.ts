import {firebaseAdmin} from '../config/firebase.js'; import type {LocalEpisode, LocalTitle} from '../storage/local-store.js';
export class FirestoreCatalogRepository {
 async list(){const {firestore}=firebaseAdmin();const snap=await firestore.collection('titles').get();return snap.docs.map(d=>d.data() as LocalTitle);}
 async getTitle(id:string){const {firestore}=firebaseAdmin();const snap=await firestore.collection('titles').doc(id).get();return snap.exists?(snap.data() as LocalTitle):null;}
 async getEpisode(id:string){const {firestore}=firebaseAdmin();const snap=await firestore.collectionGroup('episodes').where('episodeId','==',id).limit(1).get();if(snap.empty)return null;const doc=snap.docs[0];const title=await this.getTitle(doc.ref.parent.parent?.id??'');return title?{title,episode:doc.data() as LocalEpisode}:null;}
 async upsertTitle(title:LocalTitle){const {firestore}=firebaseAdmin();const document=JSON.parse(JSON.stringify(title)) as LocalTitle;await firestore.collection('titles').doc(title.titleId).set(document,{merge:true});const batch=firestore.batch();for(const season of title.seasons)for(const episode of season.episodes){const ref=firestore.collection('titles').doc(title.titleId).collection('episodes').doc(episode.episodeId);batch.set(ref,JSON.parse(JSON.stringify(episode)),{merge:true});}await batch.commit();return title;}
}
