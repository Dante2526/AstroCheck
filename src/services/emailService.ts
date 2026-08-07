import emailjs from '@emailjs/browser';
import { 
  TurmaKey, 
  TURMAS, 
  EMAILJS_SERVICE_ID, 
  EMAILJS_TEMPLATE_ID, 
  EMAILJS_PUBLIC_KEY,
  GOOGLE_SCRIPT_URL
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
 * Monta o template HTML formatado, moderno e ultra-leve (< 3.2KB) para envio ao gestor.
 * Projetado para excelente legibilidade tanto em Dark Mode quanto em Light Mode.
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
  const statusBg = isFullApto ? '#15803d' : data.totalRisks <= 2 ? '#d97706' : '#b91c1c';
  const statusTitle = isFullApto 
    ? '✅ 100% APTO PARA JORNADA' 
    : data.totalRisks <= 2 
      ? `⚠️ ATENÇÃO: ${data.totalRisks} PONTO(S) DE RISCO` 
      : `🚨 NÃO APTO: ${data.totalRisks} PONTOS DE RISCO`;
  const statusSub = isFullApto
    ? 'Colaborador declarou estar 100% apto e seguro para a jornada.'
    : data.totalRisks <= 2
      ? 'Atenção: Respostas indicam desvios nos itens de segurança/saúde.'
      : 'Atenção necessária: Respostas indicam desvios críticos de prontidão.';

  const tableRows = data.answers.map(item => {
    const isOk = !item.isRisk;
    const answerLabel = item.answer === 'yes' ? 'SIM' : item.answer === 'no' ? 'NÃO' : 'N/R';
    const badgeBg = isOk ? '#16a34a' : '#dc2626';
    const badgeIcon = isOk ? '✓' : '⚠️';
    const badgeText = `${answerLabel} ${badgeIcon}`;

    return `<tr style="border-bottom:1px solid #334155;">` +
      `<td style="padding:10px 12px;font-size:12.5px;color:#f8fafc;line-height:1.45;"><strong style="color:#38bdf8;margin-right:4px;">#${item.questionId}</strong>${escapeHtml(item.questionText)}</td>` +
      `<td style="padding:10px 12px;text-align:center;white-space:nowrap;"><span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;background-color:${badgeBg};color:#ffffff;">${escapeHtml(badgeText)}</span></td>` +
      `</tr>`;
  }).join('');

  const rawHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><title>Relatório AstroCheck</title></head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:20px 10px;">
        <tr><td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background:#1e293b;border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.3);border:1px solid #334155;">
            <tr>
              <td style="background:#0b1329;padding:20px 24px;text-align:center;border-bottom:3px solid ${turmaConfig.color};">
                <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AstroCheck 🛡️</div>
                <div style="margin-top:4px;color:#94a3b8;font-size:12px;font-weight:500;">Checklist de Prontidão Operacional &amp; Segurança</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px 10px 20px;">
                <div style="background-color:${statusBg};border-radius:10px;padding:14px 18px;text-align:center;">
                  <div style="font-size:15px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">${statusTitle}</div>
                  <div style="font-size:12px;color:#ffffff;opacity:0.95;margin-top:4px;line-height:1.3;">${statusSub}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 20px 14px 20px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;border-radius:10px;border:1px solid #334155;font-size:13px;">
                  <tr>
                    <td style="padding:10px 14px;color:#94a3b8;font-weight:600;width:32%;">Turma / Turno:</td>
                    <td style="padding:10px 14px;font-weight:700;color:#ffffff;">
                      <span style="color:${turmaConfig.color};font-weight:800;">${turmaConfig.label}</span>
                      <span style="color:#cbd5e1;font-weight:500;">(${turmaConfig.turno} — ${turmaConfig.horario})</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;color:#94a3b8;font-weight:600;border-top:1px solid #334155;">Data e Horário:</td>
                    <td style="padding:10px 14px;font-weight:600;color:#f8fafc;border-top:1px solid #334155;">${dateFormatted}</td>
                  </tr>
                  ${data.colaboradorNome ? `
                  <tr>
                    <td style="padding:10px 14px;color:#94a3b8;font-weight:600;border-top:1px solid #334155;">Colaborador:</td>
                    <td style="padding:10px 14px;font-weight:700;color:#ffffff;border-top:1px solid #334155;">
                      ${escapeHtml(data.colaboradorNome)}
                      ${data.colaboradorMatricula ? `<span style="color:#38bdf8;font-weight:700;font-size:12px;margin-left:6px;">(Mat: ${escapeHtml(data.colaboradorMatricula)})</span>` : ''}
                    </td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 20px 16px 20px;">
                <div style="font-size:13px;font-weight:800;color:#ffffff;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">📋 Respostas (${data.answers.length} Itens):</div>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;border:1px solid #334155;border-radius:10px;overflow:hidden;border-collapse:collapse;">
                  <thead>
                    <tr style="background-color:#070d19;border-bottom:2px solid #334155;">
                      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Item</th>
                      <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;width:110px;">Status</th>
                    </tr>
                  </thead>
                  <tbody>${tableRows}</tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background:#0b1329;border-top:1px solid #334155;text-align:center;font-size:11px;color:#64748b;">
                Disparado automaticamente pelo <strong style="color:#94a3b8;">AstroCheck</strong> &bull; Sistema de Prontidão Operacional
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
 * Dispara o e-mail para o gestor via Google Apps Script (Gmail) ou EmailJS com Auto-Retry e Backup Offline.
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

  const hasGoogleScript = Boolean(GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.trim().startsWith('http'));
  const hasEmailJS = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

  // 1. DISPARO VIA GOOGLE APPS SCRIPT (GMAIL OFICIAL - 500 A 1.500 ENVIOS/DIA GRATUITOS)
  if (hasGoogleScript) {
    const payload = {
      to: turmaConfig.gestorEmail,
      to_name: turmaConfig.gestorNome,
      subject,
      html: html_content,
      text: text_content,
      turma: turmaConfig.label,
      colaborador_nome: data.colaboradorNome || 'Colaborador',
      colaborador_matricula: data.colaboradorMatricula || 'N/I',
      colaborador_cargo: data.colaboradorCargo || '',
      data_hora: dateFormatted,
      total_riscos: data.totalRisks,
      status_aptidao: data.totalRisks === 0 ? '100% APTO' : `${data.totalRisks} Ponto(s) de Risco`,
    };

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        saveLocalBackup(data, 'sent');
        console.log(`[AstroCheck] E-mail enviado com sucesso via Gmail (Google Apps Script) para ${turmaConfig.gestorEmail}`);
        return {
          success: true,
          message: `Relatório enviado com sucesso via Gmail para ${turmaConfig.gestorEmail} (${turmaConfig.label})!`,
        };
      } catch (error: any) {
        console.warn(`[AstroCheck] Tentativa ${attempt + 1} Google Apps Script falhou:`, error);
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, 1200));
          continue;
        }

        // Se falhar e tiver EmailJS configurado, tenta EmailJS como fallback
        if (hasEmailJS) {
          console.log('[AstroCheck] Tentando fallback para EmailJS...');
          break;
        }

        saveLocalBackup(data, 'pending');
        return {
          success: false,
          isOfflineSaved: true,
          message: `Falha no envio via Gmail: ${error?.message || 'Erro de conexão'}. O relatório foi salvo no dispositivo.`,
          error,
        };
      }
    }
  }

  // 2. DISPARO VIA EMAILJS (OU MODO SIMULAÇÃO)
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

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      if (hasEmailJS) {
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
        console.log(`[AstroCheck] E-mail enviado com sucesso via EmailJS para ${turmaConfig.gestorEmail} (${turmaConfig.label})`);
        return {
          success: true,
          message: `Relatório enviado com sucesso para o Gestor da ${turmaConfig.label} (${turmaConfig.gestorEmail})!`,
        };
      } else {
        console.warn('[AstroCheck] Modo simulação (sem Google Script ou EmailJS configurado):', templateParams);
        await new Promise(resolve => setTimeout(resolve, 600));
        saveLocalBackup(data, 'sent');
        return {
          success: true,
          message: `Relatório processado para o Gestor da ${turmaConfig.label}! (Modo Simulação)`,
        };
      }
    } catch (error: any) {
      console.warn(`[AstroCheck] Tentativa ${attempt + 1} EmailJS falhou:`, error);
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        continue;
      }

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
