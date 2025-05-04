class Simbolo {
  constructor(cadeia, token, categoria, tipo, escopo, linha, declarado = true) {
    this.cadeia = cadeia;
    this.token = token;
    this.categoria = categoria;
    this.tipo = tipo;
    this.valor = null;
    this.escopo = escopo;
    this.linha = linha;
    this.declarado = declarado;
    this.inicializado = false;
    this.utilizado = false;
  }
}

function adicionarErro(erros, mensagem, linha) {
  erros.push(`Erro semântico na linha ${linha}: ${mensagem}`);
}

function adicionarSimbolo(tabelaSimbolos, cadeia, token, categoria, tipo, escopo, linha, declarado = true) {
  const simboloExistente = tabelaSimbolos.find(
    s => s.cadeia === cadeia && s.escopo === escopo
  );
  
  if (simboloExistente) {
    adicionarErro(tabelaSimbolos.erros, `Redeclaração de '${cadeia}' no mesmo escopo '${escopo}'`, linha);
  } else {
    const novoSimbolo = new Simbolo(cadeia, token.tipo, categoria, tipo, escopo, linha, declarado);
    tabelaSimbolos.push(novoSimbolo);
  }
}

function verificarCompatibilidadeTipos(erros, tipoEsquerda, tipoDireita, linha, contexto) {
  if (tipoEsquerda === tipoDireita) return true;
  
  if (tipoEsquerda === 'decimal' && tipoDireita === 'inteiro') {
    adicionarErro(erros, `Casting implícito de 'inteiro' para 'decimal' em ${contexto}. Pode haver perda de precisão`, linha);
    return true;
  }
  
  if (tipoEsquerda === 'inteiro' && tipoDireita === 'decimal') {
    adicionarErro(erros, `Casting implícito de 'decimal' para 'inteiro' em ${contexto}. Pode haver perda de informação`, linha);
    return true;
  }
  
  adicionarErro(erros, `Tipos incompatíveis em ${contexto}: esperado '${tipoEsquerda}', encontrado '${tipoDireita}'`, linha);
  return false;
}

function obterSimbolo(tabelaSimbolos, cadeia, escopoAtual, linha) {
  let simbolo = tabelaSimbolos.find(
    s => s.cadeia === cadeia && (s.escopo === escopoAtual || s.escopo === 'global')
  );
  return simbolo || null;
}

function processarExpressao(indice, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros) {
  let tipoExpressao = null;
  let i = indice;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (token.tipo === 't_identificador') {
      const simbolo = obterSimbolo(tabelaSimbolos, token.lexema, pilhaEscopos[pilhaEscopos.length - 1], token.linha);
      if (!simbolo) {
        adicionarErro(erros, `Variável '${token.lexema}' não declarada`, token.linha);
      } else {
        variaveisUsadas.add(token.lexema);
        simbolo.utilizado = true;
        if (!simbolo.inicializado) {
          adicionarErro(erros, `Variável '${token.lexema}' usada antes de ser inicializada`, token.linha);
        }
        tipoExpressao = simbolo.tipo;
      }
    } else if (token.tipo === 't_num') {
      tipoExpressao = 'inteiro';
    } else if (token.tipo === 't_num_decimal') {
      tipoExpressao = 'decimal';
    } else if (token.tipo === 't_string') {
      tipoExpressao = 'texto';
    } else if (token.tipo === 't_abre_par') {
      i++;
      const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
      tipoExpressao = resultado.tipo;
      i = resultado.indice;
      if (tokens[i]?.tipo !== 't_fecha_par') {
        adicionarErro(erros, "Esperado ')' para fechar expressão", tokens[i]?.linha || token.linha);
      }
    } else if (['t_soma', 't_subtracao', 't_multiplicacao', 't_divisao'].includes(token.tipo)) {
      i++;
      const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
      const tipoDireita = resultado.tipo;
      i = resultado.indice;
      
      if (tipoExpressao && tipoDireita) {
        if (tipoExpressao === 'texto' || tipoDireita === 'texto') {
          adicionarErro(erros, `Operador '${token.lexema}' não aplicável a tipo 'texto'`, token.linha);
          tipoExpressao = null;
        } else if (tipoExpressao === 'logico' || tipoDireita === 'logico') {
          adicionarErro(erros, `Operador '${token.lexema}' não aplicável a tipo 'logico'`, token.linha);
          tipoExpressao = null;
        } else {
          tipoExpressao = (tipoExpressao === 'decimal' || tipoDireita === 'decimal') ? 'decimal' : 'inteiro';
        }
      }
    } else if (['t_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'].includes(token.tipo)) {
      i++;
      const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
      i = resultado.indice;
      tipoExpressao = 'logico';
    } else {
      break;
    }
    i++;
  }
  
  return { tipo: tipoExpressao, indice: i - 1 };
}

