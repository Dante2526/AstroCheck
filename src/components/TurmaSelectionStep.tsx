// src/components/TurmaSelectionStep.tsx
import React from 'react';
import { TurmaKey, TURMAS, ALL_TURMA_KEYS } from '../config/turmas';

export interface TurmaSelectionStepProps {
  selectedTurma: TurmaKey | null;
  onSelectTurma: (turma: TurmaKey) => void;
  onSend: () => void;
  onBack: () => void;
  isSending: boolean;
  isSuccess: boolean;
  onReset: () => void;
  totalRisks: number;
  isDarkMode: boolean;
}

export const TurmaSelectionStep: React.FC<TurmaSelectionStepProps> = ({
  selectedTurma,
  onSelectTurma,
  onSend,
  onBack,
  isSending,
  isSuccess,
  onReset,
  totalRisks,
  isDarkMode,
}) => {
  // Tela de Sucesso
  if (isSuccess && selectedTurma) {
    const config = TURMAS[selectedTurma];
    return (
      <div className="w-full bg-surface-container-lowest dark:bg-[#1E2029] rounded-2xl overflow-hidden flex flex-col items-center text-center transition-all duration-300 shadow-[0_4px_20px_rgba(32,59,139,0.10)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-[3px] border-[#22c55e] dark:border-[#22c55e] p-5 sm:p-7 flex-1 min-h-0 max-h-[540px] sm:max-h-[580px] justify-between">
        
        {/* Mascote Astronauta de Sucesso */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#22c55e]/15 dark:bg-[#22c55e]/20 rounded-full flex items-center justify-center p-3 relative shadow-inner">
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-md animate-bounce">
            <span className="material-symbols-outlined text-[20px]">check</span>
          </div>
          <img 
            src="/astronaut_confortavel.webp" 
            alt="Astronauta Confiante e Apto" 
            className="w-full h-full object-contain drop-shadow"
          />
        </div>

        {/* Mensagem Principal */}
        <div className="my-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22c55e]/15 dark:bg-[#22c55e]/25 text-[#15803d] dark:text-[#4ade80] font-bold text-xs sm:text-sm mb-2">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Checklist Concluído</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-on-surface dark:text-[#f7fafc] leading-tight">
            Prontidão Enviada com Sucesso!
          </h2>

          <p className="text-xs sm:text-sm text-on-surface-variant dark:text-[#a0aec0] mt-2 max-w-md mx-auto leading-relaxed">
            O relatório de prontidão operacional foi transmitido diretamente para o gestor da{' '}
            <strong className="text-primary dark:text-[#90eff9] font-bold">{config.label}</strong> ({config.turno}).
          </p>

          {/* Card Resumo do Status */}
          <div className="mt-3 py-2 px-4 rounded-xl bg-surface-container-low/60 dark:bg-[#171922] border border-outline-variant/60 dark:border-[#2d3139] flex items-center justify-center gap-3">
            <span className="text-xs font-semibold text-on-surface dark:text-[#f7fafc]">
              Status de Aptidão:
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              totalRisks === 0 
                ? 'bg-[#22c55e]/20 text-[#15803d] dark:text-[#4ade80]' 
                : 'bg-error-container dark:bg-[#ff5252]/20 text-on-error-container dark:text-[#ff7b7b]'
            }`}>
              {totalRisks === 0 ? '100% APTO ✓' : `${totalRisks} PONTO(S) DE ATENÇÃO`}
            </span>
          </div>
        </div>

        {/* Botão para Reiniciar */}
        <button
          onClick={onReset}
          className="w-full sm:w-auto bg-[#ff6b00] hover:bg-[#ea580c] active:bg-[#c2410c] dark:bg-[#ff7a00] dark:hover:bg-[#ea580c] text-white text-sm font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          <span>Iniciar Novo Checklist</span>
        </button>
      </div>
    );
  }

  // Tela de Seleção de Turma
  const isSendDisabled = selectedTurma === null || isSending;

  return (
    <div className="w-full bg-surface-container-lowest dark:bg-[#1E2029] rounded-2xl overflow-hidden flex flex-col relative transition-all duration-300 shadow-[0_4px_20px_rgba(32,59,139,0.10)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-[3px] border-transparent dark:border-[#2d3139] p-3 sm:p-5 flex-1 min-h-0 max-h-[520px] sm:max-h-[580px] justify-between">
      
      {/* Cabeçalho da Etapa com Mini-Mascote */}
      <div className="flex items-center gap-3 pb-2 border-b border-outline-variant/40 dark:border-[#2d3139]">
        <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-surface-container-low/60 dark:bg-[#171922] p-1 flex items-center justify-center shrink-0 border border-outline-variant/40 dark:border-[#2d3139]">
          <img 
            src="/file_0000000059b0820e9a6113802390edd4.webp" 
            alt="Mascote Astronauta" 
            className="w-full h-full object-contain"
            style={{ filter: isDarkMode ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#ff6b00] dark:text-[#ff7a00]">
              Etapa Final
            </span>
            <span className="text-xs text-on-surface-variant dark:text-[#718096]">&bull;</span>
            <span className="text-[11px] sm:text-xs text-on-surface-variant dark:text-[#a0aec0]">
              Destino do E-mail
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-on-surface dark:text-[#f7fafc] truncate">
            Escolha sua Turma Operacional
          </h2>
        </div>
      </div>

      {/* Grid de Seleção das 4 Turmas */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 my-2.5 flex-1 items-center">
        {ALL_TURMA_KEYS.map((key) => {
          const turma = TURMAS[key];
          const isSelected = selectedTurma === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectTurma(key)}
              className={`relative flex flex-col text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-98 select-none group ${
                isSelected
                  ? 'border-[#ff6b00] dark:border-[#ff7a00] bg-[#ff6b00]/10 dark:bg-[#ff7a00]/15 shadow-md ring-2 ring-[#ff6b00]/30 dark:ring-[#ff7a00]/30'
                  : 'border-outline-variant dark:border-[#383d4a] bg-surface-container-low/30 dark:bg-[#171922]/50 hover:border-outline hover:bg-surface-container-low dark:hover:bg-[#171922] dark:hover:border-[#4a5568]'
              }`}
            >
              {/* Badge de Selecionado */}
              <div className={`absolute top-2.5 right-2.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSelected 
                  ? 'bg-[#ff6b00] dark:bg-[#ff7a00] text-white scale-100 shadow' 
                  : 'border-2 border-outline-variant dark:border-[#4a5568] scale-90 opacity-60'
              }`}>
                {isSelected && (
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] font-bold">check</span>
                )}
              </div>

              {/* Tag do Período */}
              <div className="flex items-center gap-1 mb-1">
                <span className={`material-symbols-outlined text-[14px] sm:text-[16px] ${
                  turma.periodo === 'Diurno' ? 'text-amber-500' : 'text-indigo-400'
                }`}>
                  {turma.periodo === 'Diurno' ? 'wb_sunny' : 'bedtime'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-on-surface-variant dark:text-[#a0aec0] uppercase tracking-wide">
                  {turma.periodo}
                </span>
              </div>

              {/* Nome da Turma */}
              <span className={`text-base sm:text-lg font-black transition-colors ${
                isSelected 
                  ? 'text-[#ff6b00] dark:text-[#ff7a00]' 
                  : 'text-on-surface dark:text-[#f7fafc]'
              }`}>
                {turma.label}
              </span>

              {/* Horário */}
              <span className="text-[11px] sm:text-xs text-on-surface-variant dark:text-[#a0aec0] mt-0.5 font-medium">
                {turma.horario}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info do Gestor Destinatário quando selecionado */}
      <div className="min-h-[38px] px-3 py-1.5 rounded-lg bg-surface-container-low/50 dark:bg-[#171922]/80 border border-outline-variant/40 dark:border-[#2d3139] flex items-center justify-between text-xs text-on-surface-variant dark:text-[#a0aec0]">
        <div className="flex items-center gap-1.5 truncate">
          <span className="material-symbols-outlined text-[16px] text-primary dark:text-[#90eff9]">mail</span>
          <span className="truncate">
            {selectedTurma ? (
              <>
                Enviar para o Gestor da <strong className="text-on-surface dark:text-[#f7fafc]">{TURMAS[selectedTurma].label}</strong>
              </>
            ) : (
              'Selecione uma turma para habilitar o envio'
            )}
          </span>
        </div>

        {selectedTurma && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-high dark:bg-[#252836] text-primary dark:text-[#90eff9] shrink-0">
            {TURMAS[selectedTurma].gestorEmail}
          </span>
        )}
      </div>

      {/* Botões de Ação (Voltar / Enviar Prontidão) */}
      <div className="w-full flex justify-between items-center mt-3 pt-2 border-t border-outline-variant/40 dark:border-[#2d3139] shrink-0">
        <button 
          onClick={onBack}
          disabled={isSending}
          className="bg-[#0080ff] hover:bg-[#0066cc] active:bg-[#004fa3] dark:bg-[#0080ff] dark:hover:bg-[#0066cc] text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-full shadow-sm hover:shadow transition-all duration-200 active:scale-95 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_back</span>
          <span>Voltar</span>
        </button>

        <button 
          onClick={onSend} 
          disabled={isSendDisabled}
          className={`text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-5 sm:px-7 rounded-full shadow-sm transition-all duration-200 flex items-center gap-2 ${
            isSendDisabled
              ? 'bg-gray-300 dark:bg-[#2d3139] text-gray-500 dark:text-gray-500 opacity-50 cursor-not-allowed shadow-none'
              : 'bg-[#ff6b00] hover:bg-[#ea580c] active:bg-[#c2410c] dark:bg-[#ff7a00] dark:hover:bg-[#ea580c] text-white hover:shadow-lg active:scale-95 cursor-pointer animate-pulse'
          }`}
        >
          {isSending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              <span>Disparando E-mail...</span>
            </>
          ) : (
            <>
              <span>Enviar Prontidão</span>
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">send</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
