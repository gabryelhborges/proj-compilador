import { otimizarCodigo } from './otimizadorCodigo.js';

export function gerarCodigoIntermediario(tokens, tabelaSimbolos, aplicarOtimizacao = false) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return {
      codigo: [],
      otimizacoes: { realizadas: 0, originais: {} }
    };
  }

  const codigoIntermediario = [];
  const tempCountObj = { value: 1 }; // Contador unificado para variáveis temporárias
  let labelCount = 1; // Contador para rótulos (L1, L2, ...)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // **Declaração de Variável com Inicialização**
    if (token.tipo === 't_variavel') {
      const resultado = processarDeclaracaoVariavel(i, tokens, tempCountObj);
      if (resultado.instrucoes.length > 0) {
        codigoIntermediario.push(...resultado.instrucoes);
      }
      i = resultado.novoIndice - 1; // -1 porque o for incrementa
    }

    // **Atribuição**
    else if (token.tipo === 't_identificador' && tokens[i + 1]?.tipo === 't_atribuicao') {
      const resultado = processarAtribuicao(i, tokens, tabelaSimbolos, tempCountObj);
      codigoIntermediario.push(...resultado.instrucoes);
      i = resultado.novoIndice - 1; // -1 porque o for incrementa
    }

    // **Estrutura if**
    else if (token.tipo === 't_se') {
      const resultado = processarEstruturase(i, tokens, tabelaSimbolos, tempCountObj, labelCount);
      codigoIntermediario.push(...resultado.instrucoes);
      labelCount = resultado.novoLabelCount;
      i = resultado.novoIndice - 1; // -1 porque o for incrementa
    }

    // **Estrutura while**
    else if (token.tipo === 't_enquanto') {
      const resultado = processarEstruturaWhile(i, tokens, tabelaSimbolos, tempCountObj, labelCount);
      codigoIntermediario.push(...resultado.instrucoes);
      labelCount = resultado.novoLabelCount;
      i = resultado.novoIndice - 1; // -1 porque o for incrementa
    }

    // **Estrutura for**
    else if (token.tipo === 't_para') {
      const resultado = processarEstruturaFor(i, tokens, tabelaSimbolos, tempCountObj, labelCount);
      codigoIntermediario.push(...resultado.instrucoes);
      labelCount = resultado.novoLabelCount;
      i = resultado.novoIndice - 1; // -1 porque o for incrementa
    }

    // **Chamada de função**
    else if (token.tipo === 't_identificador' && tokens[i + 1]?.tipo === 't_abre_par') {
      const resultado = processarChamadaFuncao(i, tokens, tabelaSimbolos, tempCountObj);
      codigoIntermediario.push(...resultado.instrucoes);
      i = resultado.novoIndice - 1; // -1 porque o for incrementa
    }

    // **Declaração de função**
    else if (token.tipo === 't_funcao') {
      const resultado = processarDeclaracaoFuncao(i, tokens, tabelaSimbolos, tempCountObj);
      codigoIntermediario.push(...resultado.instrucoes);
      i = resultado.novoIndice - 1; // -1 porque o for incrementa
    }

    // **Instrução return**
    else if (token.tipo === 't_retornar') {
      const resultado = processarReturn(i, tokens, tabelaSimbolos, tempCountObj);
      codigoIntermediario.push(...resultado.instrucoes);
      i = resultado.novoIndice - 1; // -1 porque o for incrementa
    }
  }

  // Aplicar otimizações se solicitado
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

// **Processa declaração de variável**
function processarDeclaracaoVariavel(indice, tokens, tempCountObj) {
  const instrucoes = [];
  let i = indice;

  if (!tokens[i] || tokens[i].tipo !== 't_variavel') {
    return { instrucoes: [], novoIndice: i };
  }

  i++; // Pula 'variavel'
  
  if (!tokens[i] || tokens[i].tipo !== 't_identificador') {
    return { instrucoes: [], novoIndice: i };
  }
  
  const variavel = tokens[i].lexema;
  i++; // Pula identificador
  
  if (!tokens[i] || tokens[i].tipo !== 't_dois_pontos') {
    return { instrucoes: [], novoIndice: i };
  }
  
  i++; // Pula ':'
  
  if (!tokens[i] || tokens[i].tipo !== 't_tipo') {
    return { instrucoes: [], novoIndice: i };
  }
  
  i++; // Pula tipo
  
  // Verifica se há inicialização
  if (tokens[i]?.tipo === 't_atribuicao') {
    i++; // Pula '='
    
    if (tokens[i]) {
      const resultado = processarExpressao(i, tokens, null, tempCountObj);
      instrucoes.push(...resultado.instrucao);
      instrucoes.push(`${variavel} := ${resultado.resultado}`);
      i = resultado.novoIndice;
    }
  }
  
  // Pula ';' se existir
  if (tokens[i]?.tipo === 't_pv') {
    i++;
  }
  
  return { instrucoes, novoIndice: i };
}

