import React, { useState } from 'react';

const BotaoAnalise = ({ onClick }) => {
  const [analisando, setAnalisando] = useState(false);

  const handleClick = async () => {
    setAnalisando(true);
    await onClick();
    setAnalisando(false);
  };

  return (
    <button onClick={handleClick} disabled={analisando}>
      {analisando ? 'Analisando...' : '▶ Analisar'}
    </button>
  );
};

export default BotaoAnalise;