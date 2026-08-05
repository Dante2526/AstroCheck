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

const PRIMARY_COLLECTIONS = [
  'turma a',
  'turma b',
  'turma c',
  'turma d'
];

const SECONDARY_COLLECTIONS = [
  'turma a cg',
  'turma b cg',
  'turma c cg',
  'turma d cg',
  'estagio'
];

// ============================================================================
// ⚡ CACHE EM MEMÓRIA & PERSISTENTE (VELOCIDADE INSTANTÂNEA: 0ms & 0 LEITURAS)
// ============================================================================
const CACHE_STORAGE_KEY = 'astrocheck_colabs_cache_v2';
const memoryCache = new Map<string, FirestoreColaborador>();

function initCache() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
      const list: FirestoreColaborador[] = JSON.parse(stored);
      list.forEach(item => {
        if (item.matricula) {
          const raw = String(item.matricula).replace(/\D/g, '');
          memoryCache.set(raw, item);
          memoryCache.set(raw.padStart(8, '0'), item);
          memoryCache.set(String(Number(raw)), item);
        }
      });
    }
  } catch {
    // fallback seguro
  }
}
initCache();

function cacheColaborador(item: FirestoreColaborador) {
  const raw = String(item.matricula).replace(/\D/g, '');
  if (!raw) return;
  memoryCache.set(raw, item);
  memoryCache.set(raw.padStart(8, '0'), item);
  memoryCache.set(String(Number(raw)), item);

  if (typeof window !== 'undefined') {
    try {
      const all = Array.from(new Set(memoryCache.values()));
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(all.slice(0, 500)));
    } catch {
      // quota safe
    }
  }
}

/**
 * Corrida paralela: Retorna imediatamente no PRIMEIRO resultado válido encontrado
 * sem esperar que as outras requisições terminem.
 */
function firstSuccessfulHit<T>(promises: Promise<T | null>[]): Promise<T | null> {
  return new Promise(resolve => {
    let pending = promises.length;
    let hasResolved = false;

    if (pending === 0) {
      resolve(null);
      return;
    }

    promises.forEach(p => {
      p.then(res => {
        if (res && !hasResolved) {
          hasResolved = true;
          resolve(res);
        }
      }).catch(() => {
        // ignora erros de coleções vazias/ausentes
      }).finally(() => {
        pending -= 1;
        if (pending === 0 && !hasResolved) {
          resolve(null);
        }
      });
    });
  });
}

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

// Aquecimento de autenticação em segundo plano na inicialização do app
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  ensureFirebaseAuth().catch(() => {});
}

async function searchInCollections(
  collections: string[],
  possibleKeys: string[]
): Promise<FirestoreColaborador | null> {
  if (!db) return null;

  // 1. Busca direta por Document ID (Super rápida e econômica)
  const docLookups = collections.flatMap(colName =>
    possibleKeys.map(async key => {
      try {
        const docRef = doc(db!, colName, key);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const colab: FirestoreColaborador = {
            matricula: String(data.matricula || data.Matricula || snap.id),
            nome: String(data.nome || data.Nome || data.name || data.Name || 'Colaborador'),
            cargo: String(data.cargo || data.Cargo || data.funcao || data.Funcao || ''),
            turma: String(data.turma || data.Turma || colName),
          };
          cacheColaborador(colab);
          return colab;
        }
      } catch {
        // ignora
      }
      return null;
    })
  );

  const fastestDoc = await firstSuccessfulHit(docLookups);
  if (fastestDoc) return fastestDoc;

  // 2. Busca por query where('matricula') caso o ID seja aleatório
  const queryLookups = collections.map(async colName => {
    try {
      const colRef = collection(db!, colName);
      const q = query(colRef, where('matricula', 'in', possibleKeys), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        const colab: FirestoreColaborador = {
          matricula: String(data.matricula || data.Matricula || docSnap.id),
          nome: String(data.nome || data.Nome || data.name || data.Name || 'Colaborador'),
          cargo: String(data.cargo || data.Cargo || data.funcao || data.Funcao || ''),
          turma: String(data.turma || data.Turma || colName),
        };
        cacheColaborador(colab);
        return colab;
      }
    } catch {
      // ignora
    }
    return null;
  });

  return await firstSuccessfulHit(queryLookups);
}

/**
 * Busca colaborador ultrarrápida e econômica:
 * Nível 0: Cache Local (0ms e 0 leituras)
 * Nível 1: Coleções Principais (turma a..d, colaboradores) -> 99% dos casos, economiza leituras
 * Nível 2: Coleções Secundárias (cg, ccp_cg, estágio) -> Apenas se não encontrar no Nível 1
 */
export async function findColaboradorInFirestore(
  inputMatricula: string,
  preferredTurma?: string
): Promise<FirestoreColaborador | null> {
  const rawClean = inputMatricula.trim();
  const digitsOnly = rawClean.replace(/\D/g, '');
  if (!digitsOnly) return null;

  // ⚡ NÍVEL 0: CACHE LOCAL INSTANTÂNEO (0ms & 0 LEITURAS NO FIRESTORE)
  if (memoryCache.has(digitsOnly)) {
    return memoryCache.get(digitsOnly)!;
  }
  const padded8 = digitsOnly.padStart(8, '0');
  if (memoryCache.has(padded8)) {
    return memoryCache.get(padded8)!;
  }

  if (!db || !isFirebaseConfigured) {
    return null;
  }

  const numVal = Number(digitsOnly);
  const possibleKeys = Array.from(new Set([digitsOnly, padded8, String(numVal)]));

  try {
    await ensureFirebaseAuth();

    // ⚡ NÍVEL 1: BUSCA NAS COLEÇÕES PRINCIPAIS (onde fica 99% dos tripulantes)
    const primaryCols = [...PRIMARY_COLLECTIONS];
    if (preferredTurma) {
      const matchIndex = primaryCols.findIndex(c => c.toLowerCase() === preferredTurma.toLowerCase());
      if (matchIndex > -1) {
        const [fav] = primaryCols.splice(matchIndex, 1);
        primaryCols.unshift(fav);
      }
    }

    const primaryHit = await searchInCollections(primaryCols, possibleKeys);
    if (primaryHit) {
      return primaryHit; // Encerra imediatamente, economizando leituras nas coleções secundárias!
    }

    // ⚡ NÍVEL 2: BUSCA NAS COLEÇÕES SECUNDÁRIAS (Apenas se não encontrado no nível 1)
    const secondaryHit = await searchInCollections(SECONDARY_COLLECTIONS, possibleKeys);
    if (secondaryHit) {
      return secondaryHit;
    }

    return null;
  } catch (error) {
    console.warn('[AstroCheck] Erro na busca remota:', error);
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