// **Processa atribuição**
function processarAtribuicao(indice, tokens, tabelaSimbolos, tempCountObj) {
  const instrucoes = [];
  let i = indice;
  
  const variavel = tokens[i].lexema;
  i += 2; // Pula identificador e '='
  
  const resultado = processarExpressao(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...resultado.instrucao);
  instrucoes.push(`${variavel} := ${resultado.resultado}`);
  
  i = resultado.novoIndice;
  
  // Pula ';' se existir
  if (tokens[i]?.tipo === 't_pv') {
    i++;
  }
  
  return { instrucoes, novoIndice: i };
}

// **Processa estrutura if**
function processarEstruturase(indice, tokens, tabelaSimbolos, tempCountObj, labelCount) {
  const instrucoes = [];
  let i = indice;
  let currentLabelCount = labelCount;

  i++; // Pula 'se'
  
  if (!tokens[i] || tokens[i].tipo !== 't_abre_par') {
    return { instrucoes: [], novoIndice: i, novoLabelCount: currentLabelCount };
  }
  
  i++; // Pula '('
  
  // Processa condição
  const condicao = processarCondicao(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...condicao.instrucoes);
  i = condicao.novoIndice;
  
  if (!tokens[i] || tokens[i].tipo !== 't_fecha_par') {
    return { instrucoes: [], novoIndice: i, novoLabelCount: currentLabelCount };
  }
  
  i++; // Pula ')'
  
  const labelElse = `L${currentLabelCount++}`;
  const labelEnd = `L${currentLabelCount++}`;
  
  // Salto condicional (quando condição é falsa)
  instrucoes.push(`if ${condicao.resultado} == 0 goto ${labelElse}`);
  
  // Processa bloco if
  const blocoIf = processarBloco(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...blocoIf.instrucoes);
  i = blocoIf.novoIndice;
  
  // Verifica se há bloco else
  if (tokens[i]?.tipo === 't_senao') {
    instrucoes.push(`goto ${labelEnd}`); // Pula o bloco else
    instrucoes.push(`${labelElse}:`); // Label do else
    i++; // Pula 'senao'
    
    const blocoElse = processarBloco(i, tokens, tabelaSimbolos, tempCountObj);
    instrucoes.push(...blocoElse.instrucoes);
    i = blocoElse.novoIndice;
    
    instrucoes.push(`${labelEnd}:`); // Label do fim
  } else {
    instrucoes.push(`${labelElse}:`); // Label para caso não haja else
  }
  
  return { instrucoes, novoIndice: i, novoLabelCount: currentLabelCount };
}

// **Processa estrutura while**
function processarEstruturaWhile(indice, tokens, tabelaSimbolos, tempCountObj, labelCount) {
  const instrucoes = [];
  let i = indice;
  let currentLabelCount = labelCount;

  i++; // Pula 'enquanto'
  
  const labelInicio = `L${currentLabelCount++}`;
  const labelFim = `L${currentLabelCount++}`;
  
  instrucoes.push(`${labelInicio}:`);
  
  if (!tokens[i] || tokens[i].tipo !== 't_abre_par') {
    return { instrucoes: [], novoIndice: i, novoLabelCount: currentLabelCount };
  }
  
  i++; // Pula '('
  
  // Processa condição
  const condicao = processarCondicao(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...condicao.instrucoes);
  i = condicao.novoIndice;
  
  if (!tokens[i] || tokens[i].tipo !== 't_fecha_par') {
    return { instrucoes: [], novoIndice: i, novoLabelCount: currentLabelCount };
  }
  
  i++; // Pula ')'
  
  // Salto condicional para fim do loop
  instrucoes.push(`if ${condicao.resultado} == 0 goto ${labelFim}`);
  
  // Processa bloco do while
  const bloco = processarBloco(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...bloco.instrucoes);
  i = bloco.novoIndice;
  
  instrucoes.push(`goto ${labelInicio}`); // Volta para o início
  instrucoes.push(`${labelFim}:`); // Label do fim
  
  return { instrucoes, novoIndice: i, novoLabelCount: currentLabelCount };
}

