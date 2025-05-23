export function otimizarCodigo(codigoIntermediario) {
  if (!Array.isArray(codigoIntermediario) || codigoIntermediario.length === 0) {
    return {
      codigo: [],
      otimizacoesRealizadas: 0,
      otimizacoesOriginais: {}
    };
  }

  let codigo = [...codigoIntermediario];
  const otimizacoesOriginais = {};
  let totalOtimizacoes = 0;

  // Aplicar otimizações múltiplas vezes até não haver mais mudanças
  let houveMudanca = true;
  let iteracoes = 0;
  const maxIteracoes = 10; // Evitar loop infinito

  while (houveMudanca && iteracoes < maxIteracoes) {
    houveMudanca = false;
    iteracoes++;

    // 1. Eliminação de subexpressões comuns
    const resultado1 = eliminarSubexpressoesComuns(codigo);
    if (resultado1.otimizacoes > 0) {
      houveMudanca = true;
      totalOtimizacoes += resultado1.otimizacoes;
      Object.assign(otimizacoesOriginais, resultado1.originais);
      codigo = resultado1.codigo;
    }

    // 2. Propagação de cópias
    const resultado2 = propagarCopias(codigo);
    if (resultado2.otimizacoes > 0) {
      houveMudanca = true;
      totalOtimizacoes += resultado2.otimizacoes;
      Object.assign(otimizacoesOriginais, resultado2.originais);
      codigo = resultado2.codigo;
    }

    // 3. Eliminação de código redundante
    const resultado3 = eliminarCodigoRedundante(codigo);
    if (resultado3.otimizacoes > 0) {
      houveMudanca = true;
      totalOtimizacoes += resultado3.otimizacoes;
      Object.assign(otimizacoesOriginais, resultado3.originais);
      codigo = resultado3.codigo;
    }

    // 4. Uso de propriedades algébricas
    const resultado4 = aplicarPropriedadesAlgebricas(codigo);
    if (resultado4.otimizacoes > 0) {
      houveMudanca = true;
      totalOtimizacoes += resultado4.otimizacoes;
      Object.assign(otimizacoesOriginais, resultado4.originais);
      codigo = resultado4.codigo;
    }

    // 5. Eliminação de desvios desnecessários
    const resultado5 = eliminarDesviosDesnecessarios(codigo);
    if (resultado5.otimizacoes > 0) {
      houveMudanca = true;
      totalOtimizacoes += resultado5.otimizacoes;
      Object.assign(otimizacoesOriginais, resultado5.originais);
      codigo = resultado5.codigo;
    }
  }

  return {
    codigo: codigo,
    otimizacoesRealizadas: totalOtimizacoes,
    otimizacoesOriginais: otimizacoesOriginais
  };
}

// 1. Eliminação de Subexpressões Comuns
function eliminarSubexpressoesComuns(codigo) {
  const novodoCodigo = [...codigo];
  const otimizacoesOriginais = {};
  let otimizacoes = 0;

  const expressoes = new Map(); // expressão -> primeira variável que a calculou
  const variaveisModificadas = new Set();

  for (let i = 0; i < novodoCodigo.length; i++) {
    const linha = novodoCodigo[i].trim();
    if (!linha || linha.startsWith(';') || linha.endsWith(':')) continue;

    // Detectar atribuições aritméticas binárias: x := a op b
    const matchBinario = linha.match(/^(\w+)\s*:=\s*(\w+)\s*([\+\-\*\/])\s*(\w+)$/);
    if (matchBinario) {
      const [, variavel, operando1, operador, operando2] = matchBinario;
      const expressao = `${operando1} ${operador} ${operando2}`;
      
      // Verificar se a expressão já foi calculada e os operandos não foram modificados
      if (expressoes.has(expressao) && 
          !variaveisModificadas.has(operando1) && 
          !variaveisModificadas.has(operando2)) {
        
        const variavelOriginal = expressoes.get(expressao);
        otimizacoesOriginais[i] = linha;
        novodoCodigo[i] = `${variavel} := ${variavelOriginal}`;
        otimizacoes++;
      } else {
        expressoes.set(expressao, variavel);
      }
      
      variaveisModificadas.add(variavel);
      continue;
    }

    // Detectar atribuições que modificam variáveis
    const matchAtribuicao = linha.match(/^(\w+)\s*:=/);
    if (matchAtribuicao) {
      const [, variavel] = matchAtribuicao;
      variaveisModificadas.add(variavel);
      
      // Limpar expressões que usam esta variável
      for (const [expr, var_] of expressoes.entries()) {
        if (expr.includes(variavel)) {
          expressoes.delete(expr);
        }
      }
    }
  }

  return { codigo: novodoCodigo, otimizacoes, originais: otimizacoesOriginais };
}

