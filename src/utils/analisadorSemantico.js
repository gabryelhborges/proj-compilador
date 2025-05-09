class Simbolo {
  constructor(cadeia, token, categoria, tipo, escopo, linha, declarado = true) {
    this.cadeia = cadeia;
    this.token = token;
    this.categoria = categoria;
    this.tipo = tipo;
    this.valor = null; // Armazenará o valor da variável
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

function adicionarSimbolo(tabelaSimbolos, cadeia, token, categoria, tipo, escopo, linha, declarado = true, erros) {
  const simboloExistente = tabelaSimbolos.find(
    s => s.cadeia === cadeia && s.escopo === escopo
  );
  
  if (simboloExistente) {
    adicionarErro(erros, `Redeclaração de '${cadeia}' no mesmo escopo '${escopo}'`, linha);
  } else {
    const novoSimbolo = new Simbolo(cadeia, token.tipo, categoria, tipo, escopo, linha, 
      
    );
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

// Função para extrair valor literal de um token
function extrairValorLiteral(token) {
  if (token.tipo === 't_num') {
    return parseInt(token.lexema, 10);
  } else if (token.tipo === 't_num_decimal') {
    return parseFloat(token.lexema);
  } else if (token.tipo === 't_string') {
    // Remove as aspas do início e fim da string
    return token.lexema.substring(1, token.lexema.length - 1);
  } else if (token.lexema === 'verdadeiro') {
    return true;
  } else if (token.lexema === 'falso') {
    return false;
  }
  return null;
}

function obterSimbolo(tabelaSimbolos, cadeia, escopoAtual, linha) {
  let simbolo = tabelaSimbolos.find(
    s => s.cadeia === cadeia && (s.escopo === escopoAtual || s.escopo === 'global')
  );
  return simbolo || null;
}

// Função modificada para tentar avaliar expressões simples e capturar valores
function processarExpressao(indice, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros) {
  let tipoExpressao = null;
  let valorExpressao = null;
  let i = indice;
  let expressaoSimples = true; // Flag para verificar se a expressão é simples
  let contemApenasDireta = true; // Flag para verificar se expressão contém apenas valores diretos (literais)
  
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
        // A expressão não é mais simples porque envolve uma variável
        expressaoSimples = false; 
        // A expressão não contém apenas valores diretos
        contemApenasDireta = false;
        valorExpressao = null; // Não assume o valor da variável
      }
    } else if (token.tipo === 't_num') {
      tipoExpressao = 'inteiro';
      valorExpressao = parseInt(token.lexema, 10);
    } else if (token.tipo === 't_num_decimal') {
      tipoExpressao = 'decimal';
      valorExpressao = parseFloat(token.lexema);
    } else if (token.tipo === 't_string') {
      tipoExpressao = 'texto';
      valorExpressao = token.lexema.substring(1, token.lexema.length - 1);
    } else if (token.lexema === 'verdadeiro' || token.lexema === 'falso') {
      tipoExpressao = 'logico';
      valorExpressao = token.lexema === 'verdadeiro';
    } else if (token.tipo === 't_abre_par') {
      i++;
      const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
      tipoExpressao = resultado.tipo;
      // Se a expressão dentro dos parênteses não for simples ou não contiver apenas valores diretos
      expressaoSimples = expressaoSimples && resultado.expressaoSimples;
      contemApenasDireta = contemApenasDireta && resultado.contemApenasDireta;
      valorExpressao = (expressaoSimples && contemApenasDireta) ? resultado.valor : null;
      i = resultado.indice;
      if (tokens[i]?.tipo !== 't_fecha_par') {
        adicionarErro(erros, "Esperado ')' para fechar expressão", tokens[i]?.linha || token.linha);
      }
    } else if (['t_soma', 't_subtracao', 't_multiplicacao', 't_divisao'].includes(token.tipo)) {
      const operador = token.lexema;
      const valorEsquerda = valorExpressao;
      const tipoEsquerda = tipoExpressao;
      
      i++;
      const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
      const tipoDireita = resultado.tipo;
      const valorDireita = resultado.valor;
      
      // Se qualquer lado da operação não for simples ou não contiver apenas valores diretos
      expressaoSimples = expressaoSimples && resultado.expressaoSimples;
      contemApenasDireta = contemApenasDireta && resultado.contemApenasDireta;
      
      i = resultado.indice;
      
      if (tipoExpressao && tipoDireita) {
        if (tipoExpressao === 'texto' || tipoDireita === 'texto') {
          adicionarErro(erros, `Operador '${operador}' não aplicável a tipo 'texto'`, token.linha);
          tipoExpressao = null;
          valorExpressao = null;
        } else if (tipoExpressao === 'logico' || tipoDireita === 'logico') {
          adicionarErro(erros, `Operador '${operador}' não aplicável a tipo 'logico'`, token.linha);
          tipoExpressao = null;
          valorExpressao = null;
        } else {
          tipoExpressao = (tipoExpressao === 'decimal' || tipoDireita === 'decimal') ? 'decimal' : 'inteiro';
          
          // Calcular o valor apenas se a expressão for considerada simples e contiver apenas valores diretos
          if (expressaoSimples && contemApenasDireta && valorEsquerda !== null && valorDireita !== null) {
            switch (operador) {
              case '+': valorExpressao = valorEsquerda + valorDireita; break;
              case '-': valorExpressao = valorEsquerda - valorDireita; break;
              case '*': valorExpressao = valorEsquerda * valorDireita; break;
              case '/': 
                if (valorDireita === 0) {
                  adicionarErro(erros, 'Divisão por zero', token.linha);
                  valorExpressao = null;
                } else {
                  valorExpressao = valorEsquerda / valorDireita;
                }
                break;
            }
          } else {
            valorExpressao = null;
          }
        }
      }
    } else if (['t_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'].includes(token.tipo)) {
      const operadorRel = token.lexema;
      const valorEsquerda = valorExpressao;
      
      i++;
      const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
      const valorDireita = resultado.valor;
      
      // Se qualquer lado da comparação não for simples ou não contiver apenas valores diretos
      expressaoSimples = expressaoSimples && resultado.expressaoSimples;
      contemApenasDireta = contemApenasDireta && resultado.contemApenasDireta;
      
      i = resultado.indice;
      tipoExpressao = 'logico';
      
      // Calcular o valor apenas se a expressão for considerada simples e contiver apenas valores diretos
      if (expressaoSimples && contemApenasDireta && valorEsquerda !== null && valorDireita !== null) {
        switch (operadorRel) {
          case '<': valorExpressao = valorEsquerda < valorDireita; break;
          case '>': valorExpressao = valorEsquerda > valorDireita; break;
          case '==': valorExpressao = valorEsquerda == valorDireita; break;
          case '<=': valorExpressao = valorEsquerda <= valorDireita; break;
          case '>=': valorExpressao = valorEsquerda >= valorDireita; break;
        }
      } else {
        valorExpressao = null;
      }
    } else {
      break;
    }
    i++;
  }
  
  return { 
    tipo: tipoExpressao,
    valor: valorExpressao,
    indice: i - 1,
    expressaoSimples: expressaoSimples,
    contemApenasDireta: contemApenasDireta // Nova flag adicionada ao resultado
  };
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
      adicionarSimbolo(tabelaSimbolos, identificador, tokens[i - 2], 'variavel', tipo, escopoAtual, token.linha, true, erros);
      
      if (tokens[i + 1]?.tipo === 't_atribuicao') {
        i += 2;
        const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
        const tipoExpressao = resultado.tipo;
        const valorExpressao = resultado.valor;
        i = resultado.indice;
        
        const simbolo = obterSimbolo(tabelaSimbolos, identificador, escopoAtual, token.linha);
        if (simbolo) {
          if (tipoExpressao) {
            verificarCompatibilidadeTipos(erros, tipo, tipoExpressao, token.linha, `atribuição a '${identificador}'`);
          }
          simbolo.inicializado = true;
          simbolo.valor = valorExpressao; // Armazena o valor calculado
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
      // Só atribui valor se a expressão contiver apenas valores diretos
      // caso contrário, mantém o valor anterior da variável
      const valorExpressao = resultado.contemApenasDireta ? resultado.valor : simbolo.valor;
      i = resultado.indice;
      
      if (tipoExpressao) {
        verificarCompatibilidadeTipos(erros, simbolo.tipo, tipoExpressao, token.linha, `atribuição a '${identificador}'`);
      }
      simbolo.inicializado = true;
      simbolo.valor = valorExpressao; // Atualiza o valor ou mantém o anterior
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
        const valoresArgumentos = [];
        
        while (i < tokens.length && tokens[i].tipo !== 't_fecha_par') {
          const resultado = processarExpressao(i, tokens, tabelaSimbolos, variaveisUsadas, pilhaEscopos, erros);
          if (resultado.tipo) {
            argumentos.push(resultado.tipo);
            valoresArgumentos.push(resultado.valor);
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
        
        // Armazenar valores dos argumentos para funções predefinidas (opcional)
        simbolo.argumentos = valoresArgumentos;
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
    usado: simbolo.utilizado,
    valor: simbolo.valor // Adicionamos o valor ao objeto retornado
  }));
  
  return { erros, tabelaSimbolos: tabelaSimbolosArray };
}

export { analisarSemantico };