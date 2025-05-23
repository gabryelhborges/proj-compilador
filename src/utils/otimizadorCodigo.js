export function otimizarCodigo(codigoIntermediario) {
  if (!Array.isArray(codigoIntermediario) || codigoIntermediario.length === 0) {
    return {
      codigo: [],
      otimizacoesRealizadas: 0,
      otimizacoesOriginais: {}
    };
  }

  let codigo = [...codigoIntermediario];
  let otimizacoesRealizadas = 0;
  let otimizacoesOriginais = {};
  let mudancasFeitas = true;

  // Aplicar otimizações até que não haja mais mudanças
  while (mudancasFeitas) {
    mudancasFeitas = false;
    const resultadoAnterior = codigo.length;

    // 1. Eliminação de Subexpressões Comuns
    const subexpressoesResult = eliminarSubexpressoesComuns(codigo);
    codigo = subexpressoesResult.codigo;
    if (subexpressoesResult.otimizacoes > 0) {
      mudancasFeitas = true;
      otimizacoesRealizadas += subexpressoesResult.otimizacoes;
      Object.assign(otimizacoesOriginais, subexpressoesResult.originais);
    }

    // 2. Eliminação de Código Redundante
    const redundanteResult = eliminarCodigoRedundante(codigo);
    codigo = redundanteResult.codigo;
    if (redundanteResult.otimizacoes > 0) {
      mudancasFeitas = true;
      otimizacoesRealizadas += redundanteResult.otimizacoes;
      Object.assign(otimizacoesOriginais, redundanteResult.originais);
    }

    // 3. Propagação de Cópias
    const propagacaoResult = propagarCopias(codigo);
    codigo = propagacaoResult.codigo;
    if (propagacaoResult.otimizacoes > 0) {
      mudancasFeitas = true;
      otimizacoesRealizadas += propagacaoResult.otimizacoes;
      Object.assign(otimizacoesOriginais, propagacaoResult.originais);
    }

    // 4. Eliminação de Saltos Desnecessários
    const saltosResult = eliminarSaltosUnnecessarios(codigo);
    codigo = saltosResult.codigo;
    if (saltosResult.otimizacoes > 0) {
      mudancasFeitas = true;
      otimizacoesRealizadas += saltosResult.otimizacoes;
      Object.assign(otimizacoesOriginais, saltosResult.originais);
    }

    // 5. Aplicação de Propriedades Algébricas
    const algebricasResult = aplicarPropriedadesAlgebricas(codigo);
    codigo = algebricasResult.codigo;
    if (algebricasResult.otimizacoes > 0) {
      mudancasFeitas = true;
      otimizacoesRealizadas += algebricasResult.otimizacoes;
      Object.assign(otimizacoesOriginais, algebricasResult.originais);
    }

    // 6. Movimentação de Código Invariante em Laços
    const invarianteResult = moverCodigoInvarianteLacos(codigo);
    codigo = invarianteResult.codigo;
    if (invarianteResult.otimizacoes > 0) {
      mudancasFeitas = true;
      otimizacoesRealizadas += invarianteResult.otimizacoes;
      Object.assign(otimizacoesOriginais, invarianteResult.originais);
    }

    // 7. Eliminação de Código Morto
    const mortoResult = eliminarCodigoMorto(codigo);
    codigo = mortoResult.codigo;
    if (mortoResult.otimizacoes > 0) {
      mudancasFeitas = true;
      otimizacoesRealizadas += mortoResult.otimizacoes;
      Object.assign(otimizacoesOriginais, mortoResult.originais);
    }

    // Verifica se houve mudanças significativas
    if (codigo.length === resultadoAnterior && !mudancasFeitas) {
      break;
    }
  }

  return {
    codigo,
    otimizacoesRealizadas,
    otimizacoesOriginais
  };
}

