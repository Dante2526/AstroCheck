// src/config/turmas.ts

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
    gestorEmail: import.meta.env.VITE_GESTOR_EMAIL_A || import.meta.env.VITE_GESTOR_EMAIL || 'gestor.turma.a@empresa.com',
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
    gestorEmail: import.meta.env.VITE_GESTOR_EMAIL_B || import.meta.env.VITE_GESTOR_EMAIL || 'gestor.turma.b@empresa.com',
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
    gestorEmail: import.meta.env.VITE_GESTOR_EMAIL_C || import.meta.env.VITE_GESTOR_EMAIL || 'gestor.turma.c@empresa.com',
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
    gestorEmail: import.meta.env.VITE_GESTOR_EMAIL_D || import.meta.env.VITE_GESTOR_EMAIL || 'gestor.turma.d@empresa.com',
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
  (import.meta.env as any).GOOGLE_SCRIPT_URL || 
  '';


