import React from 'react';

const SobreposicaoCodigo = ({ refSobreposição, código, erros }) => {
  const renderizarLinhasCódigo = () => {
    const linhas = código.split('\n');
    return linhas.map((linha, índice) => {
      const temErro = erros.some(err => err.includes(`Linha ${índice + 1}`));
      return (
        <div 
          key={índice} 
          className={`code-line ${temErro ? 'error-line' : ''}`}
        >
          {linha || ' '}
        </div>
      );
    });
  };

  return (
    <div className="code-overlay" ref={refSobreposição}>
      {renderizarLinhasCódigo()}
    </div>
  );
};

export default SobreposicaoCodigo;