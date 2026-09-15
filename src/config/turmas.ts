// src/config/turmas.ts

function requireGestorEmail(env: string | undefined, turma: string): string {
  if (!env || !env.includes('@') || env.endsWith('@empresa.com')) {
    if (import.meta.env.PROD) {
      console.error(`[AstroCheck] VITE_GESTOR_EMAIL_${turma} não configurado!`);
      return ''; // string vazia dispara erro no emailService / ui
    }
    return `gestor.turma.${turma.toLowerCase()}@empresa.com`; // dev apenas
  }
  return env;
}

export type TurmaKey = 'A' | 'B' | 'C' | 'D';

export interface TurmaConfig {
  id: TurmaKey;
  label: string;
  turno: string;
  horario: string;
  periodo: 'Diurno' | 'Noturno';
  gestorNome: string;
  gestorEmail: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
}

export const TURMAS: Record<TurmaKey, TurmaConfig> = {
  A: {
    id: 'A',
    label: 'Turma A',
    turno: 'Turno Diurno',
    horario: '07h00 às 19h00',
    periodo: 'Diurno',
    gestorNome: import.meta.env.VITE_GESTOR_NOME_A || 'Gestor Turma A',
    gestorEmail: requireGestorEmail(import.meta.env.VITE_GESTOR_EMAIL_A || import.meta.env.VITE_GESTOR_EMAIL, 'A'),
    color: '#0080ff',
    bgLight: 'rgba(0, 128, 255, 0.08)',
    bgDark: 'rgba(0, 128, 255, 0.15)',
    borderColor: '#0080ff',
  },
  B: {
    id: 'B',
    label: 'Turma B',
    turno: 'Turno Diurno',
    horario: '07h00 às 19h00',
    periodo: 'Diurno',
    gestorNome: import.meta.env.VITE_GESTOR_NOME_B || 'Gestor Turma B',
    gestorEmail: requireGestorEmail(import.meta.env.VITE_GESTOR_EMAIL_B || import.meta.env.VITE_GESTOR_EMAIL, 'B'),
    color: '#22c55e',
    bgLight: 'rgba(34, 197, 94, 0.08)',
    bgDark: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  C: {
    id: 'C',
    label: 'Turma C',
    turno: 'Turno Noturno',
    horario: '19h00 às 07h00',
    periodo: 'Noturno',
    gestorNome: import.meta.env.VITE_GESTOR_NOME_C || 'Gestor Turma C',
    gestorEmail: requireGestorEmail(import.meta.env.VITE_GESTOR_EMAIL_C || import.meta.env.VITE_GESTOR_EMAIL, 'C'),
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.08)',
    bgDark: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  D: {
    id: 'D',
    label: 'Turma D',
    turno: 'Turno Noturno',
    horario: '19h00 às 07h00',
    periodo: 'Noturno',
    gestorNome: import.meta.env.VITE_GESTOR_NOME_D || 'Gestor Turma D',
    gestorEmail: requireGestorEmail(import.meta.env.VITE_GESTOR_EMAIL_D || import.meta.env.VITE_GESTOR_EMAIL, 'D'),
    color: '#a855f7',
    bgLight: 'rgba(168, 85, 247, 0.08)',
    bgDark: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
  },
};

export const ALL_TURMA_KEYS: TurmaKey[] = ['A', 'B', 'C', 'D'];


// Webhook Google Apps Script (Gmail oficial: 500 a 1.500 envios/dia gratuitos)
export const GOOGLE_SCRIPT_URL: string = 
  import.meta.env.VITE_GOOGLE_SCRIPT_URL || 
  import.meta.env.VITE_EMAIL_WEBHOOK_URL || 
  import.meta.env.GOOGLE_SCRIPT_URL || 
  '';


