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