// 2. Propagação de Cópias
function propagarCopias(codigo) {
  const novodoCodigo = [...codigo];
  const otimizacoesOriginais = {};
  let otimizacoes = 0;

  const copias = new Map(); // variavel -> valor copiado
  const usosVariaveis = new Map(); // variavel -> número de usos

  // Primeira passada: contar usos de variáveis
  for (const linha of codigo) {
    const variaveisUsadas = extrairVariaveisUsadas(linha);
    variaveisUsadas.forEach(v => {
      usosVariaveis.set(v, (usosVariaveis.get(v) || 0) + 1);
    });
  }

  for (let i = 0; i < novodoCodigo.length; i++) {
    const linha = novodoCodigo[i].trim();
    if (!linha || linha.startsWith(';') || linha.endsWith(':')) continue;

    // Detectar cópias simples: x := y
    const matchCopia = linha.match(/^(\w+)\s*:=\s*(\w+)$/);
    if (matchCopia) {
      const [, variavel, valor] = matchCopia;
      
      // Verificar se a variável é usada apenas uma vez (pode ser eliminada)
      if (usosVariaveis.get(variavel) === 1) {
        copias.set(variavel, valor);
        // Marcar linha para remoção
        otimizacoesOriginais[i] = linha;
        novodoCodigo[i] = ''; // Linha vazia será removida depois
        otimizacoes++;
      } else {
        copias.set(variavel, valor);
      }
      continue;
    }

    // Substituir variáveis por suas cópias em outras instruções
    let linhaModificada = linha;
    let houveMudancaNaLinha = false;

    for (const [variavel, valor] of copias.entries()) {
      const regex = new RegExp(`\\b${variavel}\\b`, 'g');
      if (regex.test(linhaModificada)) {
        const novaLinha = linhaModificada.replace(regex, valor);
        if (novaLinha !== linhaModificada) {
          if (!houveMudancaNaLinha) {
            otimizacoesOriginais[i] = linha;
            houveMudancaNaLinha = true;
            otimizacoes++;
          }
          linhaModificada = novaLinha;
        }
      }
    }

    if (houveMudancaNaLinha) {
      novodoCodigo[i] = linhaModificada;
    }

    // Invalidar cópias se a variável for modificada
    const matchAtribuicao = linha.match(/^(\w+)\s*:=/);
    if (matchAtribuicao) {
      const [, variavel] = matchAtribuicao;
      copias.delete(variavel);
    }
  }

  // Remover linhas vazias
  const codigoFiltrado = novodoCodigo.filter(linha => linha.trim() !== '');

  return { codigo: codigoFiltrado, otimizacoes, originais: otimizacoesOriginais };
}

// 3. Eliminação de Código Redundante
function eliminarCodigoRedundante(codigo) {
  const novodoCodigo = [...codigo];
  const otimizacoesOriginais = {};
  let otimizacoes = 0;

  const ultimasAtribuicoes = new Map(); // variavel -> última atribuição

  for (let i = 0; i < novodoCodigo.length; i++) {
    const linha = novodoCodigo[i].trim();
    if (!linha || linha.startsWith(';') || linha.endsWith(':')) continue;

    const matchAtribuicao = linha.match(/^(\w+)\s*:=\s*(.+)$/);
    if (matchAtribuicao) {
      const [, variavel, expressao] = matchAtribuicao;
      
      // Verificar se é uma atribuição idêntica à anterior
      if (ultimasAtribuicoes.has(variavel) && 
          ultimasAtribuicoes.get(variavel) === expressao) {
        otimizacoesOriginais[i] = linha;
        novodoCodigo[i] = ''; // Marcar para remoção
        otimizacoes++;
      } else {
        ultimasAtribuicoes.set(variavel, expressao);
      }
    } else {
      // Limpar cache se não for atribuição (pode afetar variáveis)
      ultimasAtribuicoes.clear();
    }
  }

  // Remover linhas vazias
  const codigoFiltrado = novodoCodigo.filter(linha => linha.trim() !== '');

  return { codigo: codigoFiltrado, otimizacoes, originais: otimizacoesOriginais };
}

