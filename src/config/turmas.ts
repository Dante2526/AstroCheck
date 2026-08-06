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
    gestorNome: 'Gestor Turma A',
    gestorEmail: 'gestor.turma.a@empresa.com',
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
    gestorNome: 'Gestor Turma B',
    gestorEmail: 'gestor.turma.b@empresa.com',
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
    gestorNome: 'Gestor Turma C',
    gestorEmail: 'gestor.turma.c@empresa.com',
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
    gestorNome: 'Gestor Turma D',
    gestorEmail: 'gestor.turma.d@empresa.com',
    color: '#a855f7',
    bgLight: 'rgba(168, 85, 247, 0.08)',
    bgDark: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
  },
};

export const ALL_TURMA_KEYS: TurmaKey[] = ['A', 'B', 'C', 'D'];

// Configuração do EmailJS — lida exclusivamente das variáveis de ambiente.
// BUGFIX/SEGURANÇA: valores reais de credenciais estavam hardcoded aqui como
// fallback e ficaram expostos no histórico do repositório público. Sem a
// env var configurada, o app cai automaticamente no "modo simulação" já
// existente em emailService.ts (hasCredentials = false), então não é
// necessário (nem seguro) manter um fallback com chave real.
export const EMAILJS_SERVICE_ID = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_EMAILJS_SERVICE_ID) || '';

export const EMAILJS_TEMPLATE_ID = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_EMAILJS_TEMPLATE_ID) || '';

export const EMAILJS_PUBLIC_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_EMAILJS_PUBLIC_KEY) || '';
