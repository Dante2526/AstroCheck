// src/services/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  query, 
  where,
  limit 
} from 'firebase/firestore';
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

export interface FirestoreColaborador {
  matricula: string;
  nome: string;
  cargo?: string;
  turma?: string;
}

const TURMA_COLLECTIONS = [
  'turma a',
  'turma b',
  'turma c',
  'turma d',
  'turma a cg',
  'turma b cg',
  'turma c cg',
  'turma d cg',
  'turma a ccp_cg',
  'turma b ccp_cg',
  'turma c ccp_cg',
  'turma d ccp_cg',
  'estagio',
  'colaboradores'
];

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
 * Busca colaborador em tempo real no Firestore através de todas as coleções de turmas e colaboradores.
 */
export async function findColaboradorInFirestore(inputMatricula: string): Promise<FirestoreColaborador | null> {
  if (!db || !isFirebaseConfigured) {
    console.log('[AstroCheck] Firebase não configurado, utilizando base local de fallback.');
    return null;
  }

  const rawClean = inputMatricula.trim();
  const digitsOnly = rawClean.replace(/\D/g, '');
  if (!digitsOnly) return null;

  const padded8 = digitsOnly.padStart(8, '0');
  const numVal = Number(digitsOnly);

  const possibleKeys = Array.from(new Set([digitsOnly, padded8, String(numVal)]));

  try {
    await ensureFirebaseAuth();

    // 1. Tentar busca direta por Document ID em paralelo em todas as coleções
    const docLookups = TURMA_COLLECTIONS.flatMap(colName =>
      possibleKeys.map(async key => {
        try {
          const docRef = doc(db!, colName, key);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            return {
              matricula: String(data.matricula || data.Matricula || snap.id),
              nome: String(data.nome || data.Nome || data.name || data.Name || 'Colaborador'),
              cargo: String(data.cargo || data.Cargo || data.funcao || data.Funcao || ''),
              turma: String(data.turma || data.Turma || colName),
            } as FirestoreColaborador;
          }
        } catch {
          // ignora coleções onde o documento não existe
        }
        return null;
      })
    );

    const docResults = await Promise.all(docLookups);
    const foundDoc = docResults.find(Boolean);
    if (foundDoc) {
      console.log('[AstroCheck] Colaborador encontrado no Firestore por DocID:', foundDoc);
      return foundDoc;
    }

    // 2. Se não achou por Doc ID, busca por query de campo (where matricula in [...])
    const queryLookups = TURMA_COLLECTIONS.map(async colName => {
      try {
        const colRef = collection(db!, colName);
        const q = query(colRef, where('matricula', 'in', possibleKeys), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();
          return {
            matricula: String(data.matricula || data.Matricula || docSnap.id),
            nome: String(data.nome || data.Nome || data.name || data.Name || 'Colaborador'),
            cargo: String(data.cargo || data.Cargo || data.funcao || data.Funcao || ''),
            turma: String(data.turma || data.Turma || colName),
          } as FirestoreColaborador;
        }
      } catch {
        // ignora se campo não existir
      }
      return null;
    });

    const queryResults = await Promise.all(queryLookups);
    const foundQuery = queryResults.find(Boolean);
    if (foundQuery) {
      console.log('[AstroCheck] Colaborador encontrado no Firestore por Query:', foundQuery);
      return foundQuery;
    }

    console.log('[AstroCheck] Matrícula não encontrada no Firestore após varredura:', possibleKeys);
    return null;
  } catch (error) {
    console.warn('[AstroCheck] Erro na consulta ao Firestore:', error);
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
    
    // Salva na coleção 'registrosAstroCheck'
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
