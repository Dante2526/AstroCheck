# Tela de Manutenção (AstroCheck)

## Objetivo
Bloquear o acesso ao aplicativo temporariamente durante um deploy com uma tela de manutenção amigável, no estilo visual espacial do sistema.

## Design
- **Componente**: `MaintenanceScreen` (`src/components/MaintenanceScreen.tsx`).
- **Visual**: Fundo escuro elegante combinando com o tema existente. Uma imagem/logo central (ou astronauta) animada de forma leve com `framer-motion` (efeito "flutuando").
- **Texto**: Mensagem clara, ex: "Estamos atualizando o sistema. Voltaremos em breve!"
- **Implementação**: 
  - Uma flag `MAINTENANCE_MODE = true;` no topo do arquivo `src/App.tsx`.
  - Se a flag for verdadeira, renderiza **apenas** o `MaintenanceScreen`.
