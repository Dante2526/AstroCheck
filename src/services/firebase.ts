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

// NOTA DE SEGURANÇA (#28): Em aplicações SPA/PWA Firebase, a apiKey é um identificador
// público do projeto no Google Cloud e não uma chave mestra de autenticação. O controle
// real de permissões, leitura e escrita é estritamente governado pelas Firestore Security Rules
// (ex: validação de request.auth != null e schema de campos na coleção registrosAstroCheck).
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
  'administrators',
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
// BUGFIX/SEGURANÇA: o cache persistente guarda nome/matrícula/cargo de
// colaboradores buscados. Antes ficava salvo indefinidamente no localStorage
// (até 500 registros), o que em um dispositivo compartilhado (tablet/celular
// usado por vários colaboradores) virava uma lista pesquisável de dados de
// colegas de trabalho. Agora cada entrada expira após 24h (duração de um
// turno) e entradas expiradas são descartadas automaticamente.
const CACHE_STORAGE_KEY = 'astrocheck_colabs_cache_v3';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Opcao B: TTL agressivo em memoria - expurgar PII apos 5 min
const MEMORY_TTL_MS = 5 * 60 * 1000;
interface MemoryEntry {
  item: FirestoreColaborador;
  expiresAt: number;
}
const memoryCacheWithTTL = new Map<string, MemoryEntry>();

function memorySet(key: string, item: FirestoreColaborador): void {
  memoryCacheWithTTL.set(key, {
    item,
    expiresAt: Date.now() + MEMORY_TTL_MS,
  });
}

function memoryGet(key: string): FirestoreColaborador | null {
  const entry = memoryCacheWithTTL.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCacheWithTTL.delete(key);
    return null;
  }
  return entry.item;
}

interface CachedEntry {
  item: FirestoreColaborador;
  cachedAt: number;
}

function readPersistentCache(): CachedEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!stored) return [];
    const list: CachedEntry[] = JSON.parse(stored);
    const now = Date.now();
    return list.filter(entry => entry && entry.item && (now - entry.cachedAt) < CACHE_TTL_MS);
  } catch {
    return [];
  }
}

function writePersistentCache(entries: CachedEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries.slice(0, 500)));
  } catch {
    // quota safe
  }
}

function initCache() {
  const fresh = readPersistentCache();
  // Regrava já sem as entradas expiradas, para não deixar PII antiga acumulada
  writePersistentCache(fresh);
  fresh.forEach(({ item }) => {
    if (item.matricula) {
      const raw = String(item.matricula).replace(/\D/g, '');
      memorySet(raw, item);
      memorySet(raw.padStart(8, '0'), item);
      memorySet(String(Number(raw)), item);
    }
  });
}
initCache();

function cacheColaborador(item: FirestoreColaborador) {
  const raw = String(item.matricula).replace(/\D/g, '');
  if (!raw) return;
  
  // Cache in-memory completo (válido apenas durante a sessão atual, limitado pelo TTL)
  memorySet(raw, item);
  memorySet(raw.padStart(8, '0'), item);
  memorySet(String(Number(raw)), item);

  if (typeof window !== 'undefined') {
    const now = Date.now();
    const existing = readPersistentCache().filter(entry => entry.item.matricula !== item.matricula);
    
    // BUGFIX: PII Mitigation - salvar apenas a matrícula no localStorage (não salvar nome/cargo)
    const safeItem: FirestoreColaborador = { matricula: item.matricula, nome: '', cargo: '', turma: '' };
    existing.unshift({ item: safeItem, cachedAt: now });
    writePersistentCache(existing);
  }
}

/**
 * Consulta SOMENTE o cache local (memória), sem nunca disparar leitura no
 * Firestore. Usado por fluxos que precisam ser instantâneos e baratos
 * (ex: acesso rápido por biometria), onde uma busca completa multi-coleção
 * a cada toque seria uma leitura desnecessária.
 */
