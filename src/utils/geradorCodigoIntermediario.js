export function gerarCodigoIntermediario(tokens, tabelaSimbolos) {
  const codigoIntermediario = [];
  let tempCount = 1; // Contador para variáveis temporárias (t1, t2, ...)
  let labelCount = 1; // Contador para rótulos (L1, L2, ...)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // **Declaração de Variável com Inicialização**
    if (token.tipo === 't_variavel') {
      i++; // Pula 'variavel'
      const variavel = tokens[i].lexema; // Nome da variável
      i += 2; // Pula ':' e tipo
      if (tokens[i].tipo === 't_atribuicao') {
        i++; // Pula '='
        const valor = tokens[i].lexema; // Valor literal
        codigoIntermediario.push(`${variavel} := ${valor}`);
      }
      i++; // Pula ';'
    }

    // **Atribuição**
    else if (token.tipo === 't_identificador' && tokens[i + 1]?.tipo === 't_atribuicao') {
      const variavel = token.lexema;
      i += 2; // Pula o '='
      const { instrucao, novoIndice, resultado } = processarExpressao(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...instrucao);
      codigoIntermediario.push(`${variavel} := ${resultado}`);
      tempCount++;
      i = novoIndice;
    }

    // **Estrutura if**
    else if (token.tipo === 't_se') {
      i++; // Pula o 'se'
      const { condicao, novoIndice } = processarCondicao(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...condicao);
      const labelElse = `L${labelCount++}`;
      const labelEnd = `L${labelCount++}`;
      codigoIntermediario.push(`if ${condicao[condicao.length - 1].split(' := ')[0]} == 0 goto ${labelElse}`);
      i = novoIndice;
      const { bloco, novoIndice: novoIndiceBloco } = processarBloco(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...bloco);
      codigoIntermediario.push(`goto ${labelEnd}`);
      codigoIntermediario.push(`${labelElse}:`);
      i = novoIndiceBloco;
      if (tokens[i]?.tipo === 't_senao') {
        i++; // Pula o 'senao'
        const { blocoElse, novoIndiceElse } = processarBloco(i, tokens, tabelaSimbolos, tempCount);
        codigoIntermediario.push(...blocoElse);
        i = novoIndiceElse;
      }
      codigoIntermediario.push(`${labelEnd}:`);
    }

    // **Estrutura while**
    else if (token.tipo === 't_enquanto') {
      i++; // Pula o 'enquanto'
      const labelInicio = `L${labelCount++}`;
      const labelFim = `L${labelCount++}`;
      codigoIntermediario.push(`${labelInicio}:`);
      const { condicao, novoIndice } = processarCondicao(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...condicao);
      codigoIntermediario.push(`if ${condicao[condicao.length - 1].split(' := ')[0]} == 0 goto ${labelFim}`);
      i = novoIndice;
      const { bloco, novoIndiceBloco } = processarBloco(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...bloco);
      codigoIntermediario.push(`goto ${labelInicio}`);
      codigoIntermediario.push(`${labelFim}:`);
      i = novoIndiceBloco;
    }

    // **Estrutura for**
    else if (token.tipo === 't_para') {
      i++; // Pula o 'para'
      const { inicializacao, novoIndiceInit } = processarInicializacao(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...inicializacao);
      i = novoIndiceInit;
      const labelInicio = `L${labelCount++}`;
      const labelFim = `L${labelCount++}`;
      codigoIntermediario.push(`${labelInicio}:`);
      const { condicao, novoIndiceCond } = processarCondicao(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...condicao);
      codigoIntermediario.push(`if ${condicao[condicao.length - 1].split(' := ')[0]} == 0 goto ${labelFim}`);
      i = novoIndiceCond;
      const { bloco, novoIndiceBloco } = processarBloco(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...bloco);
      i = novoIndiceBloco;
      const { incremento, novoIndiceInc } = processarIncremento(i, tokens, tabelaSimbolos, tempCount);
      codigoIntermediario.push(...incremento);
      codigoIntermediario.push(`goto ${labelInicio}`);
      codigoIntermediario.push(`${labelFim}:`);
      i = novoIndiceInc;
    }
  }

  return codigoIntermediario;
}

