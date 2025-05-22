import { otimizarCodigo } from './otimizadorCodigo.js';

export function gerarCodigoIntermediario(tokens, tabelaSimbolos, aplicarOtimizacao = true) {
  const codigoIntermediario = [];
  let tempCount = 1; // Contador para variáveis temporárias (t1, t2, ...)
  let labelCount = 1; // Contador para rótulos (L1, L2, ...)
  let tempCountObj = { value: tempCount }; // Objeto para contagem de variáveis temporárias

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
      const { instrucao, novoIndice, resultado } = processarExpressao(i, tokens, tabelaSimbolos, tempCountObj);
      codigoIntermediario.push(...instrucao);
      codigoIntermediario.push(`${variavel} := ${resultado}`);
      tempCount = tempCountObj.value;
      i = novoIndice;
    }

    // **Estrutura if**
    else if (token.tipo === 't_se') {
      i++; // Pula o 'se'
      
      // Vamos pular o '('
      i++; // Agora estamos no primeiro operando
      const operando1 = tokens[i].lexema;
      i++; // Agora estamos no operador
      const operador = tokens[i].lexema;
      i++; // Agora estamos no segundo operando
      const operando2 = tokens[i].lexema;
      i++; // Pula o ')'
      
      const labelElse = `L${labelCount++}`;
      const labelEnd = `L${labelCount++}`;
      
      // Inverter a condição do if para salto condicional
      let operadorNegado;
      switch (operador) {
        case '<': operadorNegado = '>='; break;
        case '>': operadorNegado = '<='; break;
        case '==': operadorNegado = '!='; break;
        case '<=': operadorNegado = '>'; break;
        case '>=': operadorNegado = '<'; break;
        default: operadorNegado = '!='; // caso padrão
      }
      
      // Usar expressão diretamente no if com a condição negada para saltar ao else quando falso
      codigoIntermediario.push(`if ${operando1} ${operadorNegado} ${operando2} goto ${labelElse}`);
      
      // Processar bloco if
      const { bloco, novoIndice: novoIndiceBloco } = processarBloco(i, tokens, tabelaSimbolos, tempCountObj);
      codigoIntermediario.push(...bloco);
      i = novoIndiceBloco;
      
      // Verificar se há um bloco else
      if (tokens[i]?.tipo === 't_senao') {
        codigoIntermediario.push(`goto ${labelEnd}`); // Adicionar salto para pular o bloco else
        codigoIntermediario.push(`${labelElse}:`); // Início do bloco else
        i++; // Pula o 'senao'
        
        // Processar bloco else
        const { bloco: blocoElse, novoIndice: novoIndiceElse } = processarBloco(i, tokens, tabelaSimbolos, tempCountObj);
        codigoIntermediario.push(...blocoElse);
        i = novoIndiceElse;
        codigoIntermediario.push(`${labelEnd}:`); // Fim após o bloco else
      } else {
        codigoIntermediario.push(`${labelElse}:`); // Label para caso falso se não houver else
      }
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

  // Ao final da função, antes de retornar, aplicamos as otimizações
  if (aplicarOtimizacao) {
    const resultado = otimizarCodigo(codigoIntermediario);
    return {
      codigo: resultado.codigo,
      otimizacoes: {
        realizadas: resultado.otimizacoesRealizadas,
        originais: resultado.otimizacoesOriginais
      }
    };
  }
  
  return {
    codigo: codigoIntermediario,
    otimizacoes: {
      realizadas: 0,
      originais: {}
    }
  };
}

// **Processa expressões aritméticas**
function processarExpressao(indice, tokens, tabelaSimbolos, tempCountObj) {
  // tempCountObj é um objeto: { value: number }
  function parseExpressao(i) {
    let { instrucao, resultado, novoIndice } = parseTermo(i);
    i = novoIndice;
    while (i < tokens.length && (tokens[i].tipo === 't_soma' || tokens[i].tipo === 't_subtracao')) {
      const operador = tokens[i].lexema;
      i++;
      const termo = parseTermo(i);
      const tempVar = `t${tempCountObj.value++}`;
      instrucao = instrucao.concat(termo.instrucao);
      instrucao.push(`${tempVar} := ${resultado} ${operador} ${termo.resultado}`);
      resultado = tempVar;
      i = termo.novoIndice;
    }
    return { instrucao, resultado, novoIndice: i };
  }

  function parseTermo(i) {
    let { instrucao, resultado, novoIndice } = parseFator(i);
    i = novoIndice;
    while (i < tokens.length && (tokens[i].tipo === 't_multiplicacao' || tokens[i].tipo === 't_divisao')) {
      const operador = tokens[i].lexema;
      i++;
      const fator = parseFator(i);
      const tempVar = `t${tempCountObj.value++}`;
      instrucao = instrucao.concat(fator.instrucao);
      instrucao.push(`${tempVar} := ${resultado} ${operador} ${fator.resultado}`);
      resultado = tempVar;
      i = fator.novoIndice;
    }
    return { instrucao, resultado, novoIndice: i };
  }

  function parseFator(i) {
    const token = tokens[i];
    if (token.tipo === 't_abre_par') {
      i++;
      const expr = parseExpressao(i);
      i = expr.novoIndice;
      if (tokens[i]?.tipo === 't_fecha_par') i++;
      return { instrucao: expr.instrucao, resultado: expr.resultado, novoIndice: i };
    } else if (
      token.tipo === 't_identificador' ||
      token.tipo === 't_num' ||
      token.tipo === 't_num_decimal'
    ) {
      return { instrucao: [], resultado: token.lexema, novoIndice: i + 1 };
    }
    // Caso de erro: retorna vazio
    return { instrucao: [], resultado: '', novoIndice: i + 1 };
  }

  return parseExpressao(indice);
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
    bloco.push(...subCodigo.codigo);
  }
  return { bloco, novoIndice: i };
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
  inicializacao.push(...subCodigo.codigo);
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
  incremento.push(...subCodigo.codigo);
  return { incremento, novoIndice: i };
}