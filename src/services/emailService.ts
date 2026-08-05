// src/services/emailService.ts
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
 * Monta o template HTML formatado e moderno para envio por e-mail ao gestor.
 */
export function buildReadinessEmailHtml(data: ReadinessReportData): string {
  const turmaConfig = TURMAS[data.turma];
  const dateFormatted = new Date(data.timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 14px; font-size: 13px; color: #1f2937; line-height: 1.4; vertical-align: middle;">
          <strong style="color: #4b5563;">#${item.questionId}</strong> ${escapeHtml(item.questionText)}
        </td>
        <td style="padding: 12px 14px; text-align: center; vertical-align: middle; white-space: nowrap;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; background-color: ${answerBg}; color: ${answerColor}; border: 1px solid ${isOk ? '#bbf7d0' : '#fecaca'};">
            ${escapeHtml(answerLabel)} ${isOk ? '✓' : '⚠️'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório AstroCheck - ${turmaConfig.label}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #0b1528 0%, #151e33 100%); padding: 24px 28px; text-align: center; border-bottom: 3px solid ${turmaConfig.color};">
                  <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                    <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">AstroCheck</span>
                    <span style="background: #22c55e; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; vertical-align: middle;">ONLINE</span>
                  </div>
                  <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">
                    Checklist de Prontidão Operacional & Segurança
                  </p>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 20px 28px 10px 28px;">
                  <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 12px; padding: 16px; text-align: center;">
                    <span style="font-size: 16px; font-weight: 800; color: ${statusColor}; letter-spacing: 0.3px; display: block;">
                      ${statusText}
                    </span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563;">
                      ${isFullApto ? 'O colaborador declarou estar 100% apto e em condições seguras para a jornada.' : 'Atenção necessária: Respostas indicam desvios nos itens de segurança/saúde.'}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Detalhes do Registro -->
              <tr>
                <td style="padding: 10px 28px 16px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px;">
                    <tr>
                      <td style="padding: 6px 12px; font-size: 13px; color: #64748b; width: 40%;"><strong>Turma / Turno:</strong></td>
                      <td style="padding: 6px 12px; font-size: 14px; font-weight: bold; color: #0f172a;">
                        <span style="color: ${turmaConfig.color};">${turmaConfig.label}</span> (${turmaConfig.turno} — ${turmaConfig.horario})
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 12px; font-size: 13px; color: #64748b;"><strong>Gestor Destinatário:</strong></td>
                      <td style="padding: 6px 12px; font-size: 13px; color: #0f172a;">${turmaConfig.gestorNome} (${turmaConfig.gestorEmail})</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 12px; font-size: 13px; color: #64748b;"><strong>Data e Horário:</strong></td>
                      <td style="padding: 6px 12px; font-size: 13px; color: #0f172a;">${dateFormatted}</td>
                    </tr>
                    ${data.colaboradorNome ? `
                    <tr>
                      <td style="padding: 6px 12px; font-size: 13px; color: #64748b;"><strong>Colaborador:</strong></td>
                      <td style="padding: 6px 12px; font-size: 13px; font-weight: bold; color: #0f172a;">${escapeHtml(data.colaboradorNome)}</td>
                    </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>

              <!-- Tabela com Respostas -->
              <tr>
                <td style="padding: 4px 28px 20px 28px;">
                  <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                    📋 Respostas do Checklist (${data.answers.length} Itens):
                  </h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Pergunta</th>
                        <th style="padding: 10px 14px; text-align: center; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; width: 120px;">Resposta</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tableRows}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                    Disparado automaticamente pelo <strong>AstroCheck</strong> &bull; Sistema de Prontidão Operacional
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
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
 * Dispara o e-mail para o gestor com Timeout, Auto-Retry e Backup Offline garantido.
 */
export async function sendReadinessEmail(
  data: ReadinessReportData,
  retryCount: number = 1
): Promise<SendReportResult> {
  const turmaConfig = TURMAS[data.turma];
  const html_content = buildReadinessEmailHtml(data);
  const subject = `[AstroCheck] Prontidão Operacional — ${turmaConfig.label} (${turmaConfig.periodo}) — ${new Date(data.timestamp).toLocaleDateString('pt-BR')}`;

  const templateParams = {
    html_content,
    subject,
    turma: turmaConfig.label,
    gestor_nome: turmaConfig.gestorNome,
    gestor_email: turmaConfig.gestorEmail,
    to_email: turmaConfig.gestorEmail,
    data_envio: new Date(data.timestamp).toLocaleString('pt-BR'),
    total_riscos: data.totalRisks,
  };

  const hasCredentials = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      if (hasCredentials) {
        // Carrega o SDK do EmailJS dinamicamente sob demanda (0kb no bundle inicial)
        const emailjs = (await import('@emailjs/browser')).default;

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
      return {
        success: false,
        isOfflineSaved: true,
        message: `Instabilidade na rede. Os dados foram salvos com segurança no dispositivo. Erro: ${error?.text || error?.message || 'Falha de conexão'}`,
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
