import emailjs from '@emailjs/browser';
import { 
  TurmaKey, 
  TURMAS, 
  EMAILJS_SERVICE_ID, 
  EMAILJS_TEMPLATE_ID, 
  EMAILJS_PUBLIC_KEY 
} from '../config/turmas';

export interface ReadinessAnswerItem {
  questionId: number;
  questionText: string;
  answer: 'yes' | 'no' | null;
  safeAnswer: 'yes' | 'no';
  isRisk: boolean;
}

export interface ReadinessReportData {
  turma: TurmaKey;
  answers: ReadinessAnswerItem[];
  totalRisks: number;
  timestamp: string;
  colaboradorNome?: string;
  colaboradorMatricula?: string;
  colaboradorCargo?: string;
}

/**
 * Sanitiza strings para prevenir injeção de HTML e XSS em e-mails
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Minifica strings HTML removendo quebras de linha e espaços redundantes.
 */
function compactHtml(html: string): string {
  return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
}

/**
 * Monta o template HTML formatado, moderno e ultra-leve (< 3KB) para envio ao gestor.
 */
export function buildReadinessEmailHtml(data: ReadinessReportData): string {
  const turmaConfig = TURMAS[data.turma];
  const dateFormatted = new Date(data.timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isFullApto = data.totalRisks === 0;
  const statusColor = isFullApto ? '#16a34a' : data.totalRisks <= 2 ? '#d97706' : '#dc2626';
  const statusBg = isFullApto ? '#dcfce7' : data.totalRisks <= 2 ? '#fef9c3' : '#fee2e2';
  const statusBorder = isFullApto ? '#86efac' : data.totalRisks <= 2 ? '#fde047' : '#fca5a5';
  const statusText = isFullApto 
    ? '✅ 100% APTO PARA JORNADA' 
    : data.totalRisks <= 2 
      ? `⚠️ ATENÇÃO: ${data.totalRisks} PONTO(S) DE RISCO` 
      : `🚨 NÃO APTO: ${data.totalRisks} PONTOS DE RISCO`;

  const tableRows = data.answers.map(item => {
    const isOk = !item.isRisk;
    const answerLabel = item.answer === 'yes' ? 'SIM' : item.answer === 'no' ? 'NÃO' : 'NÃO RESPONDIDO';
    const answerColor = isOk ? '#15803d' : '#b91c1c';
    const answerBg = isOk ? '#f0fdf4' : '#fef2f2';
    const answerBorder = isOk ? '#bbf7d0' : '#fecaca';

    return `<tr style="border-bottom:1px solid #e2e8f0;">` +
      `<td style="padding:10px 12px;font-size:13px;color:#1e293b;line-height:1.4;"><strong style="color:#64748b;">#${item.questionId}</strong> ${escapeHtml(item.questionText)}</td>` +
      `<td style="padding:10px 12px;text-align:center;white-space:nowrap;"><span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${answerBg};color:${answerColor};border:1px solid ${answerBorder};">${escapeHtml(answerLabel)} ${isOk ? '✓' : '⚠️'}</span></td>` +
      `</tr>`;
  }).join('');

  const rawHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><title>Relatório AstroCheck</title></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:16px 8px;">
        <tr><td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#0f172a;padding:20px 24px;text-align:center;border-bottom:3px solid ${turmaConfig.color};">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AstroCheck 🛡️</span>
                <div style="margin-top:4px;color:#94a3b8;font-size:12px;font-weight:500;">Checklist de Prontidão Operacional &amp; Segurança</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px 8px 20px;">
                <div style="background:${statusBg};border:1px solid ${statusBorder};border-radius:10px;padding:12px;text-align:center;">
                  <strong style="font-size:15px;color:${statusColor};display:block;">${statusText}</strong>
                  <span style="font-size:12px;color:#334155;margin-top:2px;display:block;">${isFullApto ? 'Colaborador declarou estar 100% apto para a jornada.' : 'Atenção necessária: Respostas indicam desvios nos itens de prontidão.'}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 20px 14px 20px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;font-size:13px;">
                  <tr><td style="padding:8px 12px;color:#64748b;font-weight:600;width:35%;">Turma / Turno:</td><td style="padding:8px 12px;font-weight:700;color:#0f172a;"><span style="color:${turmaConfig.color};">${turmaConfig.label}</span> (${turmaConfig.turno} — ${turmaConfig.horario})</td></tr>
                  <tr><td style="padding:8px 12px;color:#64748b;font-weight:600;border-top:1px solid #edf2f7;">Data e Horário:</td><td style="padding:8px 12px;font-weight:600;color:#0f172a;border-top:1px solid #edf2f7;">${dateFormatted}</td></tr>
                  ${data.colaboradorNome ? `<tr><td style="padding:8px 12px;color:#64748b;font-weight:600;border-top:1px solid #edf2f7;">Colaborador:</td><td style="padding:8px 12px;font-weight:700;color:#0f172a;border-top:1px solid #edf2f7;">${escapeHtml(data.colaboradorNome)} ${data.colaboradorMatricula ? `<span style="color:#0080ff;font-size:12px;">(Mat: ${escapeHtml(data.colaboradorMatricula)})</span>` : ''}</td></tr>` : ''}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 20px 16px 20px;">
                <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px;text-transform:uppercase;">📋 Respostas (${data.answers.length} Itens):</div>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                  <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;"><th style="padding:8px 10px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;">Item</th><th style="padding:8px 10px;text-align:center;font-size:11px;color:#475569;text-transform:uppercase;width:100px;">Status</th></tr></thead>
                  <tbody>${tableRows}</tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
                Disparado automaticamente pelo <strong>AstroCheck</strong> &bull; Sistema de Prontidão Operacional
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  return compactHtml(rawHtml);
}

/**
 * Monta o resumo em texto simples para fallback ou auditoria.
 */
export function buildReadinessEmailPlainText(data: ReadinessReportData): string {
  const turmaConfig = TURMAS[data.turma];
  const dateFormatted = new Date(data.timestamp).toLocaleString('pt-BR');
  const isFullApto = data.totalRisks === 0;

  const lines = [
    `ASTROCHECK - RELATÓRIO DE PRONTIDÃO`,
    `Status: ${isFullApto ? '100% APTO PARA JORNADA' : `ATENÇÃO: ${data.totalRisks} PONTO(S) DE RISCO`}`,
    `Turma: ${turmaConfig.label} (${turmaConfig.turno} - ${turmaConfig.horario})`,
    `Data/Hora: ${dateFormatted}`,
    data.colaboradorNome ? `Colaborador: ${data.colaboradorNome} (Mat: ${data.colaboradorMatricula || 'N/I'})` : '',
    '',
    `RESPOSTAS DO CHECKLIST:`,
    ...data.answers.map(a => `#${a.questionId}: ${a.answer === 'yes' ? 'SIM' : a.answer === 'no' ? 'NÃO' : 'N/R'} - ${a.questionText}`),
  ].filter(Boolean);

  return lines.join('\n');
}

export interface SendReportResult {
  success: boolean;
  message: string;
  isOfflineSaved?: boolean;
  error?: any;
}

/**
 * Salva o relatório no localStorage como backup local para histórico e auditoria offline.
 */
function saveLocalBackup(data: ReadinessReportData, status: 'sent' | 'pending') {
  try {
    const historyKey = 'astrocheck_reports_history';
    const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
    existing.unshift({
      ...data,
      status,
      savedAt: new Date().toISOString(),
    });
    // Manter no máximo os últimos 50 relatórios salvos
    localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.warn('[AstroCheck] Falha ao salvar backup local:', err);
  }
}

/**
 * Dispara o e-mail para o gestor com Timeout, Auto-Retry e Payload Ultra-Otimizado (< 10KB total).
 */
export async function sendReadinessEmail(
  data: ReadinessReportData,
  retryCount: number = 1
): Promise<SendReportResult> {
  const turmaConfig = TURMAS[data.turma];
  const html_content = buildReadinessEmailHtml(data);
  const text_content = buildReadinessEmailPlainText(data);
  const dateFormatted = new Date(data.timestamp).toLocaleString('pt-BR');
  const subject = `AstroCheck Prontidão — ${turmaConfig.label} — ${new Date(data.timestamp).toLocaleDateString('pt-BR')}`;

  // Payload otimizado: cada variável serve aos formatos mais comuns de template do EmailJS sem duplicatas excessivas
  const templateParams: Record<string, any> = {
    message_html: html_content,
    message: html_content,
    html_content: html_content,
    message_text: text_content,
    subject,
    turma: turmaConfig.label,
    turma_nome: turmaConfig.label,
    gestor_nome: turmaConfig.gestorNome,
    gestor_email: turmaConfig.gestorEmail,
    to_email: turmaConfig.gestorEmail,
    to_name: turmaConfig.gestorNome,
    colaborador_nome: data.colaboradorNome || 'Colaborador',
    colaborador_matricula: data.colaboradorMatricula || 'N/I',
    colaborador_cargo: data.colaboradorCargo || '',
    data_hora: dateFormatted,
    total_riscos: data.totalRisks,
    status_aptidao: data.totalRisks === 0 ? '100% APTO' : `${data.totalRisks} Ponto(s) de Risco`,
  };

  const hasCredentials = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      if (hasCredentials) {
        // Timeout Promise de 10 segundos para não prender a interface
        const sendPromise = emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        );

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tempo limite de conexão excedido (10s)')), 10000)
        );

        await Promise.race([sendPromise, timeoutPromise]);
        
        saveLocalBackup(data, 'sent');
        console.log(`[AstroCheck] E-mail enviado com sucesso para ${turmaConfig.gestorEmail} (${turmaConfig.label})`);
        return {
          success: true,
          message: `Relatório enviado com sucesso para o Gestor da ${turmaConfig.label} (${turmaConfig.gestorEmail})!`,
        };
      } else {
        // Fallback Simulação segura
        console.warn('[AstroCheck] EmailJS em modo simulação:', templateParams);
        await new Promise(resolve => setTimeout(resolve, 600));
        saveLocalBackup(data, 'sent');
        return {
          success: true,
          message: `Relatório processado para o Gestor da ${turmaConfig.label}! (Modo Simulação)`,
        };
      }
    } catch (error: any) {
      console.warn(`[AstroCheck] Tentativa ${attempt + 1} falhou:`, error);
      if (attempt < retryCount) {
        // Espera 1.2s antes de tentar novamente (backoff)
        await new Promise(resolve => setTimeout(resolve, 1200));
        continue;
      }

      // Se falhar após retry, salva backup local para não perder os dados
      saveLocalBackup(data, 'pending');
      const errDetail = error?.text || error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      return {
        success: false,
        isOfflineSaved: true,
        message: `Falha no envio de e-mail: ${errDetail || 'Erro de conexão'}. O relatório foi salvo no dispositivo.`,
        error,
      };
    }
  }

  saveLocalBackup(data, 'pending');
  return {
    success: false,
    message: 'Não foi possível concluir o envio após tentativas.',
  };
}
