import {firebaseAdmin} from '../config/firebase.js';
const userRef=(uid:string)=>firebaseAdmin().firestore.collection('users').doc(uid);
export class FirestoreUserRepository {
  async get(uid:string){const snap=await userRef(uid).get();return snap.exists?snap.data()??{}:null;}
  async set(uid:string,data:Record<string,unknown>){const value={...data,updatedAt:new Date().toISOString()};await userRef(uid).set(value,{merge:true});return value;}
  async updateList(uid:string,field:'favorites'|'history',value:unknown[]){return this.set(uid,{[field]:value});}
  async updateSettings(uid:string,settings:Record<string,unknown>){return this.set(uid,{settings});}
}
