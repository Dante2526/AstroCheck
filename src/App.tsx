/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

const questions = [
  {
    id: 1,
    image: '/file_00000000a8e0820e832a44b93c4504aa.png',
    imageAlt: 'Mascote astronauta dormindo abraçado a uma lua crescente',
    text: 'Sentiu-se bem na véspera da jornada? O sono foi tranquilo? Está sem preocupações que interferem em sua concentração?',
    safeAnswer: 'yes',
  },
  {
    id: 2,
    image: '/file_0000000059b0820e9a6113802390edd4.png',
    imageAlt: 'Mascote astronauta em pose de saúde segurando um termômetro e um coração.',
    text: 'Você ou alguém de sua família tem passado por algum problema de saúde que está trazendo preocupações, gerando ansiedade e tristezas?',
    safeAnswer: 'no',
  },
  {
    id: 3,
    image: '/100000. de 2026, 16_27_57.png',
    imageAlt: 'Mascote astronauta',
    text: 'Tem algum desconforto no ambiente de trabalho que pode estar deixando você insatisfeito angustiado ou sem concentração?',
    safeAnswer: 'no',
  },
  {
    id: 4,
    image: '/ljjj1000215839-Photoroom.png',
    imageAlt: 'Mascote astronauta com medicamento',
    text: 'Tem utilizado algum medicamento que pode ter alterando seu estado de consciência, foco e concentração?',
    safeAnswer: 'no',
  }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no' | null>>({
    1: 'yes',
    2: 'no',
    3: null,
    4: null,
  });

  const question = questions[currentStep - 1];
  const selectedAnswer = answers[question.id];

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswer = (answer: 'yes' | 'no') => {
    setAnswers({ ...answers, [question.id]: answer });
  };

  const progress = (currentStep / questions.length) * 100;

  const isSafeSelected = selectedAnswer === question.safeAnswer;
  const isDangerSelected = selectedAnswer !== null && selectedAnswer !== question.safeAnswer;
  
  let cardBorderClass = 'border-transparent';
  if (isSafeSelected) {
    cardBorderClass = currentStep === 1 ? 'border-[#4CAF50]' : 'border-secondary';
  } else if (isDangerSelected) {
    cardBorderClass = 'border-error';
  }

  return (
    <div className="bg-surface-tint-light min-h-screen flex flex-col font-body-md text-on-surface">
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm docked full-width top-0 z-40">
        <div className="flex justify-between items-center px-gutter py-base w-full max-w-full">
          <button onClick={handlePrev} aria-label="Voltar" className={`p-2 text-primary hover:bg-surface-container-high rounded-full transition-all duration-200 active:opacity-70 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-headline-md font-headline-md text-primary truncate px-2">Prontidão Operacional</h1>
          <button aria-label="Opções" className="p-2 text-primary hover:bg-surface-container-high rounded-full transition-all duration-200 active:opacity-70">
             <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-surface-container-highest h-1">
          <div className="bg-primary h-1 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="px-gutter py-2 text-center text-label-sm text-on-surface-variant">
          Questão {currentStep} de {questions.length}
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col w-full max-w-2xl mx-auto px-container-margin py-stack-gap pb-24">
        {/* Progress Indicator */}
        <div className="w-full flex items-center gap-4 mb-stack-gap px-2">
          <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-label-bold font-label-bold text-outline">{currentStep}/{questions.length}</span>
        </div>

        {/* Readiness Card */}
        <div className={`bg-surface-container-lowest rounded-[16px] overflow-hidden flex flex-col relative transition-shadow duration-300 shadow-[0_4px_20px_rgba(32,59,139,0.12)] border-[4px] ${cardBorderClass}`}>
          
          {/* Image Illustration Placeholder */}
          <div className="w-full bg-surface-container-low flex justify-center items-center pt-8 pb-4">
            <img 
              alt={question.imageAlt} 
              className="w-48 h-auto object-contain" 
              src={question.image} 
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}
            />
          </div>

          {/* Question Text */}
          <div className="p-card-padding flex flex-col items-center text-center">
            <h2 className="text-body-lg font-body-lg text-on-surface mb-8 min-h-[84px] flex items-center justify-center">
              {question.text}
            </h2>

            {/* Action Buttons */}
            <div className="flex w-full gap-stack-gap">
              {currentStep === 1 ? (
                <>
                  <button
                    onClick={() => handleAnswer('yes')}
                    className={`flex-1 py-4 px-6 rounded-xl border-2 transition-colors duration-200 flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                      selectedAnswer === 'yes'
                        ? 'bg-[#4CAF50]/10 border-[#4CAF50] text-[#4CAF50]'
                        : 'border-outline-variant text-on-surface hover:bg-surface-container hover:border-outline'
                    }`}
                  >
                    <span className="text-headline-md font-headline-md flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: selectedAnswer === 'yes' ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span>
                      Sim
                    </span>
                  </button>

                  <button
                    onClick={() => handleAnswer('no')}
                    className={`flex-1 py-4 px-6 rounded-xl border-2 transition-colors duration-200 flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                      selectedAnswer === 'no'
                        ? 'border-error bg-error-container text-on-error-container'
                        : 'border-outline-variant text-on-surface hover:bg-error-container hover:text-on-error-container hover:border-error'
                    }`}
                  >
                    <span className="text-headline-md font-headline-md flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: selectedAnswer === 'no' ? "'FILL' 1" : "'FILL' 0" }}>cancel</span>
                      Não
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAnswer('yes')}
                    className={`flex-1 py-4 px-6 rounded-xl border-2 transition-colors duration-200 flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                      selectedAnswer === 'yes'
                        ? 'border-error bg-error-container text-on-error-container'
                        : 'border-outline-variant text-on-surface hover:bg-error-container hover:text-on-error-container hover:border-error'
                    }`}
                  >
                    <span className="text-headline-md font-headline-md flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: selectedAnswer === 'yes' ? "'FILL' 1" : "'FILL' 0" }}>cancel</span>
                      Sim
                    </span>
                  </button>

                  <button
                    onClick={() => handleAnswer('no')}
                    className={`flex-1 py-4 px-6 rounded-xl border-2 transition-colors duration-200 flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                      selectedAnswer === 'no'
                        ? 'bg-secondary-container text-on-secondary-container border-secondary'
                        : 'border-outline-variant text-on-surface hover:bg-secondary-container hover:text-on-secondary-container hover:border-secondary'
                    }`}
                  >
                    <span className="text-headline-md font-headline-md flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: selectedAnswer === 'no' ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span>
                      Não
                    </span>
                    {selectedAnswer === 'no' && <div className="absolute inset-0 bg-secondary opacity-10"></div>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Controls (Next) */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleNext} 
            disabled={currentStep === questions.length} 
            className="bg-primary text-on-primary text-label-bold font-label-bold py-4 px-8 rounded-full shadow-sm hover:shadow-md hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === questions.length ? 'Finalizar' : 'Avançar'}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-center items-center px-gutter py-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] bg-surface">
        <a className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1 scale-95 transition-transform duration-150 shadow-sm" href="#">
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
          <span className="text-label-sm font-bold">Check-ins</span>
        </a>
      </nav>
    </div>
  );
}
