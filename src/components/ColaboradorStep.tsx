import React, { useState, useEffect } from 'react';
import { Colaborador, findColaboradorByMatricula } from '../config/colaboradores';
import { findColaboradorInFirestore, getCachedColaborador } from '../services/firebase';

interface ColaboradorStepProps {
  onConfirm: (colaborador: { matricula: string; nome: string; cargo?: string }) => void;
  initialData?: { matricula: string; nome: string; cargo?: string } | null;
}

interface SavedBiometric {
  matricula: string;
  nome: string;
}

const STORAGE_KEY = 'astrocheck_saved_biometric';
const CREDENTIAL_KEY = 'astrocheck_credential_id';

// Helpers para conversão de ArrayBuffer / Base64 para WebAuthn
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Verifica se o navegador tem suporte a biometria nativa de hardware do dispositivo
const isWebAuthnAvailable = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential || !navigator.credentials) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

// Registra a credencial no sensor biométrico nativo do aparelho
async function registerHardwareBiometric(matricula: string, nome: string): Promise<boolean | string> {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(Array.from(matricula).map((c) => c.charCodeAt(0)));
    const rpId = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'AstroCheck',
          id: rpId,
        },
        user: {
          id: userId,
          name: matricula,
          displayName: nome,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as (PublicKeyCredential & { rawId?: ArrayBuffer }) | null;

    if (credential && credential.rawId) {
      const b64 = arrayBufferToBase64(credential.rawId);
      localStorage.setItem(CREDENTIAL_KEY, b64);
      return true;
    }
    return Boolean(credential);
  } catch (err: any) {
    console.warn('[AstroCheck] Falha/cancelamento no cadastro biométrico:', err);
    // Retorna a string do erro para podermos debugar na tela
    return err instanceof Error ? `Erro: ${err.message}` : 'Erro desconhecido ao chamar sensor.';
  }
}

// Executa a leitura física do sensor biométrico do celular
async function verifyHardwareBiometric(): Promise<boolean | string> {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const rpId = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
    const credIdB64 = localStorage.getItem(CREDENTIAL_KEY);

    const allowCredentials = credIdB64
      ? [
          {
            id: base64ToArrayBuffer(credIdB64),
            type: 'public-key' as const,
            transports: ['internal' as AuthenticatorTransport],
          },
        ]
      : undefined;

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return Boolean(assertion);
  } catch (err: any) {
    console.warn('[AstroCheck] Leitura da digital cancelada ou incorreta:', err);
    return err instanceof Error ? `Erro: ${err.message}` : 'Erro desconhecido ao chamar sensor.';
  }
}

// Detecção de smartphone/tablet
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isMobileUA || (hasTouch && window.innerWidth <= 1024);
};

