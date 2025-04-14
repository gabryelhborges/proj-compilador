import React from 'react';

const SaidaAnalise = ({ tokens, erros }) => {
  return (
    <div className="output-container">
      <div className="tokens">
        <h3>Tokens</h3>
        <pre>
          {Array.isArray(tokens) && tokens.length > 0
            ? tokens.map(t => t.toString()).join('\n')
            : 'Nenhum token gerado.'}
        </pre>
      </div>
      <div className="errors">
        <h3>Erros</h3>
        <pre>
          {Array.isArray(erros) && erros.length > 0
            ? erros.map((err, idx) => (
                <div key={idx} className={err.includes('sintático') ? 'sintatico' : 'lexico'}>
                  {err}
                </div>
              )).reduce((acc, curr) => [acc, '\n', curr])
            : 'Nenhum erro encontrado.'}
        </pre>
      </div>
    </div>
  );
};

export default SaidaAnalise;