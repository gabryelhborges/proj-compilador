import React from 'react';

const SobreposicaoCodigo = ({ refSobreposição, código, erros }) => {
  const renderizarLinhasCódigo = () => {
    const linhas = código.split('\n');
    
    // Mapear erros por número de linha
    const errosPorLinha = {};
    erros.forEach(err => {
      // Extrair o número da linha do erro
      const match = err.match(/linha\s+(\d+)/i);
      if (match && match[1]) {
        const numLinha = parseInt(match[1], 10);
        if (!errosPorLinha[numLinha]) {
          errosPorLinha[numLinha] = [];
        }
        
        // Determinar o tipo de erro
        let tipoErro = 'erro-generico';
        if (err.includes('léxico')) tipoErro = 'erro-lexico';
        else if (err.includes('sintático')) tipoErro = 'erro-sintatico';
        else if (err.includes('semântico')) tipoErro = 'erro-semantico';
        
        errosPorLinha[numLinha].push(tipoErro);
      }
    });

    return linhas.map((linha, índice) => {
      const numLinha = índice + 1;
      const tiposErro = errosPorLinha[numLinha] || [];
      
      // Determinar qual classe de erro aplicar
      let classeErro = '';
      if (tiposErro.includes('erro-lexico')) classeErro = 'linha-erro-lexico';
      else if (tiposErro.includes('erro-sintatico')) classeErro = 'linha-erro-sintatico';
      else if (tiposErro.includes('erro-semantico')) classeErro = 'linha-erro-semantico';
      
      return (
        <div 
          key={índice} 
          className={`linha-codigo ${classeErro}`}
          data-linha={numLinha}
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