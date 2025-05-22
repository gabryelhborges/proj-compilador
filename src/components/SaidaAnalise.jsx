import React, { useState } from 'react';

const SaidaAnalise = ({ tokens, erros, tabelaSimbolos, codigoIntermediario }) => {
  const [abaAtiva, setAbaAtiva] = useState('tokens');
  const [mostrarOriginal, setMostrarOriginal] = useState(false);

  // Função para classificar erros
  const classificarErro = (erro) => {
    if (erro.toLowerCase().includes('léxico')) return 'erro-lexico';
    if (erro.toLowerCase().includes('sintático')) return 'erro-sintatico';
    if (erro.toLowerCase().includes('semântico')) return 'erro-semantico';
    return 'erro-generico';
  };

  // Função para formatar valores para exibição
  const formatarValor = (valor) => {
    if (valor === null || valor === undefined) return '-';
    if (typeof valor === 'string') return `"${valor}"`;
    if (typeof valor === 'boolean') return valor ? 'verdadeiro' : 'falso';
    return String(valor);
  };

  return (
    <div className="output-container">
      <div className="tabs">
        <button
          className={abaAtiva === 'tokens' ? 'active' : ''}
          onClick={() => setAbaAtiva('tokens')}
        >
          Tokens {tokens.length > 0 && <span className="badge">{tokens.length}</span>}
        </button>
        <button
          className={abaAtiva === 'erros' ? 'active' : ''}
          onClick={() => setAbaAtiva('erros')}
        >
          Erros {erros.length > 0 && <span className="badge error-badge">{erros.length}</span>}
        </button>
        <button
          className={abaAtiva === 'simbolos' ? 'active' : ''}
          onClick={() => setAbaAtiva('simbolos')}
        >
          Tabela de Símbolos {tabelaSimbolos.length > 0 && <span className="badge">{tabelaSimbolos.length}</span>}
        </button>
        <button
          className={abaAtiva === 'codigo' ? 'active' : ''}
          onClick={() => setAbaAtiva('codigo')}
        >
          Código Intermediário {codigoIntermediario.codigo && codigoIntermediario.codigo.length > 0 && 
            <span className="badge">{codigoIntermediario.codigo.length}</span>}
        </button>
      </div>

      <div className="tab-content">
        {abaAtiva === 'tokens' && (
          <div className="tokens">
            <h3>Tokens</h3>
            <pre>
              {Array.isArray(tokens) && tokens.length > 0
                ? tokens.map((t, idx) => <div key={idx}>{t.toString()}</div>)
                : 'Nenhum token gerado.'}
            </pre>
          </div>
        )}

        {abaAtiva === 'erros' && (
          <div className="errors">
            <h3>Erros</h3>
            <div className="legenda-erros">
              <span className="erro-lexico-legenda">Erros Léxicos</span>
              <span className="erro-sintatico-legenda">Erros Sintáticos</span>
              <span className="erro-semantico-legenda">Erros Semânticos</span>
            </div>
            <pre>
              {Array.isArray(erros) && erros.length > 0
                ? erros.map((err, idx) => (
                  <div
                    key={idx}
                    className={classificarErro(err)}
                  >
                    {err}
                  </div>
                ))
                : 'Nenhum erro encontrado.'}
            </pre>
          </div>
        )}

        {abaAtiva === 'simbolos' && (
          <div className="symbols">
            <h3>Tabela de Símbolos</h3>
            {tabelaSimbolos && tabelaSimbolos.length > 0 ? (
              <table className="symbol-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Linha</th>
                    <th>Escopo</th>
                    <th>Inicializado</th>
                    <th>Usado</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelaSimbolos.map((simbolo, idx) => (
                    <tr key={idx}>
                      <td>{simbolo.nome}</td>
                      <td>{simbolo.tipo}</td>
                      <td>{simbolo.linha}</td>
                      <td>{simbolo.escopo}</td>
                      <td>{simbolo.inicializado ? '✓' : '✗'}</td>
                      <td>{simbolo.usado ? '✓' : '✗'}</td>
                      <td>{formatarValor(simbolo.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Nenhum símbolo encontrado.</p>
            )}
          </div>
        )}

        {abaAtiva === 'codigo' && (
          <div className="codigo-intermediario">
            <h3>Código Intermediário (Representação de Três Endereços)</h3>
            {codigoIntermediario && codigoIntermediario.codigo && (
              <>
                <div className="otimizacoes-info">
                  <p>
                    Otimizações aplicadas: {codigoIntermediario.otimizacoes.realizadas}
                    <button 
                      className="btn-toggle-original"
                      onClick={() => setMostrarOriginal(!mostrarOriginal)}>
                      {mostrarOriginal ? 'Ocultar Código Original' : 'Mostrar Código Original'}
                    </button>
                  </p>
                </div>
                <pre className="codigo-container">
                  {mostrarOriginal ? (
                    // Exibir comparação entre original e otimizado
                    codigoIntermediario.codigo.map((linha, idx) => {
                      const original = codigoIntermediario.otimizacoes.originais[idx];
                      return (
                        <div key={idx} className={original ? "linha-otimizada" : ""}>
                          {original ? (
                            <>
                              <span className="linha-original">{original}</span>
                              <span className="seta-otimizacao">→</span> 
                              <span className="linha-nova">{linha}</span>
                            </>
                          ) : (
                            linha
                          )}
                        </div>
                      );
                    })
                  ) : (
                    // Exibir apenas código otimizado
                    codigoIntermediario.codigo.map((linha, idx) => (
                      <div 
                        key={idx} 
                        className={codigoIntermediario.otimizacoes.originais[idx] ? "linha-otimizada" : ""}
                      >
                        {linha}
                      </div>
                    ))
                  )}
                </pre>
              </>
            )}
            {(!codigoIntermediario || !codigoIntermediario.codigo || codigoIntermediario.codigo.length === 0) && (
              <p>Nenhum código intermediário gerado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SaidaAnalise;