// 4. Uso de Propriedades Algébricas
function aplicarPropriedadesAlgebricas(codigo) {
  const novodoCodigo = [...codigo];
  const otimizacoesOriginais = {};
  let otimizacoes = 0;

  for (let i = 0; i < novodoCodigo.length; i++) {
    const linha = novodoCodigo[i].trim();
    if (!linha || linha.startsWith(';') || linha.endsWith(':')) continue;

    // Detectar expressões aritméticas
    const matchBinario = linha.match(/^(\w+)\s*:=\s*(\w+|\d+)\s*([\+\-\*\/])\s*(\w+|\d+)$/);
    if (matchBinario) {
      const [, variavel, operando1, operador, operando2] = matchBinario;
      let novaLinha = null;

      // Aplicar propriedades algébricas
      switch (operador) {
        case '+':
          if (operando2 === '0') {
            novaLinha = `${variavel} := ${operando1}`;
          } else if (operando1 === '0') {
            novaLinha = `${variavel} := ${operando2}`;
          }
          break;
        case '-':
          if (operando2 === '0') {
            novaLinha = `${variavel} := ${operando1}`;
          }
          break;
        case '*':
          if (operando2 === '1') {
            novaLinha = `${variavel} := ${operando1}`;
          } else if (operando1 === '1') {
            novaLinha = `${variavel} := ${operando2}`;
          } else if (operando2 === '0' || operando1 === '0') {
            novaLinha = `${variavel} := 0`;
          }
          break;
        case '/':
          if (operando2 === '1') {
            novaLinha = `${variavel} := ${operando1}`;
          }
          break;
      }

      if (novaLinha && novaLinha !== linha) {
        otimizacoesOriginais[i] = linha;
        novodoCodigo[i] = novaLinha;
        otimizacoes++;
      }
    }
  }

  return { codigo: novodoCodigo, otimizacoes, originais: otimizacoesOriginais };
}

// 5. Eliminação de Desvios Desnecessários
function eliminarDesviosDesnecessarios(codigo) {
  const novodoCodigo = [...codigo];
  const otimizacoesOriginais = {};
  let otimizacoes = 0;

  for (let i = 0; i < novodoCodigo.length - 1; i++) {
    const linha = novodoCodigo[i].trim();
    const proximaLinha = novodoCodigo[i + 1].trim();

    // Detectar goto seguido do label correspondente
    const matchGoto = linha.match(/^goto\s+(\w+)$/);
    if (matchGoto) {
      const [, label] = matchGoto;
      
      // Verificar se a próxima linha é o label
      if (proximaLinha === `${label}:`) {
        otimizacoesOriginais[i] = linha;
        otimizacoesOriginais[i + 1] = proximaLinha;
        novodoCodigo[i] = '';
        novodoCodigo[i + 1] = '';
        otimizacoes += 2;
        i++; // Pular a próxima linha já processada
      }
    }
  }

  // Remover labels órfãos (não referenciados)
  const labelsUsados = new Set();
  
  // Primeira passada: encontrar labels referenciados
  for (const linha of novodoCodigo) {
    const matchGoto = linha.match(/goto\s+(\w+)/);
    if (matchGoto) {
      labelsUsados.add(matchGoto[1]);
    }
    const matchIf = linha.match(/if\s+.+\s+goto\s+(\w+)/);
    if (matchIf) {
      labelsUsados.add(matchIf[1]);
    }
  }

  // Segunda passada: remover labels não usados
  for (let i = 0; i < novodoCodigo.length; i++) {
    const linha = novodoCodigo[i].trim();
    const matchLabel = linha.match(/^(\w+):$/);
    if (matchLabel) {
      const [, label] = matchLabel;
      if (!labelsUsados.has(label)) {
        otimizacoesOriginais[i] = linha;
        novodoCodigo[i] = '';
        otimizacoes++;
      }
    }
  }

  // Remover linhas vazias
  const codigoFiltrado = novodoCodigo.filter(linha => linha.trim() !== '');

  return { codigo: codigoFiltrado, otimizacoes, originais: otimizacoesOriginais };
}

// Funções auxiliares
function extrairVariaveisUsadas(linha) {
  const variaveis = new Set();
  
  // Remover comentários e labels
  if (linha.startsWith(';') || linha.endsWith(':')) {
    return variaveis;
  }

  // Extrair variáveis (palavras que começam com letra)
  const matches = linha.match(/\b[a-zA-Z_]\w*\b/g);
  if (matches) {
    matches.forEach(match => {
      // Excluir palavras-chave
      if (!/^(if|goto|call|return)$/.test(match)) {
        variaveis.add(match);
      }
    });
  }

  return variaveis;
}