// **Processa expressões aritméticas**
function processarExpressao(indice, tokens, tabelaSimbolos, tempCount) {
  const instrucao = [];
  let i = indice;
  let resultado = '';

  const token = tokens[i];

  if (token.tipo === 't_identificador' || token.tipo === 't_num' || token.tipo === 't_num_decimal') {
    resultado = token.lexema;
    i++;

    while (i < tokens.length && (tokens[i].tipo === 't_soma' || tokens[i].tipo === 't_subtracao' || tokens[i].tipo === 't_multiplicacao' || tokens[i].tipo === 't_divisao')) {
      const operador = tokens[i].lexema;
      i++;
      const proximoToken = tokens[i];
      let operando2 = '';

      if (proximoToken.tipo === 't_identificador' || proximoToken.tipo === 't_num' || proximoToken.tipo === 't_num_decimal') {
        operando2 = proximoToken.lexema;
        i++;
      }

      const tempVar = `t${tempCount++}`;
      instrucao.push(`${tempVar} := ${resultado} ${operador} ${operando2}`);
      resultado = tempVar;
    }
  }

  return { instrucao, novoIndice: i, resultado };
}

// **Processa condições (exemplo simplificado)**
function processarCondicao(indice, tokens, tabelaSimbolos, tempCount) {
  const condicao = [];
  let i = indice + 1; // Pula o '(' inicial
  const operando1 = tokens[i].lexema;
  i++;
  const operador = tokens[i].lexema; // Assume operadores como '<', '>', '==', etc.
  i++;
  const operando2 = tokens[i].lexema;
  i++; // Pula o ')'
  condicao.push(`t${tempCount} := ${operando1} ${operador} ${operando2}`);
  return { condicao, novoIndice: i };
}

// **Processa blocos de código**
function processarBloco(indice, tokens, tabelaSimbolos, tempCount) {
  const bloco = [];
  let i = indice + 1; // Pula a '{'
  while (tokens[i]?.tipo !== 't_fecha_chave' && i < tokens.length) {
    const subTokens = [];
    while (tokens[i]?.tipo !== 't_ponto_virgula' && tokens[i]?.tipo !== 't_fecha_chave' && i < tokens.length) {
      subTokens.push(tokens[i]);
      i++;
    }
    if (tokens[i]?.tipo === 't_ponto_virgula') i++; // Pula o ';'
    const subCodigo = gerarCodigoIntermediario(subTokens, tabelaSimbolos);
    bloco.push(...subCodigo);
  }
  return { bloco, novoIndice: i + 1 }; // Pula a '}'
}

// **Processa inicialização do for**
function processarInicializacao(indice, tokens, tabelaSimbolos, tempCount) {
  const inicializacao = [];
  let i = indice + 1; // Pula o '('
  const subTokens = [];
  while (tokens[i]?.tipo !== 't_ponto_virgula') {
    subTokens.push(tokens[i]);
    i++;
  }
  i++; // Pula o ';'
  const subCodigo = gerarCodigoIntermediario(subTokens, tabelaSimbolos);
  inicializacao.push(...subCodigo);
  return { inicializacao, novoIndice: i };
}

// **Processa incremento do for**
function processarIncremento(indice, tokens, tabelaSimbolos, tempCount) {
  const incremento = [];
  let i = indice + 1; // Pula o ')'
  const subTokens = [];
  while (tokens[i]?.tipo !== 't_abre_chave') {
    subTokens.push(tokens[i]);
    i++;
  }
  const subCodigo = gerarCodigoIntermediario(subTokens, tabelaSimbolos);
  incremento.push(...subCodigo);
  return { incremento, novoIndice: i };
}