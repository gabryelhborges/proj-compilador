import Token from './Token';

export const analisarCodigo = (código) => {
  if (!código || typeof código !== 'string') {
    return { tokens: [], erros: ['Código de entrada inválido ou vazio'] };
  }

  const tokens = [];
  const erros = [];
  let posição = 0;
  let linhaAtual = 1;
  const códigoComEspaço = código + ' ';

  while (posição < códigoComEspaço.length) {
    const resultado = obterPróximoToken(códigoComEspaço, posição, linhaAtual, erros);
    if (resultado) {
      if (resultado.token) {
        tokens.push(resultado.token);
      }
      posição = resultado.novaPosição;
      if (resultado.incrementarLinha) {
        linhaAtual++;
      }
    } else {
      posição++;
    }
  }

  return { tokens, erros };
};

export const obterPróximoToken = (código, pos, linha, erros) => {
  if (pos >= código.length) return null;

  let posição = pos;
  const c = código[posição];

  if (/\s/.test(c)) {
    return {
      token: null,
      novaPosição: posição + 1,
      incrementarLinha: c === '\n'
    };
  }

  let lexema = c;
  posição++;

  // Identificadores e palavras-chave
  if (/[a-zA-Z_]/.test(c)) { // Corrigido para aceitar '_'
    while (posição < código.length && /[a-zA-Z0-9_]/.test(código[posição])) {
      lexema += código[posição];
      posição++;
    }

    const palavrasChave = {
      'variavel': 't_variavel',
      'se': 't_se',
      'senao': 't_senao',
      'enquanto': 't_enquanto',
      'para': 't_para',
      'funcao': 't_funcao',
      'retornar': 't_retornar',
      'inteiro': 't_tipo',
      'decimal': 't_tipo',
      'texto': 't_tipo',
      'logico': 't_tipo'
    };

    return {
      token: new Token(lexema, palavrasChave[lexema] || 't_identificador', linha),
      novaPosição: posição,
      incrementarLinha: false
    };
  }

  // Números
  if (/[0-9]/.test(c)) {
    while (posição < código.length && /[0-9]/.test(código[posição])) {
      lexema += código[posição];
      posição++;
    }
    let tempLexema = lexema;
    while (posição < código.length && /[a-zA-Z_]/.test(código[posição])) {
      tempLexema += código[posição];
      posição++;
    }
    if (tempLexema !== lexema) {
      erros.push(`Erro léxico na linha ${linha}: Identificador mal formado '${tempLexema}' (não pode começar com número)`);
      return {
        token: null,
        novaPosição: posição,
        incrementarLinha: false
      };
    }
    return {
      token: new Token(lexema, 't_num', linha),
      novaPosição: posição,
      incrementarLinha: false
    };
  }

  const símbolos = {
    '=': () => {
      if (posição < código.length && código[posição] === '=') {
        posição++;
        return ['==', 't_igualdade'];
      }
      return ['=', 't_atribuicao'];
    },
    '<': () => {
      if (posição < código.length && código[posição] === '=') {
        posição++;
        return ['<=', 't_menor_igual'];
      }
      return ['<', 't_menor'];
    },
    '>': () => {
      if (posição < código.length && código[posição] === '=') {
        posição++;
        return ['>=', 't_maior_igual'];
      }
      return ['>', 't_maior'];
    },
    '+': () => ['+', 't_soma'],
    '-': () => ['-', 't_subtracao'],
    '*': () => ['*', 't_multiplicacao'],
    '/': () => ['/', 't_divisao'],
    '(': () => ['(', 't_abre_par'],
    ')': () => [')', 't_fecha_par'],
    '{': () => ['{', 't_abre_chave'],
    '}': () => ['}', 't_fecha_chave'],
    ';': () => [';', 't_pv'],
    ',': () => [',', 't_virgula'],
    ':': () => [':', 't_dois_pontos']
  };

  if (símbolos[c]) {
    const [lex, tipo] = símbolos[c]();
    return {
      token: new Token(lex, tipo, linha),
      novaPosição: posição,
      incrementarLinha: false
    };
  }

  erros.push(`Erro léxico na linha ${linha}: Caractere inválido '${c}'`);
  return {
    token: null,
    novaPosição: posição,
    incrementarLinha: false
  };
};