function obterParametrosFuncao(nomeFuncao, tokens) {
  const parametros = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].tipo === 't_funcao' && tokens[i + 1]?.lexema === nomeFuncao) {
      i += 2;
      if (tokens[i]?.tipo === 't_abre_par') {
        i++;
        while (tokens[i]?.tipo === 't_identificador') {
          const paramNome = tokens[i].lexema;
          i++;
          if (tokens[i]?.tipo === 't_dois_pontos') {
            i++;
            if (tokens[i]?.tipo === 't_tipo') {
              parametros.push({ nome: paramNome, tipo: tokens[i].lexema });
            }
          }
          i++;
          if (tokens[i]?.tipo === 't_virgula') {
            i++;
          } else {
            break;
          }
        }
      }
      break;
    }
  }
  return parametros;
}

function analisarSemantico(tokens, tabelaSimbolosInicial = []) {
  const tabelaSimbolos = [...tabelaSimbolosInicial];
  const erros = [];
  const variaveisUsadas = new Set();
  const variaveisInicializadas = new Set();
  const pilhaEscopos = ['global'];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const escopoAtual = pilhaEscopos[pilhaEscopos.length - 1];
    
    if (token.tipo === 't_variavel') {
      i++;
      if (tokens[i]?.tipo !== 't_identificador') {
        adicionarErro(erros, 'Esperado identificador após palavra-chave variavel', token.linha);
        continue;
      }
      const identificador = tokens[i].lexema;
      i++;
      if (tokens[i]?.tipo !== 't_dois_pontos') {
        adicionarErro(erros, "Esperado ':' após identificador", tokens[i]?.linha || token.linha);
        continue;
      }
      i++;
      if (tokens[i]?.tipo !== 't_tipo') {
        adicionarErro(erros, "Esperado tipo ('inteiro', 'decimal', 'texto', 'logico')", tokens[i]?.linha || token.linha);
        continue;
      }
      const tipo = tokens[i].lexema;
      adicionarSimbolo(tabelaSimbolos, identificador, tokens[i - 2], 'variavel', tipo, escopoAtual, token.linha);
      
      if (tokens[i + 1]?.tipo === 't_atribuicao') {
        i += 2;
        const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
        const tipoExpressao = resultado.tipo;
        i = resultado.indice;
        
        const simbolo = obterSimbolo(tabelaSimbolos, identificador, escopoAtual, token.linha);
        if (simbolo) {
          if (tipoExpressao) {
            verificarCompatibilidadeTipos(erros, tipo, tipoExpressao, token.linha, `atribuição a '${identificador}'`);
          }
          simbolo.inicializado = true;
          variaveisInicializadas.add(identificador);
        }
      }
    } else if (token.tipo === 't_funcao') {
      i++;
      if (tokens[i]?.tipo !== 't_identificador') {
        adicionarErro(erros, 'Esperado identificador após palavra-chave funcao', token.linha);
        continue;
      }
      const nomeFuncao = tokens[i].lexema;
      pilhaEscopos.push(nomeFuncao);
      adicionarSimbolo(tabelaSimbolos, nomeFuncao, tokens[i], 'funcao', 'void', 'global', token.linha);
      
      i++;
      if (tokens[i]?.tipo === 't_abre_par') {
        i++;
        while (tokens[i]?.tipo === 't_identificador') {
          const paramNome = tokens[i].lexema;
          i++;
          if (tokens[i]?.tipo !== 't_dois_pontos') {
            adicionarErro(erros, "Esperado ':' após identificador do parâmetro", tokens[i]?.linha || token.linha);
            continue;
          }
          i++;
          if (tokens[i]?.tipo !== 't_tipo') {
            adicionarErro(erros, "Esperado tipo para parâmetro", tokens[i]?.linha || token.linha);
            continue;
          }
          const tipoParam = tokens[i].lexema;
          adicionarSimbolo(tabelaSimbolos, paramNome, tokens[i - 2], 'variavel', tipoParam, nomeFuncao, token.linha);
          variaveisInicializadas.add(paramNome);
          i++;
          if (tokens[i]?.tipo === 't_virgula') {
            i++;
          } else {
            break;
          }
        }
        if (tokens[i]?.tipo !== 't_fecha_par') {
          adicionarErro(erros, "Esperado ')' após lista de parâmetros", tokens[i]?.linha || token.linha);
        }
      }
    } else if (token.tipo === 't_identificador' && tokens[i + 1]?.tipo === 't_atribuicao') {
      const identificador = token.lexema;
      const simbolo = obterSimbolo(tabelaSimbolos, identificador, escopoAtual, token.linha);
      if (!simbolo) {
        adicionarErro(erros, `Variável '${identificador}' não declarada`, token.linha);
        i += 2;
        continue;
      }
      
      let usaProprioValor = false;
      for (let j = i + 2; j < tokens.length; j++) {
        if (tokens[j].tipo === 't_identificador' && tokens[j].lexema === identificador) {
          usaProprioValor = true;
          break;
        }
        if (['t_soma', 't_subtracao', 't_multiplicacao', 't_divisao', 't_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'].includes(tokens[j].tipo)) {
          continue;
        }
        break;
      }
      
      if (!simbolo.inicializado && usaProprioValor) {
        adicionarErro(erros, `Variável '${identificador}' não inicializada antes de ser usada na atribuição`, token.linha);
      }
      
      i += 2;
      const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
      const tipoExpressao = resultado.tipo;
      i = resultado.indice;
      
      if (tipoExpressao) {
        verificarCompatibilidadeTipos(erros, simbolo.tipo, tipoExpressao, token.linha, `atribuição a '${identificador}'`);
      }
      simbolo.inicializado = true;
      variaveisInicializadas.add(identificador);
    } else if (token.tipo === 't_identificador' && tokens[i + 1]?.tipo === 't_abre_par') {
      const nomeFuncao = token.lexema;
      const simbolo = obterSimbolo(tabelaSimbolos, nomeFuncao, escopoAtual, token.linha);
      if (!simbolo) {
        adicionarErro(erros, `Função '${nomeFuncao}' não declarada`, token.linha);
      } else if (simbolo.categoria !== 'funcao') {
        adicionarErro(erros, `'${nomeFuncao}' não é uma função`, token.linha);
      } else {
        simbolo.utilizado = true;
        i += 2;
        const argumentos = [];
        while (i < tokens.length && tokens[i].tipo !== 't_fecha_par') {
          const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
          if (resultado.tipo) {
            argumentos.push(resultado.tipo);
          }
          i = resultado.indice + 1;
          if (tokens[i]?.tipo === 't_virgula') {
            i++;
          }
        }
        if (tokens[i]?.tipo !== 't_fecha_par') {
          adicionarErro(erros, "Esperado ')' para fechar chamada de função", tokens[i]?.linha || token.linha);
        }
        
        const parametros = obterParametrosFuncao(nomeFuncao, tokens);
        
        if (argumentos.length !== parametros.length) {
          adicionarErro(
            erros,
            `Número incorreto de argumentos na chamada de '${nomeFuncao}': esperado ${parametros.length}, recebido ${argumentos.length}`,
            token.linha
          );
        } else {
          for (let j = 0; j < argumentos.length; j++) {
            if (argumentos[j] && parametros[j]) {
              verificarCompatibilidadeTipos(
                erros,
                parametros[j].tipo,
                argumentos[j],
                token.linha,
                `argumento ${j + 1} da chamada de '${nomeFuncao}'`
              );
            }
          }
        }
      }
    } else if (token.tipo === 't_identificador') {
      const simbolo = obterSimbolo(tabelaSimbolos, token.lexema, escopoAtual, token.linha);
      if (!simbolo) {
        adicionarErro(erros, `Variável '${token.lexema}' não declarada`, token.linha);
      } else {
        variaveisUsadas.add(token.lexema);
        simbolo.utilizado = true;
      }
    } else if (token.tipo === 't_fecha_chave' && pilhaEscopos.length > 1) {
      pilhaEscopos.pop();
    }
  }
  
  tabelaSimbolos.forEach(simbolo => {
    if (simbolo.categoria === 'variavel' && !simbolo.inicializado && !variaveisInicializadas.has(simbolo.cadeia)) {
      adicionarErro(erros, `Variável '${simbolo.cadeia}' declarada mas não inicializada`, simbolo.linha);
    }
  });
  
  tabelaSimbolos.forEach(simbolo => {
    if (simbolo.categoria === 'variavel' && !simbolo.utilizado && !variaveisUsadas.has(simbolo.cadeia)) {
      adicionarErro(erros, `Variável '${simbolo.cadeia}' declarada mas não utilizada`, simbolo.linha);
    }
  });
  
  const tabelaSimbolosArray = tabelaSimbolos.map(simbolo => ({
    nome: simbolo.cadeia,
    tipo: simbolo.tipo,
    linha: simbolo.linha,
    escopo: simbolo.escopo,
    inicializado: simbolo.inicializado,
    usado: simbolo.utilizado
  }));
  
  return { erros, tabelaSimbolos: tabelaSimbolosArray };
}

export { analisarSemantico };