import React, { useState } from 'react';
import { Colaborador, findColaboradorByMatricula } from '../config/colaboradores';
import { findColaboradorInFirestore } from '../services/firebase';

interface ColaboradorStepProps {
  onConfirm: (colaborador: { matricula: string; nome: string; cargo?: string }) => void;
  initialData?: { matricula: string; nome: string; cargo?: string } | null;
  isDarkMode: boolean;
}

interface SavedBiometric {
  type: 'fingerprint' | 'face';
  matricula: string;
  nome: string;
}

const STORAGE_KEY = 'astrocheck_saved_biometric';

// Detecção inteligente de dispositivo móvel (Smartphones / Tablets) vs PC Desktop
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  return isMobileUA || (hasTouch && window.innerWidth <= 1024);
};

export const ColaboradorStep: React.FC<ColaboradorStepProps> = ({
  onConfirm,
  initialData,
}) => {
  const [isMobile] = useState<boolean>(() => isMobileDevice());
  const [matricula, setMatricula] = useState(initialData?.matricula || '');
  const [searchedColaborador, setSearchedColaborador] = useState<Colaborador | null>(() => {
    return initialData ? findColaboradorByMatricula(initialData.matricula) || null : null;
  });
  const [hasSearched, setHasSearched] = useState(Boolean(initialData));
  const [isSearching, setIsSearching] = useState(false);

  // Armazenamento local da biometria/facial vinculada (apenas para dispositivos móveis)
  const [savedBiometric, setSavedBiometric] = useState<SavedBiometric | null>(() => {
    if (!isMobileDevice()) return null;
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<'fingerprint' | 'face' | null>(null);

  // Ao alterar o texto da matrícula, reseta o resultado anterior
  const handleChangeMatricula = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
    setMatricula(val);
    setSearchedColaborador(null);
    setHasSearched(false);
    setBiometricFeedback(null);
  };

  const handleClear = () => {
    setMatricula('');
    setSearchedColaborador(null);
    setHasSearched(false);
    setBiometricFeedback(null);
  };

  const handleSearchOrSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMatricula = matricula.trim();
    if (!cleanMatricula) return;

    setIsSearching(true);
    setHasSearched(true);
    setBiometricFeedback(null);

    try {
      // 1. Busca no Firestore em tempo real nas coleções das turmas
      const firestoreColab = await findColaboradorInFirestore(cleanMatricula);
      if (firestoreColab) {
        setSearchedColaborador({
          matricula: firestoreColab.matricula,
          nome: firestoreColab.nome,
          cargo: firestoreColab.cargo,
        });
        setIsSearching(false);
        return;
      }
    } catch (err) {
      console.warn('[AstroCheck] Erro na busca remota:', err);
    }

    // 2. Fallback para base local cadastrada
    const found = findColaboradorByMatricula(cleanMatricula);
    setSearchedColaborador(found || null);
    setIsSearching(false);
  };

  // Vincular biometria (Digital ou Facial) em dispositivos móveis
  const handleLinkBiometric = (type: 'fingerprint' | 'face') => {
    if (!searchedColaborador) return;

    const data: SavedBiometric = {
      type,
      matricula: searchedColaborador.matricula,
      nome: searchedColaborador.nome,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSavedBiometric(data);
      setBiometricFeedback(
        type === 'fingerprint'
          ? 'Digital vinculada a este aparelho!'
          : 'Facial vinculado a este aparelho!'
      );
    } catch {
      setBiometricFeedback('Erro ao salvar no dispositivo.');
    }
  };

  // Desvincular biometria
  const handleUnlinkBiometric = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedBiometric(null);
    setBiometricFeedback(null);
  };

  // Executar Acesso Rápido por Biometria / Facial
  const handleQuickScan = async (type: 'fingerprint' | 'face', targetMatricula: string) => {
    setIsScanning(type);

    try {
      const firestoreColab = await findColaboradorInFirestore(targetMatricula);
      if (firestoreColab) {
        setMatricula(firestoreColab.matricula);
        setSearchedColaborador({
          matricula: firestoreColab.matricula,
          nome: firestoreColab.nome,
          cargo: firestoreColab.cargo,
        });
        setHasSearched(true);
        setIsScanning(null);
        return;
      }
    } catch {
      // continua para o fallback
    }

    const found = findColaboradorByMatricula(targetMatricula);
    if (found) {
      setMatricula(found.matricula);
      setSearchedColaborador(found);
      setHasSearched(true);
    } else if (savedBiometric) {
      setMatricula(savedBiometric.matricula);
      setSearchedColaborador({
        matricula: savedBiometric.matricula,
        nome: savedBiometric.nome,
      });
      setHasSearched(true);
    }
    setIsScanning(null);
  };

  const handleProceed = () => {
    if (searchedColaborador) {
      onConfirm({
        matricula: searchedColaborador.matricula,
        nome: searchedColaborador.nome,
        cargo: searchedColaborador.cargo,
      });
    }
  };

  const isNotFound = hasSearched && !searchedColaborador && matricula.trim().length > 0;

  return (
    <div className="w-full bg-surface-container-lowest dark:bg-[#1E2029] rounded-2xl overflow-hidden flex flex-col relative transition-all duration-300 shadow-[0_4px_24px_rgba(32,59,139,0.12)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.5)] border-[3px] border-primary/20 dark:border-[#252836] p-4 sm:p-5 flex-1 min-h-0 max-h-[580px] justify-between">
      
      {/* Top Header com Mascote da Imagem 8 */}
      <div className="text-center shrink-0 flex flex-col items-center">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-1.5 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-2xl p-1.5">
          <img 
            src="/astronaut_cafe.webp" 
            alt="Mascote Astronauta AstroCheck" 
            className="w-full h-full object-contain drop-shadow"
          />
          <div className="absolute -bottom-1 -right-1 bg-[#0080ff] text-white p-1 rounded-full shadow-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[13px]">badge</span>
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-on-surface dark:text-[#f7fafc]">
          Identificação do Tripulante
        </h2>
        <p className="text-xs text-on-surface-variant dark:text-[#94a3b8] mt-0.5 max-w-sm">
          {isMobile 
            ? 'Informe sua matrícula de 8 dígitos ou use o acesso biométrico.' 
            : 'Informe sua matrícula funcional de 8 dígitos para iniciar.'}
        </p>
      </div>

      {/* Área Central: Acesso Rápido (Mobile) ou Campo de Matrícula */}
      <div className="my-auto py-1 flex flex-col items-center gap-3 max-w-sm w-full mx-auto">
        
        {/* Bloco de Acesso Rápido exclusivo para Dispositivos Móveis */}
        {isMobile && savedBiometric && !searchedColaborador && (
          <div className="w-full flex flex-col items-center gap-1.5 pb-1 animate-fadeIn">
            <button
              type="button"
              onClick={() => handleQuickScan(savedBiometric.type, savedBiometric.matricula)}
              className="w-full max-w-[260px] py-2.5 px-3 bg-gradient-to-r from-[#0080ff] to-[#0060df] hover:from-[#0070e0] hover:to-[#0050c8] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[20px]">
                {savedBiometric.type === 'face' ? 'face' : 'fingerprint'}
              </span>
              <span>Entrar com {savedBiometric.type === 'face' ? 'Facial' : 'Digital'}</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant dark:text-[#94a3b8]">
              <span>Tripulante: <strong>{savedBiometric.nome.split(' ')[0]}</strong></span>
              <span>&bull;</span>
              <button
                type="button"
                onClick={handleUnlinkBiometric}
                className="text-red-500 dark:text-red-400 hover:underline cursor-pointer"
                title="Desvincular biometria deste aparelho"
              >
                Desvincular
              </button>
            </div>

            <div className="w-full max-w-[260px] flex items-center gap-2 my-0.5">
              <div className="flex-1 h-px bg-outline-variant/40 dark:bg-[#2d3139]"></div>
              <span className="text-[10px] text-on-surface-variant dark:text-[#64748b] uppercase tracking-wider">ou digite</span>
              <div className="flex-1 h-px bg-outline-variant/40 dark:bg-[#2d3139]"></div>
            </div>
          </div>
        )}

        {/* Campo Matrícula em Cima com Botão Buscar Embaixo */}
        <div className="w-full flex flex-col items-center">
          <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-[#94a3b8] mb-1 text-center">
            Matrícula Funcional (8 Dígitos)
          </label>

          <form onSubmit={handleSearchOrSubmit} className="w-full flex flex-col items-center gap-2">
            {/* Input de 8 dígitos */}
            <div className="relative w-full max-w-[260px] flex items-center">
              <span className="absolute left-3 text-on-surface-variant dark:text-[#64748b] material-symbols-outlined text-[20px] pointer-events-none">
                pin
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={matricula}
                onChange={handleChangeMatricula}
                placeholder="00000000"
                autoFocus
                className="w-full pl-10 pr-9 py-2 bg-surface-container-low/60 dark:bg-[#15171e] text-on-surface dark:text-[#f7fafc] font-mono font-bold text-lg text-center tracking-[0.22em] rounded-xl border-2 border-outline-variant/60 dark:border-[#383d4a] focus:border-primary dark:focus:border-[#0080ff] focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
              />
              {matricula && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-1"
                  title="Limpar"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Botão Buscar */}
            <button
              type="submit"
              disabled={!matricula.trim() || isSearching}
              className="w-full max-w-[260px] py-2 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#0080ff] hover:bg-[#0070e0] active:bg-[#005fb8] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow"
            >
              {isSearching ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  <span>Buscar</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Área do Cartão Verde Reconhecido */}
        <div className="w-full max-w-[320px]">
          {searchedColaborador ? (
            <div className="w-full p-3.5 bg-[#dcfce7]/70 dark:bg-[#22c55e]/15 border-2 border-[#22c55e]/50 dark:border-[#22c55e]/40 rounded-xl flex flex-col items-center text-center transition-all animate-fadeIn shadow-xs">
              <div className="w-11 h-11 rounded-full bg-[#22c55e] text-white flex items-center justify-center mb-1 shadow-md">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div className="text-[10px] font-bold text-[#166534] dark:text-[#4ade80] uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                COLABORADOR IDENTIFICADO
              </div>
              <div className="text-sm sm:text-base font-black text-[#0f172a] dark:text-[#f7fafc] mt-0.5 max-w-full truncate px-2">
                {searchedColaborador.nome}
              </div>
              <div className="text-xs text-[#15803d] dark:text-[#86efac] font-semibold mt-0.5">
                Matrícula: <span className="tracking-wide font-mono">{searchedColaborador.matricula}</span>
              </div>

              {/* Seletor de Vinculação Biométrica / Facial (Apenas em Dispositivos Móveis) */}
              {isMobile && (
                <div className="mt-2.5 pt-2 border-t border-[#22c55e]/30 w-full flex flex-col items-center">
                  <span className="text-[10px] font-bold text-[#166534] dark:text-[#86efac] uppercase tracking-wider mb-1.5">
                    Vincular acesso neste aparelho:
                  </span>
                  <div className="flex gap-2 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => handleLinkBiometric('fingerprint')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
                        savedBiometric?.type === 'fingerprint' && savedBiometric.matricula === searchedColaborador.matricula
                          ? 'bg-[#16a34a] text-white'
                          : 'bg-white/80 dark:bg-[#15171e]/80 hover:bg-white dark:hover:bg-[#15171e] text-[#166534] dark:text-[#4ade80] border border-[#22c55e]/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                      <span>Digital</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLinkBiometric('face')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
                        savedBiometric?.type === 'face' && savedBiometric.matricula === searchedColaborador.matricula
                          ? 'bg-[#16a34a] text-white'
                          : 'bg-white/80 dark:bg-[#15171e]/80 hover:bg-white dark:hover:bg-[#15171e] text-[#166534] dark:text-[#4ade80] border border-[#22c55e]/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">face</span>
                      <span>Facial</span>
                    </button>
                  </div>
                  {biometricFeedback && (
                    <div className="text-[11px] font-bold text-[#15803d] dark:text-[#4ade80] animate-fadeIn flex items-center gap-1 mt-1.5">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      <span>{biometricFeedback}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isNotFound ? (
            <div className="w-full p-3 bg-red-50 dark:bg-[#ff5252]/10 border border-red-200 dark:border-[#ff5252]/30 rounded-xl flex items-center justify-center gap-2 text-red-700 dark:text-[#ff7b7b] text-xs font-medium animate-fadeIn text-center">
              <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0">error</span>
              <span>Matrícula não localizada no sistema.</span>
            </div>
          ) : null}
        </div>

      </div>

      {/* Botão de Ação / Iniciar Checklist */}
      <div className="shrink-0 pt-2 border-t border-outline-variant/30 dark:border-[#252836]">
        <button
          type="button"
          onClick={handleProceed}
          disabled={!searchedColaborador}
          className={`w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
            searchedColaborador
              ? 'bg-[#0080ff] hover:bg-[#0070e0] active:scale-98 text-white cursor-pointer hover:shadow-lg'
              : 'bg-gray-200 dark:bg-[#252836] text-gray-400 dark:text-gray-500 cursor-not-allowed border border-transparent'
          }`}
        >
          <span>Iniciar Checklist de Prontidão</span>
          <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
        </button>
      </div>

      {/* Modal / Overlay de Scanner Biométrico Animado (Mobile) */}
      {isScanning && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-white animate-fadeIn">
          <div className="relative w-20 h-20 rounded-full border-2 border-[#0080ff] flex items-center justify-center mb-4 animate-pulse">
            <span className="material-symbols-outlined text-[44px] text-[#0080ff] animate-bounce">
              {isScanning === 'face' ? 'face' : 'fingerprint'}
            </span>
          </div>
          <h3 className="text-base font-bold mb-1">
            {isScanning === 'face' ? 'Escaneando Rosto...' : 'Validando Digital...'}
          </h3>
          <p className="text-xs text-gray-300">Autenticando sensor seguro do dispositivo</p>
        </div>
      )}

    </div>
  );
};
