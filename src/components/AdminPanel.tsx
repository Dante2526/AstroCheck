import React, { useState, useEffect } from 'react';
import { Settings, Save, Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { fetchEmailSettings, saveEmailSettings, EmailSettings } from '../services/firebase';
import { TURMAS } from '../config/turmas';

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    setIsLoading(true);
    const data = await fetchEmailSettings();
    if (data) {
      setSettings(data);
    } else {
      // Fallback
      setSettings({
        A: { gestorNome: TURMAS.A.gestorNome, gestorEmail: TURMAS.A.gestorEmail },
        B: { gestorNome: TURMAS.B.gestorNome, gestorEmail: TURMAS.B.gestorEmail },
        C: { gestorNome: TURMAS.C.gestorNome, gestorEmail: TURMAS.C.gestorEmail },
        D: { gestorNome: TURMAS.D.gestorNome, gestorEmail: TURMAS.D.gestorEmail },
      });
    }
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN padrao para acessar o painel
    if (pin === '1234' || pin === '4321') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleChange = (turma: string, field: 'gestorNome' | 'gestorEmail', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [turma]: {
        ...settings[turma],
        [field]: value
      }
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    const success = await saveEmailSettings(settings);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  const goBack = () => {
    window.location.href = '/';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700/50">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/10 p-4 rounded-full border border-blue-500/20">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">Acesso Restrito</h1>
          <p className="text-slate-400 text-center mb-8">
            Painel de administração. Insira o PIN para configurar os e-mails das turmas.
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Digite o PIN numérico"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={`w-full bg-slate-900 border ${pinError ? 'border-red-500' : 'border-slate-700'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-center text-2xl tracking-[0.5em]`}
                autoFocus
              />
              {pinError && (
                <p className="text-red-400 text-sm mt-2 text-center">PIN incorreto. Tente novamente.</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <span>Desbloquear Painel</span>
            </button>
            <button
              type="button"
              onClick={goBack}
              className="w-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Início</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-3 text-blue-400 mb-2">
              <Settings className="w-6 h-6" />
              <h1 className="text-2xl font-bold text-white">Configuração de E-mails</h1>
            </div>
            <p className="text-slate-400">
              Gerencie os destinatários de e-mail de cada turma. As alterações são aplicadas instantaneamente.
            </p>
          </div>
          
          <div className="flex space-x-3 w-full md:w-auto">
            <button
              onClick={goBack}
              className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center space-x-2 transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sair</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium ${
                saveSuccess 
                  ? 'bg-green-600 text-white hover:bg-green-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400">Carregando configurações do banco de dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['A', 'B', 'C', 'D'].map((turma) => (
              <div key={turma} className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: TURMAS[turma as keyof typeof TURMAS].color }} />
                
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm" style={{ backgroundColor: TURMAS[turma as keyof typeof TURMAS].bgDark, color: TURMAS[turma as keyof typeof TURMAS].color }}>
                    {turma}
                  </span>
                  Turma {turma}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Nome do Gestor/Coordenador
                    </label>
                    <input
                      type="text"
                      value={settings?.[turma]?.gestorNome || ''}
                      onChange={(e) => handleChange(turma, 'gestorNome', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      E-mail de Destino
                    </label>
                    <input
                      type="email"
                      value={settings?.[turma]?.gestorEmail || ''}
                      onChange={(e) => handleChange(turma, 'gestorEmail', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Ex: joao.silva@empresa.com.br"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