export const ColaboradorStep: React.FC<ColaboradorStepProps> = ({
  onConfirm,
  initialData,
}) => {
  const [isMobile] = useState<boolean>(() => isMobileDevice());

  // Recupera biometria salva localmente no aparelho
  const [savedBiometric, setSavedBiometric] = useState<SavedBiometric | null>(() => {
    if (!isMobileDevice()) return null;
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  // Se o usuário estiver voltando do checklist com um colaborador já preenchido (initialData),
  // inicia direto no Modo Manual preenchido para visualização/edição.
  // Caso contrário, se o aparelho tiver biometria salva, inicia no Modo Biométrico.
  const [mode, setMode] = useState<'biometric' | 'manual'>(() => {
    if (initialData?.matricula) {
      return 'manual';
    }
    if (isMobileDevice()) {
      try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (item) return 'biometric';
      } catch {
        // fallback
      }
    }
    return 'manual';
  });

  const [matricula, setMatricula] = useState(initialData?.matricula || '');
  const [searchedColaborador, setSearchedColaborador] = useState<Colaborador | null>(() => {
    if (!initialData) return null;
    return {
      matricula: initialData.matricula,
      nome: initialData.nome,
      cargo: initialData.cargo,
    };
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);

  // Sincronização reativa quando initialData mudar ou ao retornar de outros passos
  useEffect(() => {
    if (initialData?.matricula) {
      setMatricula(initialData.matricula);
      setSearchedColaborador({
        matricula: initialData.matricula,
        nome: initialData.nome,
        cargo: initialData.cargo,
      });
      setHasSearched(false);
      setBiometricFeedback(null);
      setMode('manual');
    }
  }, [initialData]);

  // BUGFIX/SEGURANÇA: se o app carrega no modo biométrico (porque há um
  // vínculo salvo neste aparelho) mas o navegador/aparelho não suporta
  // WebAuthn de verdade, não faz sentido mostrar a tela de "digital" — o
  // usuário ficaria preso nela sem conseguir entrar de forma segura. Nesse
  // caso volta automaticamente para o modo manual (matrícula).
  useEffect(() => {
    let cancelled = false;
    if (mode === 'biometric') {
      isWebAuthnAvailable().then(available => {
        if (!cancelled && !available) {
          setMode('manual');
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [mode]);

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
    setHasSearched(false);
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
        setHasSearched(true);
        setIsSearching(false);
        return;
      }
    } catch (err) {
      console.warn('[AstroCheck] Erro na busca remota:', err);
    }

    // 2. Fallback para base local cadastrada
    const found = findColaboradorByMatricula(cleanMatricula);
    setSearchedColaborador(found || null);
    setHasSearched(true);
    setIsSearching(false);
  };

  // Salvar/Vincular Digital no aparelho (aciona o sensor físico para cadastrar)
  const handleLinkBiometric = async () => {
    if (!searchedColaborador) return;

    setBiometricFeedback('Aguardando sensor do celular...');
    // Removido o isWebAuthnAvailable() aqui dentro do onClick porque o "await" nele
    // consome o user gesture token (transient user activation) no Android Chrome,
    // o que faz o navigator.credentials.create ser bloqueado logo em seguida.
    if (!window.PublicKeyCredential || !navigator.credentials) {
      setBiometricFeedback('Este aparelho não possui leitor biométrico compatível. Use a matrícula manualmente.');
      return;
    }

    const enrolled = await registerHardwareBiometric(
      searchedColaborador.matricula,
      searchedColaborador.nome
    );
    if (enrolled !== true) {
      setBiometricFeedback(typeof enrolled === 'string' ? enrolled : 'Cadastro biométrico cancelado no celular.');
      return;
    }

    const data: SavedBiometric = {
      matricula: searchedColaborador.matricula,
      nome: searchedColaborador.nome,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSavedBiometric(data);
      setMode('biometric');
      setBiometricFeedback(null);
    } catch {
      setBiometricFeedback('Erro ao salvar no dispositivo.');
    }
  };

  // Desvincular biometria deste aparelho
  const handleUnlinkBiometric = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CREDENTIAL_KEY);
    setSavedBiometric(null);
    setBiometricFeedback(null);
    setMode('manual');
    handleClear();
  };

  // Executar Acesso com Digital (Exige autenticação física do sensor do celular sem alterar texto nem piscar)
  const handleQuickScan = async () => {
    if (!savedBiometric) return;
    setBiometricFeedback(null);

    if (!window.PublicKeyCredential || !navigator.credentials) {
      setBiometricFeedback('Este aparelho não suporta verificação biométrica. Identifique-se pela matrícula.');
      return;
    }

    const hasCredId = Boolean(localStorage.getItem(CREDENTIAL_KEY));
    const authOk = hasCredId
      // Aciona o sensor físico de impressão digital do celular
      ? await verifyHardwareBiometric()
      // Se ainda não tinha credencial salva, cadastra o sensor agora
      : await registerHardwareBiometric(savedBiometric.matricula, savedBiometric.nome);

    if (authOk !== true) {
      setBiometricFeedback(typeof authOk === 'string' ? authOk : '⚠️ Autenticação biométrica não concluída.');
      return;
    }

    // Sucesso na digital: vibração de confirmação
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch {
        // ignora
      }
    }

    let resolvedColab: { matricula: string; nome: string; cargo?: string } | null = null;

    // BUGFIX/PERFORMANCE: antes, todo toque no acesso rápido disparava uma
    // busca completa no Firestore (até ~9 coleções, dezenas de leituras),
    // só pra reconfirmar dados que já estavam salvos no aparelho — o
    // oposto do "0 leituras" que o próprio cache foi feito pra garantir.
    // Agora usamos primeiro o cache local (0 leituras) e a base local; só
    // caem para os dados mínimos já salvos no vínculo biométrico se nada
    // disso tiver a pessoa.
    const cachedColab = getCachedColaborador(savedBiometric.matricula);
    if (cachedColab) {
      resolvedColab = {
        matricula: cachedColab.matricula,
        nome: cachedColab.nome,
        cargo: cachedColab.cargo,
      };
    } else {
      const found = findColaboradorByMatricula(savedBiometric.matricula);
      if (found) {
        resolvedColab = {
          matricula: found.matricula,
          nome: found.nome,
          cargo: found.cargo,
        };
      } else {
        resolvedColab = {
          matricula: savedBiometric.matricula,
          nome: savedBiometric.nome,
        };
      }
    }

    if (resolvedColab) {
      // Avança direto para a primeira pergunta do checklist!
      onConfirm(resolvedColab);
    }
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

  const isNotFound = hasSearched && !isSearching && !searchedColaborador && matricula.trim().length > 0;

  return (
    <div className="w-full bg-surface-container-lowest dark:bg-[#1E2029] rounded-2xl flex flex-col relative transition-colors duration-300 shadow-[0_4px_24px_rgba(32,59,139,0.12)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.5)] border-[3px] border-primary/20 dark:border-[#252836] p-3 sm:p-5 flex-1 min-h-0 max-h-[580px] overflow-hidden justify-between">
      
      {/* Área Rolável Interna para evitar qualquer corte de conteúdo */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col justify-start sm:justify-center py-0.5 sm:py-1 px-1">
        
        {/* Top Header com Mascote */}
        <div className="text-center shrink-0 flex flex-col items-center mb-1 sm:mb-2">
          <div className="relative w-11 h-11 sm:w-14 sm:h-14 mb-1 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-2xl p-1">
            <img 
              src="/astronaut_cafe.webp" 
              alt="Mascote Astronauta AstroCheck" 
              className="w-full h-full object-contain drop-shadow"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#0080ff] text-white p-0.5 sm:p-1 rounded-full shadow-md flex items-center justify-center">
              <span className="material-symbols-outlined text-[11px] sm:text-[13px]">
                {mode === 'biometric' ? 'fingerprint' : 'badge'}
              </span>
            </div>
          </div>

          <h2 className="text-sm sm:text-base font-bold text-on-surface dark:text-[#f7fafc]">
            {mode === 'biometric' ? 'Acesso por Biometria' : 'Identificação do Tripulante'}
          </h2>
          <p className="text-[11px] sm:text-xs text-on-surface-variant dark:text-[#94a3b8] mt-0.5 max-w-sm">
            {mode === 'biometric'
              ? 'Toque abaixo e valide com a biometria do celular (digital, facial ou a que estiver configurada).'
              : isMobile 
                ? 'Informe sua matrícula funcional para iniciar.' 
                : 'Informe sua matrícula funcional para iniciar.'}
          </p>
        </div>

        {/* ÁREA CENTRAL: MODO BIOMÉTRICO (DIGITAL, FACIAL OU OUTRA CONFIGURADA NO APARELHO) */}
        {mode === 'biometric' && savedBiometric ? (
          <div className="my-auto py-1 sm:py-2 flex flex-col items-center gap-2.5 sm:gap-3.5 max-w-sm w-full mx-auto animate-fadeIn">
            {/* Botão de Destaque para Biometria: 100% Estático, Firme e sem Piscar */}
            <button
              type="button"
              onClick={handleQuickScan}
              className="w-full max-w-[270px] py-3 sm:py-4 px-4 bg-gradient-to-br from-[#0080ff] to-[#0055cc] hover:from-[#0070e0] hover:to-[#0048b0] text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl transition-transform active:scale-98 cursor-pointer"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[28px] sm:text-[36px]">
                  fingerprint
                </span>
              </div>
              <span className="text-xs sm:text-sm md:text-base font-extrabold tracking-wide">
                Toque para Entrar com Biometria
              </span>
            </button>

            {/* Card do Tripulante Ativo */}
            <div className="w-full max-w-[270px] p-2 sm:p-2.5 bg-surface-container-low/60 dark:bg-[#15171e] rounded-xl border border-outline-variant/40 dark:border-[#2d3139] text-center">
              <div className="text-[10px] sm:text-[11px] text-on-surface-variant dark:text-[#94a3b8] font-medium">
                Tripulante: <strong className="text-on-surface dark:text-[#f7fafc]">{savedBiometric.nome}</strong>
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono font-bold text-[#0080ff] mt-0.5">
                Matrícula: {savedBiometric.matricula}
              </div>
            </div>

            {/* Feedback de erro/cancelamento */}
            {biometricFeedback && (
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 animate-fadeIn text-center px-2">
                {biometricFeedback}
              </div>
            )}

            {/* Links de Ação Secundária */}
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode('manual');
                  if (!initialData && !matricula) {
                    handleClear();
                  }
                }}
                className="text-xs font-semibold text-[#0080ff] dark:text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>Digitar outra matrícula</span>
              </button>

              <button
                type="button"
                onClick={handleUnlinkBiometric}
                className="text-[10px] sm:text-[11px] text-red-500/80 hover:text-red-600 dark:text-red-400/80 hover:underline cursor-pointer"
                title="Desvincular biometria deste aparelho"
              >
                Desvincular biometria deste aparelho
              </button>
            </div>
          </div>
        ) : (
          /* ÁREA CENTRAL: MODO MANUAL (DIGITAÇÃO DE MATRÍCULA) */
          <div className="my-auto py-0.5 sm:py-1 flex flex-col items-center gap-2 sm:gap-2.5 max-w-sm w-full mx-auto animate-fadeIn">

            {/* Campo Matrícula em Cima com Botão Buscar Embaixo */}
            <div className="w-full flex flex-col items-center">
              <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-[#94a3b8] mb-1 text-center">
                Matrícula
              </label>

              <form onSubmit={handleSearchOrSubmit} className="w-full flex flex-col items-center gap-1.5 sm:gap-2">
                {/* Input de 8 dígitos */}
                <div className="relative w-full max-w-[260px] flex items-center">
                  <span className="absolute left-3 text-on-surface-variant dark:text-[#64748b] material-symbols-outlined text-[18px] sm:text-[20px] pointer-events-none">
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
                    className="w-full pl-9 pr-9 py-1.5 sm:py-2 bg-surface-container-low/60 dark:bg-[#15171e] text-on-surface dark:text-[#f7fafc] font-mono font-bold text-base sm:text-lg text-center tracking-[0.22em] rounded-xl border-2 border-outline-variant/60 dark:border-[#383d4a] focus:border-primary dark:focus:border-[#0080ff] focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
                  />
                  {matricula && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-1"
                      title="Limpar"
                    >
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">close</span>
                    </button>
                  )}
                </div>

                {/* Botão Buscar */}
                <button
                  type="submit"
                  disabled={!matricula.trim() || isSearching}
                  className="w-full max-w-[260px] py-1.5 sm:py-2 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#0080ff] hover:bg-[#0070e0] active:bg-[#005fb8] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  {isSearching ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">search</span>
                      <span>Buscar</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Área do Cartão Verde Reconhecido */}
            <div className="w-full max-w-[300px]">
              {searchedColaborador ? (
                <div className="w-full p-2.5 sm:p-3 bg-[#dcfce7]/70 dark:bg-[#22c55e]/15 border-2 border-[#22c55e]/50 dark:border-[#22c55e]/40 rounded-xl flex flex-col items-center text-center transition-all animate-fadeIn shadow-xs">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#22c55e] text-white flex items-center justify-center mb-0.5 shadow-md">
                    <span className="material-symbols-outlined text-[20px] sm:text-[22px]">verified_user</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#166534] dark:text-[#4ade80] uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[12px] sm:text-[13px]">check_circle</span>
                    COLABORADOR IDENTIFICADO
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-black text-[#0f172a] dark:text-[#f7fafc] mt-0.5 max-w-full truncate px-2">
                    {searchedColaborador.nome}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#15803d] dark:text-[#86efac] font-semibold mt-0.5">
                    Matrícula: <span className="tracking-wide font-mono">{searchedColaborador.matricula}</span>
                  </div>

                  {/* Opção de Salvar Biometria no Aparelho (Apenas Mobile se ainda não salva) */}
                  {isMobile && !savedBiometric && (
                    <div className="mt-2 pt-1.5 border-t border-[#22c55e]/30 w-full flex flex-col items-center">
                      <button
                        type="button"
                        onClick={handleLinkBiometric}
                        className="w-full py-1 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[14px]">fingerprint</span>
                        <span>Salvar Biometria neste Aparelho</span>
                      </button>
                    </div>
                  )}
                  {biometricFeedback && (
                    <div className="text-[10px] sm:text-[11px] font-bold text-[#15803d] dark:text-[#4ade80] animate-fadeIn flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[13px]">check</span>
                      <span>{biometricFeedback}</span>
                    </div>
                  )}
                </div>
              ) : isNotFound ? (
                <div className="w-full p-2.5 sm:p-3 bg-red-50 dark:bg-[#ff5252]/10 border border-red-200 dark:border-[#ff5252]/30 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-red-700 dark:text-[#ff7b7b] text-xs font-medium animate-fadeIn text-center">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-red-500 shrink-0">error</span>
                  <span>Matrícula não localizada no sistema.</span>
                </div>
              ) : null}
            </div>

          </div>
        )}

      </div>

      {/* Botão de Ação / Iniciar Checklist (Sempre ancorado na base, sem cortes) */}
      {mode === 'manual' && (
        <div className="shrink-0 pt-2 sm:pt-2.5 border-t border-outline-variant/30 dark:border-[#252836] flex justify-center w-full mt-1">
          <button
            type="button"
            onClick={handleProceed}
            disabled={!searchedColaborador}
            className={`w-full max-w-[260px] py-2 sm:py-2.5 md:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
              searchedColaborador
                ? 'bg-[#0080ff] hover:bg-[#0070e0] active:scale-98 text-white cursor-pointer hover:shadow-lg ring-2 ring-[#0080ff]/30'
                : 'bg-gray-200 dark:bg-[#252836] text-gray-400 dark:text-gray-500 cursor-not-allowed border border-transparent'
            }`}
          >
            <span>Iniciar Checklist</span>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">rocket_launch</span>
          </button>
        </div>
      )}

    </div>
  );
};