// 1. Eliminação de Subexpressões Comuns
function eliminarSubexpressoesComuns(codigo) {
  const novocodigo = [];
  const expressoesDisponiveis = new Map(); // expressão -> variável temporária
  let otimizacoes = 0;
  let originais = {};

  for (let i = 0; i < codigo.length; i++) {
    const linha = codigo[i];
    
    // Analisa atribuições da forma: variavel := expressao
    const matchAtribuicao = linha.match(/^(\w+)\s*:=\s*(.+)$/);
    if (matchAtribuicao) {
      const [, variavel, expressao] = matchAtribuicao;
      
      // Verifica se é uma expressão aritmética simples (a op b)
      const matchExpressao = expressao.match(/^(\w+)\s*([\+\-\*\/])\s*(\w+)$/);
      if (matchExpressao) {
        const [, operando1, operador, operando2] = matchExpressao;
        const chaveExpressao = `${operando1}${operador}${operando2}`;
        
        // Verifica se a expressão já foi calculada anteriormente
        if (expressoesDisponiveis.has(chaveExpressao)) {
          const variavelAnterior = expressoesDisponiveis.get(chaveExpressao);
          // Substitui pela variável que já contém o resultado
          const novaLinha = `${variavel} := ${variavelAnterior}`;
          novocodigo.push(novaLinha);
          
          originais[novocodigo.length - 1] = linha;
          otimizacoes++;
        } else {
          // Primeira ocorrência da expressão
          expressoesDisponiveis.set(chaveExpressao, variavel);
          novocodigo.push(linha);
        }
      } else {
        novocodigo.push(linha);
        // Remove expressões que usam a variável sendo atribuída
        for (const [expr, varTemp] of expressoesDisponiveis.entries()) {
          if (expr.includes(variavel)) {
            expressoesDisponiveis.delete(expr);
          }
        }
      }
    } else {
      novocodigo.push(linha);
      
      // Para outros tipos de instruções, limpa expressões que podem ser afetadas
      const variavelAfetada = extrairVariavelAfetada(linha);
      if (variavelAfetada) {
        for (const [expr, varTemp] of expressoesDisponiveis.entries()) {
          if (expr.includes(variavelAfetada)) {
            expressoesDisponiveis.delete(expr);
          }
        }
      }
    }
  }

  return { codigo: novocodigo, otimizacoes, originais };
}

// 2. Eliminação de Código Redundante
function eliminarCodigoRedundante(codigo) {
  const novocodigo = [];
  let otimizacoes = 0;
  let originais = {};
  let ultimaInstrucao = null;

  for (let i = 0; i < codigo.length; i++) {
    const linha = codigo[i];
    
    // Verifica se a linha atual é idêntica à anterior
    if (linha === ultimaInstrucao) {
      // Instrução redundante - pula
      otimizacoes++;
      continue;
    }
    
    // Verifica atribuições do tipo x := x (que são inúteis)
    const matchAutoAtribuicao = linha.match(/^(\w+)\s*:=\s*(\w+)$/);
    if (matchAutoAtribuicao) {
      const [, varEsquerda, varDireita] = matchAutoAtribuicao;
      if (varEsquerda === varDireita) {
        // Atribuição redundante (x := x)
        otimizacoes++;
        continue;
      }
    }
    
    novocodigo.push(linha);
    ultimaInstrucao = linha;
  }

  return { codigo: novocodigo, otimizacoes, originais };
}

// 3. Propagação de Cópias
function propagarCopias(codigo) {
  const novocodigo = [];
  const copias = new Map(); // variavel -> valor_copiado
  let otimizacoes = 0;
  let originais = {};

  for (let i = 0; i < codigo.length; i++) {
    let linha = codigo[i];
    
    // Detecta cópias simples (x := y)
    const matchCopia = linha.match(/^(\w+)\s*:=\s*(\w+)$/);
    if (matchCopia) {
      const [, destino, origem] = matchCopia;
      
      // Se origem também é uma cópia, propaga transitivamente
      const origemReal = copias.get(origem) || origem;
      copias.set(destino, origemReal);
      novocodigo.push(linha);
    } else {
      // Propaga cópias em outras expressões
      let linhaOriginal = linha;
      for (const [variavel, valor] of copias.entries()) {
        // Substitui usos da variável copiada pelo valor original
        const regex = new RegExp(`\\b${variavel}\\b`, 'g');
        linha = linha.replace(regex, valor);
      }
      
      if (linha !== linhaOriginal) {
        originais[novocodigo.length] = linhaOriginal;
        otimizacoes++;
      }
      
      novocodigo.push(linha);
      
      // Remove cópias que são invalidadas por esta instrução
      const variavelAfetada = extrairVariavelAfetada(linha);
      if (variavelAfetada) {
        copias.delete(variavelAfetada);
        // Remove também cópias que dependem desta variável
        for (const [copia, origem] of copias.entries()) {
          if (origem === variavelAfetada) {
            copias.delete(copia);
          }
        }
      }
    }
  }

  return { codigo: novocodigo, otimizacoes, originais };
}

// 4. Eliminação de Saltos Desnecessários
function eliminarSaltosUnnecessarios(codigo) {
  const novocodigo = [];
  let otimizacoes = 0;
  let originais = {};

  for (let i = 0; i < codigo.length; i++) {
    const linha = codigo[i];
    
    // Detecta goto seguido imediatamente pelo label de destino
    if (linha.startsWith('goto ') && i + 1 < codigo.length) {
      const label = linha.substring(5).trim();
      const proximaLinha = codigo[i + 1];
      
      if (proximaLinha === `${label}:`) {
        // Salto desnecessário - pula a instrução goto
        originais[novocodigo.length] = linha;
        otimizacoes++;
        continue;
      }
    }
    
    novocodigo.push(linha);
  }

  return { codigo: novocodigo, otimizacoes, originais };
}

