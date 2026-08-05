// src/services/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously, Auth, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.warn('[AstroCheck] Erro ao inicializar Firebase:', error);
  }
}

export { app, db, auth };

/**
 * Garante que o usuário esteja autenticado (anônimo) para satisfazer `request.auth != null` no Firestore.
 */
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('[AstroCheck] Falha na autenticação anônima:', err);
    return null;
  }
}

/**
 * Salva o checklist do AstroCheck no Firestore na coleção da respectiva turma ou geral.
 */
export async function saveChecklistToFirestore(reportData: any): Promise<{ success: boolean; id?: string; error?: any }> {
  if (!db || !isFirebaseConfigured) {
    console.log('[AstroCheck] Firestore não configurado, pulando persistência remota.');
    return { success: false, error: 'Firebase não configurado' };
  }

  try {
    await ensureFirebaseAuth();
    
    // Salva na coleção 'registrosAstroCheck' ou na respectiva turma
    const colRef = collection(db, 'registrosAstroCheck');
    const docRef = await addDoc(colRef, {
      ...reportData,
      createdAt: new Date().toISOString(),
    });

    console.log('[AstroCheck] Relatório salvo no Firestore com ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[AstroCheck] Erro ao salvar no Firestore:', error);
    return { success: false, error };
  }
}