// **Processa estrutura for**
function processarEstruturaFor(indice, tokens, tabelaSimbolos, tempCountObj, labelCount) {
  const instrucoes = [];
  let i = indice;
  let currentLabelCount = labelCount;

  i++; // Pula 'para'
  
  if (!tokens[i] || tokens[i].tipo !== 't_abre_par') {
    return { instrucoes: [], novoIndice: i, novoLabelCount: currentLabelCount };
  }
  
  i++; // Pula '('
  
  // Processa inicialização
  const inicializacao = processarAtribuicao(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...inicializacao.instrucoes);
  i = inicializacao.novoIndice;
  
  const labelInicio = `L${currentLabelCount++}`;
  const labelFim = `L${currentLabelCount++}`;
  
  instrucoes.push(`${labelInicio}:`);
  
  // Processa condição
  const condicao = processarCondicao(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...condicao.instrucoes);
  i = condicao.novoIndice;
  
  if (!tokens[i] || tokens[i].tipo !== 't_pv') {
    return { instrucoes: [], novoIndice: i, novoLabelCount: currentLabelCount };
  }
  
  i++; // Pula ';'
  
  // Salto condicional para fim do loop
  instrucoes.push(`if ${condicao.resultado} == 0 goto ${labelFim}`);
  
  // Salva posição do incremento para processar depois
  const inicioIncremento = i;
  
  // Pula incremento para processar bloco primeiro
  while (i < tokens.length && tokens[i].tipo !== 't_fecha_par') {
    i++;
  }
  
  if (!tokens[i] || tokens[i].tipo !== 't_fecha_par') {
    return { instrucoes: [], novoIndice: i, novoLabelCount: currentLabelCount };
  }
  
  i++; // Pula ')'
  
  // Processa bloco do for
  const bloco = processarBloco(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...bloco.instrucoes);
  i = bloco.novoIndice;
  
  // Agora processa incremento
  const incremento = processarAtribuicao(inicioIncremento, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...incremento.instrucoes);
  
  instrucoes.push(`goto ${labelInicio}`); // Volta para o início
  instrucoes.push(`${labelFim}:`); // Label do fim
  
  return { instrucoes, novoIndice: i, novoLabelCount: currentLabelCount };
}

// **Processa condições**
function processarCondicao(indice, tokens, tabelaSimbolos, tempCountObj) {
  const instrucoes = [];
  let i = indice;
  
  // Processa primeira expressão
  const expr1 = processarExpressao(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...expr1.instrucao);
  i = expr1.novoIndice;
  
  if (!tokens[i] || !['t_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'].includes(tokens[i].tipo)) {
    // Condição simples (apenas uma expressão)
    return { instrucoes, resultado: expr1.resultado, novoIndice: i };
  }
  
  const operador = tokens[i].lexema;
  i++; // Pula operador
  
  // Processa segunda expressão
  const expr2 = processarExpressao(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...expr2.instrucao);
  i = expr2.novoIndice;
  
  // Cria variável temporária para resultado da comparação
  const tempVar = `t${tempCountObj.value++}`;
  instrucoes.push(`${tempVar} := ${expr1.resultado} ${operador} ${expr2.resultado}`);
  
  return { instrucoes, resultado: tempVar, novoIndice: i };
}

// **Processa blocos de código**
function processarBloco(indice, tokens, tabelaSimbolos, tempCountObj) {
  const instrucoes = [];
  let i = indice;
  
  if (!tokens[i] || tokens[i].tipo !== 't_abre_chave') {
    return { instrucoes: [], novoIndice: i };
  }
  
  i++; // Pula '{'
  
  while (i < tokens.length && tokens[i].tipo !== 't_fecha_chave') {
    const token = tokens[i];
    
    if (token.tipo === 't_identificador' && tokens[i + 1]?.tipo === 't_atribuicao') {
      const resultado = processarAtribuicao(i, tokens, tabelaSimbolos, tempCountObj);
      instrucoes.push(...resultado.instrucoes);
      i = resultado.novoIndice;
    } else if (token.tipo === 't_variavel') {
      const resultado = processarDeclaracaoVariavel(i, tokens, tempCountObj);
      instrucoes.push(...resultado.instrucoes);
      i = resultado.novoIndice;
    } else if (token.tipo === 't_identificador' && tokens[i + 1]?.tipo === 't_abre_par') {
      const resultado = processarChamadaFuncao(i, tokens, tabelaSimbolos, tempCountObj);
      instrucoes.push(...resultado.instrucoes);
      i = resultado.novoIndice;
    } else if (token.tipo === 't_retornar') {
      const resultado = processarReturn(i, tokens, tabelaSimbolos, tempCountObj);
      instrucoes.push(...resultado.instrucoes);
      i = resultado.novoIndice;
    } else {
      i++; // Pula tokens não reconhecidos
    }
  }
  
  if (tokens[i]?.tipo === 't_fecha_chave') {
    i++; // Pula '}'
  }
  
  return { instrucoes, novoIndice: i };
}