// 5. Aplicação de Propriedades Algébricas
function aplicarPropriedadesAlgebricas(codigo) {
  const novocodigo = [];
  let otimizacoes = 0;
  let originais = {};

  for (let i = 0; i < codigo.length; i++) {
    let linha = codigo[i];
    const linhaOriginal = linha;
    
    // Aplica simplificações algébricas
    const matchAtribuicao = linha.match(/^(\w+)\s*:=\s*(.+)$/);
    if (matchAtribuicao) {
      const [, variavel, expressao] = matchAtribuicao;
      let novaExpressao = expressao;
      
      // x + 0 = x
      novaExpressao = novaExpressao.replace(/(\w+)\s*\+\s*0\b/g, '$1');
      novaExpressao = novaExpressao.replace(/\b0\s*\+\s*(\w+)/g, '$1');
      
      // x - 0 = x
      novaExpressao = novaExpressao.replace(/(\w+)\s*-\s*0\b/g, '$1');
      
      // x * 1 = x
      novaExpressao = novaExpressao.replace(/(\w+)\s*\*\s*1\b/g, '$1');
      novaExpressao = novaExpressao.replace(/\b1\s*\*\s*(\w+)/g, '$1');
      
      // x * 0 = 0
      novaExpressao = novaExpressao.replace(/(\w+)\s*\*\s*0\b/g, '0');
      novaExpressao = novaExpressao.replace(/\b0\s*\*\s*(\w+)/g, '0');
      
      // x / 1 = x
      novaExpressao = novaExpressao.replace(/(\w+)\s*\/\s*1\b/g, '$1');
      
      // Se a expressão mudou, aplica a otimização
      if (novaExpressao !== expressao) {
        linha = `${variavel} := ${novaExpressao}`;
        originais[novocodigo.length] = linhaOriginal;
        otimizacoes++;
      }
    }
    
    novocodigo.push(linha);
  }

  return { codigo: novocodigo, otimizacoes, originais };
}

// 6. Movimentação de Código Invariante em Laços
function moverCodigoInvarianteLacos(codigo) {
  const novocodigo = [];
  let otimizacoes = 0;
  let originais = {};
  
  // Identifica estruturas de laço
  for (let i = 0; i < codigo.length; i++) {
    const linha = codigo[i];
    
    // Detecta início de laço while
    if (linha.endsWith(':') && linha.startsWith('L') && 
        i + 1 < codigo.length && codigo[i + 1].includes('goto')) {
      
      const labelInicio = linha.slice(0, -1);
      let fimLaco = -1;
      let variaveisModificadas = new Set();
      let instrucoesLaco = [];
      
      // Encontra o fim do laço e coleta informações
      for (let j = i + 1; j < codigo.length; j++) {
        if (codigo[j] === `goto ${labelInicio}`) {
          fimLaco = j;
          break;
        }
        instrucoesLaco.push({ indice: j, linha: codigo[j] });
        
        // Identifica variáveis modificadas no laço
        const varModificada = extrairVariavelAfetada(codigo[j]);
        if (varModificada) {
          variaveisModificadas.add(varModificada);
        }
      }
      
      if (fimLaco > 0) {
        // Identifica instruções invariantes
        const instrucoesInvariantes = [];
        for (const instrucao of instrucoesLaco) {
          if (isInstrucaoInvariante(instrucao.linha, variaveisModificadas)) {
            instrucoesInvariantes.push(instrucao);
          }
        }
        
        // Move instruções invariantes para antes do laço
        if (instrucoesInvariantes.length > 0) {
          // Adiciona instruções anteriores ao laço
          for (let k = 0; k < i; k++) {
            novocodigo.push(codigo[k]);
          }
          
          // Adiciona instruções invariantes movidas
          for (const instrucao of instrucoesInvariantes) {
            novocodigo.push(instrucao.linha);
            originais[novocodigo.length - 1] = `// Movido do laço: ${instrucao.linha}`;
            otimizacoes++;
          }
          
          // Adiciona o label do laço
          novocodigo.push(linha);
          
          // Adiciona instruções não-invariantes do laço
          for (const instrucao of instrucoesLaco) {
            if (!instrucoesInvariantes.includes(instrucao)) {
              novocodigo.push(instrucao.linha);
            }
          }
          
          // Adiciona instruções após o laço
          for (let k = fimLaco + 1; k < codigo.length; k++) {
            novocodigo.push(codigo[k]);
          }
          
          return { codigo: novocodigo, otimizacoes, originais };
        }
      }
    }
    
    novocodigo.push(linha);
  }

  return { codigo: novocodigo, otimizacoes, originais };
}

