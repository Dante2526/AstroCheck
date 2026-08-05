/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { BB8Toggle } from './components/BB8Toggle';
import { TurmaSelectionStep } from './components/TurmaSelectionStep';
import { TurmaKey, TURMAS } from './config/turmas';
import { sendReadinessEmail, ReadinessAnswerItem, ReadinessReportData } from './services/emailService';

const LocomotiveSide = React.memo(({ size = 32 }: { size?: number }) => {
  const width = size * 1.5; // Torna a locomotiva 50% mais larga proporcionalmente à altura
  return (
    <div className="animate-train-bounce relative flex items-center justify-center">
      {/* Fumaça animada saindo da chaminé à direita, flutuando para cima */}
      <div className="absolute -top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-[#0080ff]/50 dark:bg-[#0080ff]/60 animate-smoke-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute -top-2 right-3.5 w-2 h-2 rounded-full bg-[#0080ff]/40 dark:bg-[#0080ff]/50 animate-smoke-float" style={{ animationDelay: '0.4s' }}></div>
      <div className="absolute -top-3 right-4.5 w-2.5 h-2.5 rounded-full bg-[#0080ff]/25 dark:bg-[#0080ff]/35 animate-smoke-float" style={{ animationDelay: '0.8s' }}></div>
      
      <svg 
        width={width} 
        height={size} 
        viewBox="0 0 36 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="drop-shadow-sm"
      >
        {/* Linha da base do trem */}
        <path d="M4 17h28" />
        
        {/* Cabine (atrás / esquerda) */}
        <path d="M5 17V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v10" />
        
        {/* Caldeira frontal (frente / direita) estendida */}
        <path d="M15 17V9a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v8" />
        
        {/* Bico frontal / limpa-trilhos */}
        <path d="M30 17l2 2v-2z" fill="currentColor" />
        
        {/* Chaminé na frente (direita) */}
        <path d="M27 8V5h2v3" />
        
        {/* Janela na cabine (esquerda) */}
        <rect x="7" y="8" width="5" height="4" rx="1" />
        
        {/* 4 Rodas bem distribuídas */}
        <circle cx="8" cy="18" r="2" fill="currentColor" />
        <circle cx="15" cy="18" r="2" fill="currentColor" />
        <circle cx="22" cy="18" r="2" fill="currentColor" />
        <circle cx="29" cy="18" r="2" fill="currentColor" />
      </svg>
    </div>
  );
});

export function getMealQuestionText(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) {
    return 'Na manhã de hoje, tomou café-da-manhã antes de suas atividades?';
  } else if (hour >= 12 && hour < 18) {
    return 'Na tarde de hoje, almoçou antes de suas atividades?';
  } else {
    return 'Na noite de hoje, jantou antes de suas atividades?';
  }
}

export const getQuestions = (date: Date = new Date()) => [
  {
    id: 1,
    image: '/file_00000000a8e0820e832a44b93c4504aa.webp',
    imageAlt: 'Mascote astronauta dormindo abraçado a uma lua crescente',
    text: 'Sentiu-se bem na véspera da jornada? O sono foi tranquilo? Está sem preocupações que interferem em sua concentração?',
    safeAnswer: 'yes' as const,
  },
  {
    id: 2,
    image: '/file_0000000059b0820e9a6113802390edd4.webp',
    imageAlt: 'Mascote astronauta em pose de saúde segurando um termômetro e um coração.',
    text: 'Você ou alguém de sua família tem passado por algum problema de saúde que está trazendo preocupações, gerando ansiedade e tristezas?',
    safeAnswer: 'no' as const,
  },
  {
    id: 3,
    image: '/100000. de 2026, 16_27_57.webp',
    imageAlt: 'Mascote astronauta no ambiente de trabalho',
    text: 'Tem algum desconforto no ambiente de trabalho que pode estar deixando você insatisfeito angustiado ou sem concentração?',
    safeAnswer: 'no' as const,
  },
  {
    id: 4,
    image: '/astronaut_confortavel.webp',
    imageAlt: 'Mascote astronauta fazendo sinal de positivo (joinha) demonstrando conforto e confiança com o Teste de Prontidão',
    text: 'Sente-se confortável para realizar o Teste de Prontidão (conhece o teste, realiza sem pressões, acredita na ferramenta e tem clareza que não existe punições para casos de desvios)?',
    safeAnswer: 'yes' as const,
  },
  {
    id: 5,
    image: '/ljjj1000215839-Photoroom.webp',
    imageAlt: 'Mascote astronauta com medicamento',
    text: 'Tem utilizado algum medicamento que pode ter alterando seu estado de consciência, foco e concentração?',
    safeAnswer: 'no' as const,
  },
  {
    id: 6,
    image: '/astronaut_cansaco.webp',
    imageAlt: 'Mascote astronauta sonolento e cansado sentado ao lado do despertador com pensamentos de noite e sono',
    text: 'Sente-se deprimido, sem vontade de acordar para o trabalho, excesso de cansaço e sonolência?',
    safeAnswer: 'no' as const,
  },
  {
    id: 7,
    image: '/astronaut_estresse.webp',
    imageAlt: 'Mascote astronauta tenso e preocupado com a mão no capacete expressando sobrecarga da rotina',
    text: 'Tem se sentido aborrecido, tenso, nervoso com problema da rotina (desgastes com colegas, problemas financeiros, prazos, relacionamentos complexos com clientes e interfaces)?',
    safeAnswer: 'no' as const,
  },
  {
    id: 8,
    image: '/astronaut_cafe.webp',
    imageAlt: 'Mascote astronauta tomando bebida quente na caneca personalizada da Vale antes das atividades',
    text: getMealQuestionText(date),
    safeAnswer: 'yes' as const,
  },
  {
    id: 9,
    image: '/astronaut_apto.webp',
    imageAlt: 'Mascote astronauta confiante em pose de prontidão e segurança',
    text: 'Acredita que tem condições de atuar em sua atividade no dia de hoje sem prejuízos para você e seus pares?',
    safeAnswer: 'yes' as const,
  }
];

