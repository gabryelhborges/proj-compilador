import React, { useState } from 'react';

const BotaoAnalise = ({ onClick, disabled = false }) => {
  const [analisando, setAnalisando] = useState(false);

  const handleClick = async () => {
    if (disabled || analisando) return;
    
    setAnalisando(true);
    try {
      await onClick();
    } catch (error) {
      console.error("Erro na análise:", error);
    } finally {
      setAnalisando(false);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={disabled || analisando} 
      className={analisando ? 'btn-analisando' : ''}
    >
      {analisando ? (
        <>
          <span className="spinner"></span>
          Analisando...
        </>
      ) : (
        <>▶ Analisar</>
      )}
    </button>
  );
};

export default BotaoAnalise;