// 7. Eliminação de Código Morto
function eliminarCodigoMorto(codigo) {
  const novocodigo = [];
  let otimizacoes = 0;
  let originais = {};
  
  // Primeira passada: identifica variáveis usadas
  const variaveisUsadas = new Set();
  const variaveisDefinidas = new Map(); // variavel -> linha de definição
  
  for (let i = 0; i < codigo.length; i++) {
    const linha = codigo[i];
    
    // Identifica usos de variáveis (lado direito de atribuições, condições, etc.)
    const usos = extrairVariaveisUsadas(linha);
    usos.forEach(v => variaveisUsadas.add(v));
    
    // Identifica definições de variáveis
    const varDefinida = extrairVariavelAfetada(linha);
    if (varDefinida && linha.includes(':=')) {
      variaveisDefinidas.set(varDefinida, i);
    }
  }
  
  // Segunda passada: remove definições de variáveis não usadas
  for (let i = 0; i < codigo.length; i++) {
    const linha = codigo[i];
    
    // Verifica se é uma atribuição para variável não usada
    const matchAtribuicao = linha.match(/^(\w+)\s*:=\s*(.+)$/);
    if (matchAtribuicao) {
      const [, variavel, expressao] = matchAtribuicao;
      
      // Se a variável nunca é usada e não é uma chamada de função
      if (!variaveisUsadas.has(variavel) && !expressao.includes('call')) {
        originais[novocodigo.length] = linha;
        otimizacoes++;
        continue; // Pula esta instrução (código morto)
      }
    }
    
    // Remove blocos condicionais sempre falsos
    if (linha.includes('if ') && linha.includes('== 0 goto')) {
      const condicao = extrairCondicao(linha);
      if (isCondicaoSempreFalsa(condicao)) {
        // Remove a instrução condicional
        originais[novocodigo.length] = linha;
        otimizacoes++;
        continue;
      }
    }
    
    novocodigo.push(linha);
  }

  return { codigo: novocodigo, otimizacoes, originais };
}

// Funções auxiliares

function extrairVariavelAfetada(linha) {
  const matchAtribuicao = linha.match(/^(\w+)\s*:=/);
  return matchAtribuicao ? matchAtribuicao[1] : null;
}

function extrairVariaveisUsadas(linha) {
  const variaveis = new Set();
  
  // Não inclui a variável sendo atribuída (lado esquerdo)
  const partes = linha.split(':=');
  const ladoDireito = partes.length > 1 ? partes[1] : linha;
  
  // Extrai identificadores do lado direito
  const matches = ladoDireito.match(/\b[a-zA-Z_]\w*\b/g);
  if (matches) {
    matches.forEach(match => {
      // Filtra palavras-chave e operadores
      if (!/^(if|goto|call|return)$/.test(match)) {
        variaveis.add(match);
      }
    });
  }
  
  return Array.from(variaveis);
}

function isInstrucaoInvariante(linha, variaveisModificadas) {
  const matchAtribuicao = linha.match(/^(\w+)\s*:=\s*(.+)$/);
  if (!matchAtribuicao) return false;
  
  const [, variavel, expressao] = matchAtribuicao;
  
  // Se a variável sendo atribuída é modificada no laço, não é invariante
  if (variaveisModificadas.has(variavel)) return false;
  
  // Se a expressão usa variáveis modificadas no laço, não é invariante
  const variaveisUsadas = extrairVariaveisUsadas(expressao);
  for (const varUsada of variaveisUsadas) {
    if (variaveisModificadas.has(varUsada)) {
      return false;
    }
  }
  
  return true;
}

function extrairCondicao(linha) {
  const match = linha.match(/if\s+(.+?)\s+(==|!=|<|>|<=|>=)\s+(.+?)\s+goto/);
  return match ? { esquerda: match[1], operador: match[2], direita: match[3] } : null;
}

function isCondicaoSempreFalsa(condicao) {
  if (!condicao) return false;
  
  // Verifica condições obviamente falsas
  const { esquerda, operador, direita } = condicao;
  
  // Casos como "x == 0" quando sabemos que x nunca é 0
  // ou comparações entre constantes
  if (/^\d+$/.test(esquerda) && /^\d+$/.test(direita)) {
    const numEsq = parseInt(esquerda);
    const numDir = parseInt(direita);
    
    switch (operador) {
      case '==': return numEsq !== numDir;
      case '!=': return numEsq === numDir;
      case '<': return numEsq >= numDir;
      case '>': return numEsq <= numDir;
      case '<=': return numEsq > numDir;
      case '>=': return numEsq < numDir;
    }
  }
  
  return false;
}