export default function App() {
  const questions = useMemo(() => getQuestions(), []);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTurmaStep, setIsTurmaStep] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<TurmaKey | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailSuccess, setIsEmailSuccess] = useState(false);

  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no' | null>>({
    1: 'yes',
    2: 'no',
    3: 'no',
    4: 'yes',
    5: 'no',
    6: 'no',
    7: 'no',
    8: 'yes',
    9: 'yes',
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('astrocheck_theme') || localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const themeVal = isDarkMode ? 'dark' : 'light';
    try {
      localStorage.setItem('astrocheck_theme', themeVal);
      localStorage.setItem('theme', themeVal);
    } catch (e) {
      console.warn('[AstroCheck] Erro ao persistir tema:', e);
    }

    if (isDarkMode) {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#111217';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f8f9fa';
    }
  }, [isDarkMode]);

  // Pré-carregamento em background de todas as ilustrações WebP para transições ultra-rápidas (0ms)
  useEffect(() => {
    const imagesToPreload = [
      ...questions.map(q => q.image),
      '/100000. de 2026, 16_27_57.webp',
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [questions]);

  const question = questions[currentStep - 1];
  const selectedAnswer = answers[question?.id];

  // Cálculo de riscos e respostas compiladas
  const { totalRisks, readinessAnswers } = useMemo(() => {
    let risks = 0;
    const compiled: ReadinessAnswerItem[] = questions.map(q => {
      const ans = answers[q.id];
      const isRisk = ans !== null && ans !== q.safeAnswer;
      if (isRisk) risks += 1;
      return {
        questionId: q.id,
        questionText: q.text,
        answer: ans,
        safeAnswer: q.safeAnswer,
        isRisk,
      };
    });
    return { totalRisks: risks, readinessAnswers: compiled };
  }, [answers]);

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === questions.length) {
      setIsTurmaStep(true);
    }
  };

  const handlePrev = () => {
    if (isTurmaStep) {
      setIsTurmaStep(false);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswer = (answer: 'yes' | 'no') => {
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
  };

  const handleSelectTurma = (turma: TurmaKey) => {
    setSelectedTurma(turma);
  };

  const handleSendReport = async () => {
    if (!selectedTurma || isSendingEmail) return;

    setIsSendingEmail(true);

    const reportData: ReadinessReportData = {
      turma: selectedTurma,
      answers: readinessAnswers,
      totalRisks,
      timestamp: new Date().toISOString(),
    };

    const result = await sendReadinessEmail(reportData);
    setIsSendingEmail(false);

    if (result.success) {
      setIsEmailSuccess(true);
    } else {
      alert(`Aviso: ${result.message}`);
    }
  };

  const handleResetAll = () => {
    setAnswers({
      1: 'yes',
      2: 'no',
      3: 'no',
      4: 'yes',
      5: 'no',
      6: 'no',
      7: 'no',
      8: 'yes',
      9: 'yes',
    });
    setCurrentStep(1);
    setIsTurmaStep(false);
    setSelectedTurma(null);
    setIsEmailSuccess(false);
    setIsSendingEmail(false);
  };

  const handleToggleDarkMode = useCallback((e?: any) => {
    if (!('startViewTransition' in document)) {
      setIsDarkMode(prev => !prev);
      return;
    }

    const isSwitchingToDark = !isDarkMode;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (e && e.nativeEvent && typeof e.nativeEvent.clientX === 'number' && e.nativeEvent.clientX > 0) {
      x = e.nativeEvent.clientX;
      y = e.nativeEvent.clientY;
    } else if (e && e.target instanceof Element) {
      const targetEl = e.target.closest('.bb8-toggle') || e.target;
      const rect = targetEl.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else {
      const toggleEl = document.querySelector('.bb8-toggle');
      if (toggleEl) {
        const rect = toggleEl.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.style.setProperty('--toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--toggle-y', `${y}px`);
    document.documentElement.style.setProperty('--toggle-r', `${endRadius}px`);

    const transitionClass = isSwitchingToDark ? 'dark-transition' : 'light-transition';
    document.documentElement.classList.add(transitionClass);

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        setIsDarkMode(prev => !prev);
      });
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove(transitionClass);
      document.documentElement.style.removeProperty('--toggle-x');
      document.documentElement.style.removeProperty('--toggle-y');
      document.documentElement.style.removeProperty('--toggle-r');
    });
  }, [isDarkMode]);

  const isSafeSelected = selectedAnswer === question?.safeAnswer;
  const isDangerSelected = selectedAnswer !== null && selectedAnswer !== question?.safeAnswer;
  
  let cardBorderClass = 'border-transparent dark:border-[#2d3139]';
  if (isSafeSelected) {
    cardBorderClass = 'border-[#22c55e] dark:border-[#22c55e]';
  } else if (isDangerSelected) {
    cardBorderClass = 'border-error dark:border-[#ff5252]';
  }

  const isYesSafe = question?.safeAnswer === 'yes';
  
  // Percentual da ferrovia: se estiver na etapa de turma, avança para 100%
  const progressPercent = isTurmaStep ? 100 : ((currentStep - 1) / (questions.length - 1)) * 100;

  return (
    <div className="bg-surface-tint-light dark:bg-[#111217] h-dvh max-h-dvh flex flex-col font-body-md text-on-surface dark:text-[#f7fafc] overflow-hidden select-none transition-colors duration-300">
      {/* TopAppBar */}
      <header className="bg-surface dark:bg-[#15171E] border-b border-transparent dark:border-[#252836] shadow-sm shrink-0 z-40 transition-colors duration-300">
        <div className="relative flex justify-between items-center px-4 pt-2.5 pb-1 sm:pt-3 sm:pb-1.5 w-full max-w-2xl mx-auto min-h-[48px] sm:min-h-[52px]">
          {/* Espaço reservado para manter o balanceamento do flex */}
          <div className="flex items-center z-10 w-8 sm:w-10">
          </div>
          
          {/* Título AstroCheck + Escudo + Passo (100% Centralizado matematicamente) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
            <h1 className="text-base sm:text-lg font-bold text-primary dark:text-[#f7fafc] flex items-center justify-center gap-1.5 px-2 transition-colors duration-300">
              <span>AstroCheck</span>
              
              {/* Selo / Escudo de Verificação Verde */}
              <span className="inline-flex items-center justify-center transition-transform duration-300 hover:scale-115 cursor-pointer" title="Verificado AstroCheck">
                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] drop-shadow-[0_2px_6px_rgba(34,197,94,0.45)]" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="astroShieldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#16a34a" />
                      <stop offset="100%" stopColor="#15803d" />
                    </linearGradient>
                    <linearGradient id="astroShieldShine" x1="12" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Shield Body */}
                  <path 
                    d="M12 2L4 5.5V11.5C4 16.5 7.4 21.2 12 22.5C16.6 21.2 20 16.5 20 11.5V5.5L12 2Z" 
                    fill="url(#astroShieldGrad)" 
                  />
                  {/* Shield Glass Highlight */}
                  <path 
                    d="M12 2L4 5.5V11.5C4 16.5 7.4 21.2 12 22.5C16.6 21.2 20 16.5 20 11.5V5.5L12 2Z" 
                    fill="url(#astroShieldShine)" 
                  />
                  {/* Inner subtle border */}
                  <path 
                    d="M12 3.2L5.2 6.2V11.5C5.2 15.8 8.1 19.9 12 21.1C15.9 19.9 18.8 15.8 18.8 11.5V6.2L12 3.2Z" 
                    stroke="rgba(255,255,255,0.35)" 
                    strokeWidth="0.8" 
                  />
                  {/* Checkmark */}
                  <path 
                    d="M8.2 11.8L10.8 14.4L15.8 9.4" 
                    stroke="#ffffff" 
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
              </span>
            </h1>
            <span className="text-[11px] sm:text-xs text-on-surface-variant dark:text-[#a0aec0] font-medium transition-colors duration-300 block">
              {isTurmaStep ? (
                <span className="text-[#ff6b00] dark:text-[#ff7a00] font-bold">Etapa Final &bull; Seleção de Turma</span>
              ) : (
                `Passo ${currentStep} de ${questions.length}`
              )}
            </span>
          </div>

          {/* Ações da Direita */}
          <div className="flex items-center z-10">
            {/* BB-8 Dark Mode Interactive Toggle with Circular View Transition */}
            <BB8Toggle 
              isDarkMode={isDarkMode} 
              onToggle={handleToggleDarkMode} 
              size={8}
            />
          </div>
        </div>

        {/* Railway Progress Bar with Locomotive & Clean Transparent Milestones */}
        <div className="w-full max-w-2xl mx-auto px-5 pb-2.5 pt-4 sm:pt-5 relative">
          <div className="relative w-full h-1.5 sm:h-2 bg-surface-container-highest/70 dark:bg-[#252836] rounded-full">
            {/* Fill Progress Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-[#0080ff] dark:bg-[#0080ff] rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercent}%` }}
            />

            {/* 9 Clean Transparent Milestone Dots (Marcos) */}
            <div className="absolute inset-0 pointer-events-none">
              {questions.map((q, idx) => {
                const isPassed = isTurmaStep || currentStep > idx + 1;
                const isCurrent = !isTurmaStep && currentStep === idx + 1;
                const dotPercent = (idx / (questions.length - 1)) * 100;
                return (
                  <div 
                    key={q.id} 
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border transition-all duration-300 ${
                      isCurrent
                        ? 'bg-[#0080ff] border-white dark:border-[#15171E] scale-125 shadow-xs z-10'
                        : isPassed
                          ? 'bg-[#0080ff] border-transparent scale-90'
                          : 'bg-black/10 dark:bg-white/10 border-black/15 dark:border-white/20 backdrop-blur-xs'
                    }`}
                    style={{ left: `${dotPercent}%` }}
                  />
                );
              })}
            </div>

            {/* Locomotive advancing smoothly */}
            <div 
              className="absolute -top-[34px] sm:-top-[34px] -translate-x-1/2 transition-all duration-500 ease-out text-[#0080ff] z-20 pointer-events-none drop-shadow-md"
              style={{ left: `${progressPercent}%` }}
            >
              <LocomotiveSide size={32} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col justify-center items-center px-3 sm:px-6 py-2 sm:py-3.5 w-full max-w-xl mx-auto">
        {isTurmaStep ? (
          /* Etapa de Seleção de Turma e Envio */
          <TurmaSelectionStep
            selectedTurma={selectedTurma}
            onSelectTurma={handleSelectTurma}
            onSend={handleSendReport}
            onBack={handlePrev}
            isSending={isSendingEmail}
            isSuccess={isEmailSuccess}
            onReset={handleResetAll}
            totalRisks={totalRisks}
            isDarkMode={isDarkMode}
          />
        ) : (
          /* Readiness Card com Pergunta */
          <>
            <div className={`w-full bg-surface-container-lowest dark:bg-[#1E2029] rounded-2xl overflow-hidden flex flex-col relative transition-all duration-300 shadow-[0_4px_20px_rgba(32,59,139,0.10)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-[3px] sm:border-[4px] ${cardBorderClass} p-3 sm:p-5 flex-1 min-h-0 max-h-[500px] sm:max-h-[560px] justify-between`}>
              
              {/* Image Illustration */}
              <div className="flex-1 min-h-[120px] sm:min-h-[170px] max-h-[180px] sm:max-h-[220px] flex justify-center items-center py-1 sm:py-2 bg-surface-container-low/40 dark:bg-[#171922]/60 rounded-xl transition-colors duration-300">
                <img 
                  alt={question.imageAlt} 
                  className="h-full max-h-[140px] sm:max-h-[195px] w-auto object-contain transition-transform duration-300 hover:scale-105" 
                  src={question.image} 
                  style={{ filter: isDarkMode ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
                />
              </div>

              {/* Question Text */}
              <div className="my-1.5 sm:my-2.5 text-center px-1 sm:px-2 flex flex-col items-center justify-center">
                <h2 className={`font-semibold text-on-surface dark:text-[#f7fafc] min-h-[44px] sm:min-h-[52px] flex items-center justify-center transition-colors duration-300 ${
                  question.text.length > 110 
                    ? 'text-[12px] sm:text-[14px] md:text-[15px] leading-snug sm:leading-normal max-w-lg' 
                    : 'text-xs sm:text-base leading-snug'
                }`}>
                  {question.text}
                </h2>
              </div>

              {/* Action Buttons (Sim / Não) */}
              <div className="flex w-full gap-2.5 sm:gap-4 shrink-0 pt-1">
                {/* Sim Button */}
                <button
                  onClick={() => handleAnswer('yes')}
                  className={`flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden active:scale-98 cursor-pointer ${
                    selectedAnswer === 'yes'
                      ? isYesSafe
                        ? 'bg-[#22c55e]/15 dark:bg-[#22c55e]/20 border-[#22c55e] dark:border-[#22c55e] text-[#15803d] dark:text-[#4ade80] font-bold shadow-sm'
                        : 'border-error dark:border-[#ff5252] bg-error-container dark:bg-[#ff5252]/20 text-on-error-container dark:text-[#ff7b7b] font-bold shadow-sm'
                      : isYesSafe
                        ? 'border-outline-variant dark:border-[#383d4a] text-on-surface dark:text-[#f7fafc] hover:bg-[#22c55e]/10 dark:hover:bg-[#22c55e]/10 hover:border-[#22c55e]/60 font-medium'
                        : 'border-outline-variant dark:border-[#383d4a] text-on-surface dark:text-[#f7fafc] hover:bg-error-container/40 dark:hover:bg-[#ff5252]/15 hover:text-on-error-container dark:hover:text-[#ff7b7b] hover:border-error/60 dark:hover:border-[#ff5252] font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]" style={{ fontVariationSettings: selectedAnswer === 'yes' ? "'FILL' 1" : "'FILL' 0" }}>
                    {isYesSafe ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-sm sm:text-base">Sim</span>
                </button>

                {/* Não Button */}
                <button
                  onClick={() => handleAnswer('no')}
                  className={`flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden active:scale-98 cursor-pointer ${
                    selectedAnswer === 'no'
                      ? !isYesSafe
                        ? 'bg-[#22c55e]/15 dark:bg-[#22c55e]/20 border-[#22c55e] dark:border-[#22c55e] text-[#15803d] dark:text-[#4ade80] font-bold shadow-sm'
                        : 'border-error dark:border-[#ff5252] bg-error-container dark:bg-[#ff5252]/20 text-on-error-container dark:text-[#ff7b7b] font-bold shadow-sm'
                      : !isYesSafe
                        ? 'border-outline-variant dark:border-[#383d4a] text-on-surface dark:text-[#f7fafc] hover:bg-[#22c55e]/10 dark:hover:bg-[#22c55e]/10 hover:border-[#22c55e]/60 font-medium'
                        : 'border-outline-variant dark:border-[#383d4a] text-on-surface dark:text-[#f7fafc] hover:bg-error-container/40 dark:hover:bg-[#ff5252]/15 hover:text-on-error-container dark:hover:text-[#ff7b7b] hover:border-error/60 dark:hover:border-[#ff5252] font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]" style={{ fontVariationSettings: selectedAnswer === 'no' ? "'FILL' 1" : "'FILL' 0" }}>
                    {!isYesSafe ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-sm sm:text-base">Não</span>
                </button>
              </div>
            </div>

            {/* Navigation Controls (Anterior / Avançar) */}
            <div className="w-full flex justify-between items-center mt-2.5 sm:mt-4 shrink-0 px-1">
              <button 
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="bg-[#0080ff] hover:bg-[#0066cc] active:bg-[#004fa3] dark:bg-[#0080ff] dark:hover:bg-[#0066cc] text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-5 sm:px-7 rounded-full shadow-sm hover:shadow transition-all duration-200 active:scale-95 flex items-center gap-1.5 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_back</span>
                <span>Anterior</span>
              </button>

              <button 
                onClick={handleNext} 
                className="bg-[#ff6b00] hover:bg-[#ea580c] active:bg-[#c2410c] dark:bg-[#ff7a00] dark:hover:bg-[#ea580c] text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-5 sm:px-7 rounded-full shadow-sm hover:shadow transition-all duration-200 active:scale-95 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{currentStep === questions.length ? 'Finalizar' : 'Avançar'}</span>
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
