import React from 'react';

export interface BB8ToggleProps {
  isDarkMode: boolean;
  onToggle: (e?: any) => void;
  size?: number;
  className?: string;
}

export const BB8Toggle: React.FC<BB8ToggleProps> = React.memo(({
  isDarkMode,
  onToggle,
  size = 8,
  className = '',
}) => {
  return (
    <label
      className={`bb8-toggle inline-flex items-center justify-center select-none cursor-pointer ${className}`}
      style={{ 
        '--toggle-size': `${size}px`,
        fontSize: `${size}px` 
      } as React.CSSProperties}
      aria-label={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
      title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
      onClick={(e) => onToggle(e)}
    >
      <input
        className="bb8-toggle__checkbox"
        type="checkbox"
        checked={isDarkMode}
        onChange={() => {}}
        onClick={(e) => e.stopPropagation()}
        aria-label="Alternar tema"
      />
      <div className="bb8-toggle__container">
        <div className="bb8-toggle__scenery">
          <div className="bb8-toggle__star"></div>
          <div className="bb8-toggle__star"></div>
          <div className="bb8-toggle__star"></div>
          <div className="bb8-toggle__star"></div>
          <div className="bb8-toggle__star"></div>
          <div className="bb8-toggle__star"></div>
          <div className="bb8-toggle__star"></div>
          <div className="tatto-1" aria-hidden="true"></div>
          <div className="tatto-2" aria-hidden="true"></div>
          <div className="gomrassen"></div>
          <div className="hermes"></div>
          <div className="chenini"></div>
          <div className="bb8-toggle__cloud"></div>
          <div className="bb8-toggle__cloud"></div>
          <div className="bb8-toggle__cloud"></div>
        </div>
        <div className="bb8">
          <div className="bb8__head-container">
            <div className="bb8__antenna"></div>
            <div className="bb8__antenna"></div>
            <div className="bb8__head"></div>
          </div>
          <div className="bb8__body"></div>
        </div>
        <div className="artificial__hidden" aria-hidden="true">
          <div className="bb8__shadow"></div>
        </div>
      </div>
    </label>
  );
});

BB8Toggle.displayName = 'BB8Toggle';
