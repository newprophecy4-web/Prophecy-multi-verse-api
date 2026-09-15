import {z} from 'zod';
import {cert,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';

export const firebaseConfig=z.object({apiKey:z.string().default(''),authDomain:z.string().default('kanri-bu.firebaseapp.com'),projectId:z.string().default('kanri-bu'),storageBucket:z.string().default('kanri-bu.firebasestorage.app'),messagingSenderId:z.string().default('725922252135'),appId:z.string().default('1:725922252135:web:33810bb8f3e88665cd9bc2'),measurementId:z.string().default('G-SZ39BXV1NY'),serviceAccountJson:z.string().default('')}).parse({apiKey:process.env.FIREBASE_API_KEY,authDomain:process.env.FIREBASE_AUTH_DOMAIN,projectId:process.env.FIREBASE_PROJECT_ID,storageBucket:process.env.FIREBASE_STORAGE_BUCKET,messagingSenderId:process.env.FIREBASE_MESSAGING_SENDER_ID,appId:process.env.FIREBASE_APP_ID,measurementId:process.env.FIREBASE_MEASUREMENT_ID,serviceAccountJson:process.env.FIREBASE_SERVICE_ACCOUNT_JSON});
export const firebaseServerConfigured=Boolean(firebaseConfig.serviceAccountJson);
export const firestoreConfigured=firebaseServerConfigured;
export function firebaseAdmin(){if(!firebaseServerConfigured)throw Object.assign(new Error('Firebase server credential is not configured'),{code:'FIREBASE_SERVER_AUTH_REQUIRED',statusCode:503});let app=getApps()[0];if(!app){let credential:Record<string,unknown>;try{credential=JSON.parse(firebaseConfig.serviceAccountJson)}catch{throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON'),{code:'FIREBASE_CONFIG_INVALID',statusCode:503})}app=initializeApp({credential:cert(credential as Parameters<typeof cert>[0]),projectId:firebaseConfig.projectId});}return {auth:getAuth(app),firestore:getFirestore(app)}}