export function getCachedColaborador(inputMatricula: string): FirestoreColaborador | null {
  const digitsOnly = inputMatricula.trim().replace(/\D/g, '');
  if (!digitsOnly) return null;
  const cached = memoryGet(digitsOnly);
  if (cached?.nome) return cached;

  const padded8 = digitsOnly.padStart(8, '0');
  const cachedPadded = memoryGet(padded8);
  if (cachedPadded?.nome) return cachedPadded;

  return null;
}

/**
 * Garante que o usuário esteja autenticado (anônimo) para satisfazer `request.auth != null` no Firestore.
 * Inclui timeout de segurança para evitar que falhas de rede travem chamadas subsequentes (#7).
 */
export async function ensureFirebaseAuth(timeoutMs: number = 6000): Promise<User | null> {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;

  let timer: any = null;
  const authPromise = signInAnonymously(auth).then(cred => cred.user);
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[AstroCheck] Timeout (${timeoutMs}ms) na autenticação anônima do Firebase`);
      resolve(null);
    }, timeoutMs);
  });

  try {
    const user = await Promise.race([authPromise, timeoutPromise]);
    return user;
  } catch (err) {
    console.warn('[AstroCheck] Falha na autenticação anônima:', err);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Aquecimento de autenticação em segundo plano na inicialização do app
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  ensureFirebaseAuth().catch(() => {});
}

function extractColaboradorData(data: Record<string, any>, docId: string, colName: string): FirestoreColaborador {
  const isAdm = colName.toLowerCase() === 'administrators';
  return {
    matricula: String(data.matricula || data.Matricula || docId),
    nome: String(data.nome || data.Nome || data.name || data.Name || data.displayName || (isAdm ? 'Administrador' : 'Colaborador')),
    cargo: String(data.cargo || data.Cargo || data.funcao || data.Funcao || data.role || data.Role || (isAdm ? 'Administrador' : '')),
    turma: String(data.turma || data.Turma || (isAdm ? 'Administração' : colName)),
  };
}

async function searchInCollections(
  collections: string[],
  possibleKeys: string[]
): Promise<FirestoreColaborador | null> {
  if (!db) return null;

  // 1. Busca direta por Document ID - sequencial para parar na primeira que acertar
  for (const colName of collections) {
    for (const key of possibleKeys) {
      try {
        const docRef = doc(db!, colName, key);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const colab = extractColaboradorData(snap.data(), snap.id, colName);
          cacheColaborador(colab);
          return colab;
        }
      } catch {
        // ignora
      }
    }
  }

  // 2. Busca por query where('matricula') caso o ID seja aleatório
  for (const colName of collections) {
    try {
      const colRef = collection(db!, colName);
      const q = query(colRef, where('matricula', 'in', possibleKeys), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const colab = extractColaboradorData(docSnap.data(), docSnap.id, colName);
        cacheColaborador(colab);
        return colab;
      }
    } catch {
      // ignora
    }
  }

  return null;
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

  // ⚡ NÍVEL 0: CACHE LOCAL INSTANTÂNEO
  // Só usar se tiver o nome, caso contrário precisamos buscar no Firestore
  const cachedRaw = memoryGet(digitsOnly);
  if (cachedRaw && cachedRaw.nome) {
    return cachedRaw;
  }
  const padded8 = digitsOnly.padStart(8, '0');
  const cachedPadded = memoryGet(padded8);
  if (cachedPadded && cachedPadded.nome) {
    return cachedPadded;
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
    
    // Salva na coleção 'registrosAstroCheck' com data única e consistente (#8)
    const colRef = collection(db, 'registrosAstroCheck');
    const recordTimestamp = reportData.timestamp || new Date().toISOString();
    const docRef = await addDoc(colRef, {
      ...reportData,
      createdAt: recordTimestamp,
      timestamp: recordTimestamp,
    });

    console.log('[AstroCheck] Relatório salvo no Firestore com ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[AstroCheck] Erro ao salvar no Firestore:', error);
    return { success: false, error };
  }
}
