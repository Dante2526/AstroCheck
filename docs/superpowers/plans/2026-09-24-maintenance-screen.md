# Tela de Manutenção Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma tela de manutenção elegante ao AstroCheck para bloquear o acesso durante os deploys.

**Architecture:** Um componente isolado `MaintenanceScreen` que é importado e renderizado condicionalmente pelo `App.tsx` usando uma flag simples de desenvolvimento no topo do arquivo.

**Tech Stack:** React, Tailwind CSS, framer-motion

## Global Constraints
- Utilizar os ícones e estilos já presentes no projeto (dark theme, imagens em `/public/`).
- Não quebrar rotas e o estado quando a flag for removida no futuro.

---

### Task 1: Componente MaintenanceScreen

**Files:**
- Create: `src/components/MaintenanceScreen.tsx`

**Interfaces:**
- Consumes: `framer-motion`
- Produces: `MaintenanceScreen`

- [ ] **Step 1: Write minimal implementation**

```tsx
import React from 'react';
import { motion } from 'motion/react';

export function MaintenanceScreen() {
  return (
    <div className="bg-[#111217] min-h-dvh flex flex-col items-center justify-center font-body-md text-[#f7fafc] px-4 selection:bg-[#0080ff]/30 text-center">
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="mb-8 relative"
      >
        <div className="absolute inset-0 bg-[#0080ff]/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <img 
          src="/astronaut_trabalho.webp" 
          alt="Astronauta flutuando" 
          className="w-48 h-48 object-contain drop-shadow-[0_0_15px_rgba(0,128,255,0.3)] relative z-10"
        />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl sm:text-3xl font-bold mb-4"
      >
        Estamos atualizando o sistema
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[#a0aec0] max-w-sm"
      >
        O AstroCheck está passando por melhorias. Voltaremos a voar em breve!
      </motion.p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MaintenanceScreen.tsx
git commit -m "feat: cria tela de manutencao"
```

### Task 2: Bloquear App.tsx

**Files:**
- Modify: `src/App.tsx:142-152`

**Interfaces:**
- Consumes: `MaintenanceScreen`

- [ ] **Step 1: Write the integration code**

```tsx
import { MaintenanceScreen } from './components/MaintenanceScreen';

const MAINTENANCE_MODE = true;

export default function App() {
  if (MAINTENANCE_MODE) {
    return <MaintenanceScreen />;
  }

  const [currentStep, setCurrentStep] = useState(1);
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: ativa tela de manutencao temporariamente"
```
