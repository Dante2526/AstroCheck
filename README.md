# AstroCheck

Checklist diário de prontidão operacional com acompanhamento preventivo e reporte por turma.

## Tecnologias
- React 19 + TypeScript
- Vite + Tailwind CSS
- Firebase (Firestore & Auth)
- PWA (Progressive Web App com suporte offline)
- WebAuthn para Autenticação Biométrica
- Integração com Google Apps Script para Envio de E-mails

## Variáveis de Ambiente

Copie o `.env.example` para `.env` ou `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Abra o arquivo e preencha as configurações corretamente:
- **WebAuthn**: Defina `VITE_WEBAUTHN_RPID` com o domínio que hospedará a aplicação para garantir a segurança da biometria.
- **E-mails**: Configure os e-mails e nomes dos gestores das Turmas (A, B, C, D). Se essas variáveis não forem preenchidas, os relatórios para essas turmas falharão em ambiente de produção (PROD).
- **Integração de Email (Gmail)**: Publique o seu script do Google Apps Script e insira a URL em `VITE_GOOGLE_SCRIPT_URL`.

## Executando Localmente

Para rodar em modo de desenvolvimento:

```bash
npm install
npm run dev
```

> No modo de desenvolvimento, se a variável `VITE_GOOGLE_SCRIPT_URL` não for configurada, a submissão do checklist entrará em **Modo Simulação**, permitindo testar toda a interface de envio sem disparar e-mails reais.

## Configuração do Google Apps Script (Webhook)

O AstroCheck envia e-mails contornando limites pesados de SMTP usando um Webhook do Google Apps Script.

1. Acesse o [Google Apps Script](https://script.google.com/).
2. Crie um novo projeto, e copie o código do arquivo local `google-apps-script.js`.
3. Selecione "Implantar" > "Nova implantação".
4. Tipo: **App da Web**
5. Executar como: *Você*
6. Quem pode acessar: *Qualquer pessoa* (O AstroCheck precisa alcançar a URL abertamente).
7. Clique em **Implantar** e copie o **ID de Implementação** (URL gerada) para o `.env.local` no campo `VITE_GOOGLE_SCRIPT_URL`.

## Deploy no Cloudflare Pages

O build é totalmente estático graças ao Vite. Configure sua automação no Cloudflare Pages definindo:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`

Não se esqueça de adicionar as **Variáveis de Ambiente** lá também!
