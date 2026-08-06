import { TurmaKey } from './turmas';

export interface Colaborador {
  matricula: string;
  nome: string;
  cargo?: string;
  turmaPadrao?: TurmaKey;
}

/**
 * Base inicial de colaboradores cadastrados no AstroCheck.
 * Todas as matrículas seguem o padrão de 8 dígitos.
 */
// BUGFIX/SEGURANÇA: o registro de teste (matrícula 00000000) só é incluído
// em ambiente de desenvolvimento (`import.meta.env.DEV`). Antes ele também
// funcionava em produção como fallback quando a matrícula não era achada no
// Firestore, permitindo "autenticação" com um colaborador fictício.
const isDevEnv = typeof import.meta !== 'undefined' && Boolean((import.meta as any)?.env?.DEV);

export const COLABORADORES_MOCK: Colaborador[] = [
  ...(isDevEnv ? [{ matricula: '00000000', nome: 'Colaborador de Teste', turmaPadrao: 'A' as const }] : []),
  { matricula: '00001021', nome: 'Carlos Eduardo Santos', turmaPadrao: 'A' },
  { matricula: '00001045', nome: 'Mariana Silva Oliveira', turmaPadrao: 'B' },
  { matricula: '00002033', nome: 'Roberto Albuquerque Costa', turmaPadrao: 'C' },
  { matricula: '00003112', nome: 'Fernanda Lima Rocha', turmaPadrao: 'D' },
  { matricula: '00004050', nome: 'Lucas Gabriel Mendes', turmaPadrao: 'A' },
  { matricula: '00005088', nome: 'Juliana Beatriz Carvalho', turmaPadrao: 'B' },
];

/**
 * Busca um colaborador exato pela matrícula informada (aceita com ou sem zeros à esquerda).
 */
export function findColaboradorByMatricula(matricula: string): Colaborador | undefined {
  const clean = matricula.trim().toLowerCase();
  if (!clean) return undefined;
  
  // Busca exata
  const exact = COLABORADORES_MOCK.find(c => c.matricula.toLowerCase() === clean);
  if (exact) return exact;

  // Busca considerando padding de zeros até 8 dígitos
  if (/^\d+$/.test(clean) && clean.length < 8) {
    const padded = clean.padStart(8, '0');
    return COLABORADORES_MOCK.find(c => c.matricula === padded);
  }

  return undefined;
}

/**
 * Busca colaboradores por matrícula ou parte do nome.
 */
export function searchColaboradores(query: string): Colaborador[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];
  return COLABORADORES_MOCK.filter(
    c => c.matricula.toLowerCase().includes(clean) || c.nome.toLowerCase().includes(clean)
  );
}