// **Processa expressões aritméticas**
function processarExpressao(indice, tokens, tabelaSimbolos, tempCountObj) {
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
    if (!tokens[i]) {
      return { instrucao: [], resultado: '', novoIndice: i };
    }
    
    const token = tokens[i];
    
    if (token.tipo === 't_abre_par') {
      i++;
      const expr = parseExpressao(i);
      i = expr.novoIndice;
      if (tokens[i]?.tipo === 't_fecha_par') {
        i++;
      }
      return { instrucao: expr.instrucao, resultado: expr.resultado, novoIndice: i };
    } else if (
      token.tipo === 't_identificador' ||
      token.tipo === 't_num' ||
      token.tipo === 't_num_decimal' ||
      token.tipo === 't_string'
    ) {
      return { instrucao: [], resultado: token.lexema, novoIndice: i + 1 };
    }
    
    return { instrucao: [], resultado: '', novoIndice: i + 1 };
  }

  return parseExpressao(indice);
}

// **Processa chamada de função**
function processarChamadaFuncao(indice, tokens, tabelaSimbolos, tempCountObj) {
  const instrucoes = [];
  let i = indice;
  
  const nomeFuncao = tokens[i].lexema;
  i += 2; // Pula identificador e '('
  
  const argumentos = [];
  
  // Processa argumentos
  while (i < tokens.length && tokens[i].tipo !== 't_fecha_par') {
    if (tokens[i].tipo === 't_virgula') {
      i++;
      continue;
    }
    
    const argumento = processarExpressao(i, tokens, tabelaSimbolos, tempCountObj);
    instrucoes.push(...argumento.instrucao);
    argumentos.push(argumento.resultado);
    i = argumento.novoIndice;
  }
  
  if (tokens[i]?.tipo === 't_fecha_par') {
    i++; // Pula ')'
  }
  
  // Gera chamada de função
  if (argumentos.length === 0) {
    instrucoes.push(`call ${nomeFuncao}`);
  } else {
    instrucoes.push(`call ${nomeFuncao}(${argumentos.join(', ')})`);
  }
  
  if (tokens[i]?.tipo === 't_pv') {
    i++; // Pula ';'
  }
  
  return { instrucoes, novoIndice: i };
}

// **Processa declaração de função**
function processarDeclaracaoFuncao(indice, tokens, tabelaSimbolos, tempCountObj) {
  const instrucoes = [];
  let i = indice;
  
  i++; // Pula 'funcao'
  
  if (!tokens[i] || tokens[i].tipo !== 't_identificador') {
    return { instrucoes: [], novoIndice: i };
  }
  
  const nomeFuncao = tokens[i].lexema;
  i++; // Pula identificador
  
  instrucoes.push(`${nomeFuncao}:`);
  
  if (!tokens[i] || tokens[i].tipo !== 't_abre_par') {
    return { instrucoes: [], novoIndice: i };
  }
  
  i++; // Pula '('
  
  // Pula parâmetros (já processados pelo analisador semântico)
  while (i < tokens.length && tokens[i].tipo !== 't_fecha_par') {
    i++;
  }
  
  if (tokens[i]?.tipo === 't_fecha_par') {
    i++; // Pula ')'
  }
  
  // Processa corpo da função
  const corpo = processarBloco(i, tokens, tabelaSimbolos, tempCountObj);
  instrucoes.push(...corpo.instrucoes);
  i = corpo.novoIndice;
  
  return { instrucoes, novoIndice: i };
}

// **Processa instrução return**
function processarReturn(indice, tokens, tabelaSimbolos, tempCountObj) {
  const instrucoes = [];
  let i = indice;
  
  i++; // Pula 'retornar'
  
  if (i < tokens.length && tokens[i].tipo !== 't_pv') {
    const expressao = processarExpressao(i, tokens, tabelaSimbolos, tempCountObj);
    instrucoes.push(...expressao.instrucao);
    instrucoes.push(`return ${expressao.resultado}`);
    i = expressao.novoIndice;
  } else {
    instrucoes.push(`return`);
  }
  
  if (tokens[i]?.tipo === 't_pv') {
    i++; // Pula ';'
  }
  
  return { instrucoes, novoIndice: i };
}