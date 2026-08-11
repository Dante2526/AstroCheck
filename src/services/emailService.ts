import { 
  TurmaKey, 
  TURMAS, 
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
 * Monta o template HTML formatado, moderno e adaptável para envio ao gestor.
 * Projetado para renderização impecável tanto em Modo Claro quanto em Modo Escuro
 * no Outlook, Gmail, Apple Mail e Webmails.
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
  
  // Cores de status com alto contraste e legibilidade
  const statusBg = isFullApto ? '#16a34a' : data.totalRisks <= 2 ? '#d97706' : '#dc2626';
  const statusTitle = isFullApto 
    ? '✅ 100% APTO PARA JORNADA' 
    : data.totalRisks <= 2 
      ? `⚠️ ATENÇÃO: ${data.totalRisks} PONTO(S) DE RISCO` 
      : `🚨 NÃO APTO: ${data.totalRisks} PONTOS DE RISCO`;
  const statusSub = isFullApto
    ? 'Colaborador declarou estar 100% apto e seguro para a jornada operacional.'
    : data.totalRisks <= 2
      ? 'Atenção necessária: Respostas indicam desvios leves nos itens de prontidão.'
      : 'Atenção imediata: Respostas indicam desvios críticos de prontidão operacional.';

  const tableRows = data.answers.map((item, idx) => {
    const isOk = !item.isRisk;
    const answerLabel = item.answer === 'yes' ? 'SIM' : item.answer === 'no' ? 'NÃO' : 'N/R';
    const badgeBg = isOk ? '#16a34a' : '#dc2626';
    const badgeIcon = isOk ? '✓' : '⚠️';
    const badgeText = `${answerLabel} ${badgeIcon}`;
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

    return `<tr class="table-row" style="background-color:${rowBg};border-bottom:1px solid #e2e8f0;">` +
      `<td class="table-text" style="padding:10px 14px;font-size:12.5px;color:#1e293b;line-height:1.45;">` +
        `<strong class="table-qnum" style="color:#0284c7;font-weight:700;margin-right:6px;">#${item.questionId}</strong>` +
        `${escapeHtml(item.questionText)}` +
      `</td>` +
      `<td style="padding:10px 14px;text-align:center;white-space:nowrap;width:100px;">` +
        `<span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;background-color:${badgeBg};color:#ffffff;letter-spacing:0.3px;">${escapeHtml(badgeText)}</span>` +
      `</td>` +
      `</tr>`;
  }).join('');

  const rawHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Relatório AstroCheck</title>
      <style>
        :root {
          color-scheme: light dark;
          supported-color-schemes: light dark;
        }
        @media (prefers-color-scheme: dark) {
          .email-bg { background-color: #111217 !important; }
          .card-container { background-color: #1a1d24 !important; border-color: #2e3340 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important; }
          .card-header { background-color: #15181e !important; }
          .text-main { color: #f8fafc !important; }
          .text-sub { color: #94a3b8 !important; }
          .info-box { background-color: #14171d !important; border-color: #2e3340 !important; }
          .info-label { color: #94a3b8 !important; }
          .info-value { color: #f8fafc !important; }
          .info-border { border-top-color: #2e3340 !important; }
          .table-wrap { background-color: #14171d !important; border-color: #2e3340 !important; }
          .table-head { background-color: #1f242e !important; border-bottom-color: #2e3340 !important; color: #94a3b8 !important; }
          .table-row { background-color: #14171d !important; border-bottom-color: #222733 !important; }
          .table-text { color: #f1f5f9 !important; }
          .table-qnum { color: #38bdf8 !important; }
          .card-footer { background-color: #15181e !important; border-top-color: #2e3340 !important; color: #64748b !important; }
        }
        [data-ogsc] .email-bg { background-color: #111217 !important; }
        [data-ogsc] .card-container { background-color: #1a1d24 !important; border-color: #2e3340 !important; }
        [data-ogsc] .text-main { color: #f8fafc !important; }
        [data-ogsc] .text-sub { color: #94a3b8 !important; }
        [data-ogsc] .info-box { background-color: #14171d !important; border-color: #2e3340 !important; }
        [data-ogsc] .info-label { color: #94a3b8 !important; }
        [data-ogsc] .info-value { color: #f8fafc !important; }
        [data-ogsc] .table-wrap { background-color: #14171d !important; border-color: #2e3340 !important; }
        [data-ogsc] .table-head { background-color: #1f242e !important; color: #94a3b8 !important; }
        [data-ogsc] .table-text { color: #f1f5f9 !important; }
        [data-ogsc] .table-qnum { color: #38bdf8 !important; }
        [data-ogsc] .card-footer { background-color: #15181e !important; color: #64748b !important; }
      </style>
    </head>
    <body class="email-bg" style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
      <table class="email-bg" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:24px 12px;">
        <tr><td align="center">
          <table class="card-container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.07);border:1px solid #e2e8f0;">
            
            <!-- CABEÇALHO COM IDENTIDADE VISUAL -->
            <tr>
              <td class="card-header" style="background-color:#ffffff;padding:22px 24px 18px 24px;text-align:center;border-bottom:3px solid ${turmaConfig.color};">
                <div class="text-main" style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">AstroCheck 🛡️</div>
                <div class="text-sub" style="margin-top:4px;color:#64748b;font-size:12px;font-weight:500;">Checklist de Prontidão Operacional &amp; Segurança</div>
              </td>
            </tr>

            <!-- CARD DE STATUS DE PRONTIDÃO -->
            <tr>
              <td style="padding:18px 20px 10px 20px;">
                <div style="background-color:${statusBg};border-radius:10px;padding:14px 18px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
                  <div style="font-size:15px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">${statusTitle}</div>
                  <div style="font-size:12px;color:#ffffff;opacity:0.95;margin-top:4px;line-height:1.35;">${statusSub}</div>
                </div>
              </td>
            </tr>

            <!-- QUADRO DE INFORMAÇÕES (TURMA, DATA, COLABORADOR) -->
            <tr>
              <td style="padding:6px 20px 14px 20px;">
                <table class="info-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;font-size:13px;">
                  <tr>
                    <td class="info-label" style="padding:10px 14px;color:#64748b;font-weight:600;width:32%;">Turma / Turno:</td>
                    <td class="info-value" style="padding:10px 14px;font-weight:700;color:#0f172a;">
                      <span style="color:${turmaConfig.color};font-weight:800;">${turmaConfig.label}</span>
                      <span style="color:#64748b;font-weight:500;margin-left:4px;">(${turmaConfig.turno} — ${turmaConfig.horario})</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="info-label info-border" style="padding:10px 14px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Data e Horário:</td>
                    <td class="info-value info-border" style="padding:10px 14px;font-weight:600;color:#1e293b;border-top:1px solid #e2e8f0;">${dateFormatted}</td>
                  </tr>
                  ${data.colaboradorNome ? `
                  <tr>
                    <td class="info-label info-border" style="padding:10px 14px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Colaborador:</td>
                    <td class="info-value info-border" style="padding:10px 14px;font-weight:700;color:#0f172a;border-top:1px solid #e2e8f0;">
                      ${escapeHtml(data.colaboradorNome)}
                      ${data.colaboradorMatricula ? `<span style="color:#0284c7;font-weight:700;font-size:12px;margin-left:6px;">(Mat: ${escapeHtml(data.colaboradorMatricula)})</span>` : ''}
                    </td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>

            <!-- TABELA DE RESPOSTAS -->
            <tr>
              <td style="padding:4px 20px 16px 20px;">
                <div class="text-main" style="font-size:12px;font-weight:800;color:#334155;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">📋 Respostas (${data.answers.length} Itens):</div>
                <table class="table-wrap" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:collapse;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
                  <thead>
                    <tr class="table-head" style="background-color:#f1f5f9;border-bottom:2px solid #e2e8f0;">
                      <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
                      <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Status</th>
                    </tr>
                  </thead>
                  <tbody>${tableRows}</tbody>
                </table>
              </td>
            </tr>

            <!-- RODAPÉ -->
            <tr>
              <td class="card-footer" style="padding:14px 20px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
                Disparado automaticamente pelo <strong style="color:#64748b;">AstroCheck</strong> &bull; Sistema de Prontidão Operacional
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

  // DISPARO VIA GOOGLE APPS SCRIPT (GMAIL OFICIAL - 500 A 1.500 ENVIOS/DIA GRATUITOS)
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

    // Ping CORS pre-flight para validar se podemos ler a resposta com segurança
    let corsEnabled = false;
    try {
      const pingController = new AbortController();
      const pingTimeoutId = setTimeout(() => pingController.abort(), 3500);
      const pingRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        signal: pingController.signal,
      });
      clearTimeout(pingTimeoutId);
      if (pingRes.ok) {
        corsEnabled = true;
      }
    } catch (pingErr) {
      console.warn('[AstroCheck] Ping do Apps Script falhou (rede ou CORS). Abortando modo Gmail.');
    }

    if (!corsEnabled) {
      console.warn('[AstroCheck] Sem CORS no GAS, falhando envio imediatamente (CORS Bloqueado/Rede).');
      saveLocalBackup(data, 'pending');
      return {
        success: false,
        isOfflineSaved: true,
        message: 'Falha no envio via Gmail (Conexão ou CORS bloqueado). Relatório salvo no dispositivo para envio posterior.',
      };
    } else {
      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
          
          let response;
          try {
            response = await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8',
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
          }
          
          const resultData = await response.json().catch(() => null);
          if (resultData && resultData.status === 'error') {
            throw new Error(`Erro do Script: ${resultData.message}`);
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
  }

  // MODO SIMULAÇÃO
  console.warn('[AstroCheck] Modo simulação (sem Google Script configurado).');
  await new Promise(resolve => setTimeout(resolve, 600));
  saveLocalBackup(data, 'sent');
  return {
    success: true,
    message: `Relatório processado para o Gestor da ${turmaConfig.label}! (Modo Simulação)`,
  };
}
