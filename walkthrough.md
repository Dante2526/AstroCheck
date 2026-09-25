# Walkthrough: Tela de Manutenção

## Resumo das Mudanças
- **Objetivo**: Bloquear o acesso ao aplicativo temporariamente durante um deploy.
- **Implementação**: 
  - Criado componente `src/components/MaintenanceScreen.tsx` usando `framer-motion` para animação e estilo espacial.
  - Adicionada flag `MAINTENANCE_MODE = true` no `src/App.tsx` para interceptar a renderização e exibir a tela de manutenção.
- **Verificações**: 
  - Linter (`npm run lint`) executado com 0 erros.
  - Build (`npm run build`) executado com sucesso.
- **Deploy**: Alterações comitadas na branch `main` e enviadas para o repositório remoto.

## Próximos Passos
Quando o deploy terminar e você quiser desativar a tela de manutenção, basta ir no arquivo `src/App.tsx` e alterar `MAINTENANCE_MODE = false`.
