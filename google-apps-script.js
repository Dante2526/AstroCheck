/**
 * CÓDIGO DO GOOGLE APPS SCRIPT (GMAIL OFICIAL)
 * 
 * Como configurar:
 * 1. Acesse https://script.google.com/ e clique em "Novo Projeto".
 * 2. Cole este código no arquivo Código.gs (substituindo o conteúdo existente).
 * 3. Clique em "Implantar" (Deploy) > "Nova Implantação" (New Deployment).
 * 4. Tipo: "Aplicativo da Web" (Web App).
 * 5. Executar como: "Eu" (seu e-mail do Gmail).
 * 6. Quem pode acessar: "Qualquer pessoa" (Anyone) - ESSENCIAL para o app conseguir disparar.
 * 7. Clique em "Implantar", autorize as permissões da sua conta Google e copie a URL do Web App.
 * 8. Cole a URL no arquivo .env (ou nas variáveis de ambiente do Cloudflare Pages):
 *    VITE_GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/SEU_ID/exec"
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (!data.to || !data.subject) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Destinatário ou assunto ausente." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Dispara o e-mail formatado via Gmail (gratuito: 500 a 1.500 envios/dia)
    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      htmlBody: data.html || data.text,
      body: data.text || "Relatório de Prontidão AstroCheck",
      name: "AstroCheck Prontidão"
    });

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "E-mail de prontidão enviado com sucesso via Gmail!" 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook AstroCheck Gmail ativo e operante!");
}
