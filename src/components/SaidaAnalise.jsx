import React, { useState } from 'react';

const SaidaAnalise = ({ tokens, erros, tabelaSimbolos, codigoIntermediario }) => {
  const [abaAtiva, setAbaAtiva] = useState('tokens');

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
          className={abaAtiva === 'codigoOriginal' ? 'active' : ''}
          onClick={() => setAbaAtiva('codigoOriginal')}
        >
          Código Intermediário {codigoIntermediario?.codigoOriginal?.length > 0 && 
            <span className="badge">{codigoIntermediario.codigoOriginal.length}</span>}
        </button>
        <button
          className={abaAtiva === 'codigoOtimizado' ? 'active' : ''}
          onClick={() => setAbaAtiva('codigoOtimizado')}
        >
          Código Otimizado {codigoIntermediario?.codigoOtimizado?.length > 0 && 
            <span className="badge">{codigoIntermediario.codigoOtimizado.length}</span>}
          {codigoIntermediario?.otimizacoes?.realizadas > 0 && 
            <span className="badge optimization-badge">{codigoIntermediario.otimizacoes.realizadas}</span>}
        </button>
        <button
          className={abaAtiva === 'simpSIM' ? 'active' : ''}
          onClick={() => setAbaAtiva('simpSIM')}
        >
          Assembly SimpSIM {codigoIntermediario?.codigoSimpSIM?.length > 0 && 
            <span className="badge">{codigoIntermediario.codigoSimpSIM.length}</span>}
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
                    <div key={idx} className={classificarErro(err)}>
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
            {Array.isArray(tabelaSimbolos) && tabelaSimbolos.length > 0 ? (
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

        {abaAtiva === 'codigoOriginal' && (
          <div className="codigo-intermediario">
            <h3>Código Intermediário Original</h3>
            {codigoIntermediario?.codigoOriginal && codigoIntermediario.codigoOriginal.length > 0 ? (
              <pre className="codigo-container">
                {codigoIntermediario.codigoOriginal.map((linha, idx) => (
                  <div key={idx}>
                    {linha}
                  </div>
                ))}
              </pre>
            ) : (
              <p>Nenhum código intermediário gerado.</p>
            )}
          </div>
        )}

        {abaAtiva === 'codigoOtimizado' && (
          <div className="codigo-otimizado">
            <h3>Código Intermediário Otimizado</h3>
            {codigoIntermediario?.codigoOtimizado && codigoIntermediario.codigoOtimizado.length > 0 ? (
              <>
                <div className="otimizacoes-info">
                  <p>
                    <strong>Otimizações aplicadas:</strong> {codigoIntermediario.otimizacoes?.realizadas || 0}
                  </p>
                  {codigoIntermediario.otimizacoes?.realizadas > 0 && (
                    <div className="otimizacoes-detalhes">
                      <p><small>As linhas destacadas foram otimizadas</small></p>
                    </div>
                  )}
                </div>
                <pre className="codigo-container">
                  {codigoIntermediario.codigoOtimizado.map((linha, idx) => {
                    // Verificar se essa linha foi otimizada comparando com o original
                    const foiOtimizada = codigoIntermediario.codigoOriginal && 
                      idx < codigoIntermediario.codigoOriginal.length &&
                      codigoIntermediario.codigoOriginal[idx] !== linha;
                    
                    return (
                      <div 
                        key={idx} 
                        className={foiOtimizada ? "linha-otimizada" : ""}
                        title={foiOtimizada ? `Original: ${codigoIntermediario.codigoOriginal[idx]}` : ''}
                      >
                        {linha}
                      </div>
                    );
                  })}
                </pre>
              </>
            ) : (
              <p>Nenhum código otimizado gerado.</p>
            )}
          </div>
        )}

        {abaAtiva === 'simpSIM' && (
          <div className="codigo-simpsim">
            <h3>Assembly SimpSIM</h3>
            {codigoIntermediario?.codigoSimpSIM && codigoIntermediario.codigoSimpSIM.length > 0 ? (
              <>
                <div className="simpsim-info">
                  <p>
                    <strong>Código traduzido para SimpSIM Assembly</strong>
                  </p>
                  <p><small>{codigoIntermediario.informacoesTradução}</small></p>
                  {codigoIntermediario.mapeamentoVariaveis && (
                    <div className="mapeamento-variaveis">
                      <details>
                        <summary>Mapeamento de Variáveis</summary>
                        <table className="symbol-table">
                          <thead>
                            <tr>
                              <th>Variável</th>
                              <th>Registrador</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(codigoIntermediario.mapeamentoVariaveis).map(([variavel, registrador], idx) => (
                              <tr key={idx}>
                                <td>{variavel}</td>
                                <td>{registrador}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </div>
                  )}
                </div>
                <pre className="codigo-container codigo-assembly">
                  {codigoIntermediario.codigoSimpSIM.map((linha, idx) => {
                    let classeCSS = '';
                    if (linha.startsWith(';')) {
                      classeCSS = 'comentario-assembly';
                    } else if (linha.endsWith(':')) {
                      classeCSS = 'label-assembly';
                    } else if (linha.trim().startsWith('load') || linha.trim().startsWith('move') || linha.trim().startsWith('addi')) {
                      classeCSS = 'instrucao-assembly';
                    } else if (linha.trim().startsWith('jmp') || linha.trim().startsWith('jmpEQ') || linha.trim().startsWith('jmpLE')) {
                      classeCSS = 'salto-assembly';
                    } else if (linha.trim() === 'halt') {
                      classeCSS = 'halt-assembly';
                    }
                    
                    return (
                      <div key={idx} className={`linha-assembly ${classeCSS}`}>
                        {linha}
                      </div>
                    );
                  })}
                </pre>
              </>
            ) : (
              <p>Nenhum código SimpSIM gerado. Execute a análise de um código sem erros primeiro.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SaidaAnalise;