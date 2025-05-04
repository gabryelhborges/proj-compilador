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

  // Mapa de palavras-chave para melhor desempenho em O(1)
  const palavrasChave = new Map([
    ['variavel', 't_variavel'],
    ['se', 't_se'],
    ['senao', 't_senao'],
    ['enquanto', 't_enquanto'],
    ['para', 't_para'],
    ['funcao', 't_funcao'],
    ['retornar', 't_retornar'],
    ['inteiro', 't_tipo'],
    ['decimal', 't_tipo'],
    ['texto', 't_tipo'],
    ['logico', 't_tipo']
  ]);

  // Padrões de reconhecimento para tipos de tokens
  const padrões = {
    espaçoEmBranco: /\s/,
    letraOuUnder: /[a-zA-Z_]/,
    letraNumeroOuUnder: /[a-zA-Z0-9_]/,
    número: /[0-9]/
  };

  // Função auxiliar para criar um erro léxico
  const criarErroLéxico = (mensagem, linha) => {
    erros.push(`Erro léxico na linha ${linha}: ${mensagem}`);
  };

  while (posição < códigoComEspaço.length) {
    const c = códigoComEspaço[posição];

    // Ignora espaços em branco
    if (padrões.espaçoEmBranco.test(c)) {
      if (c === '\n') linhaAtual++;
      posição++;
      continue;
    }

    // Tratamento de comentários de linha
    if (c === '/' && posição + 1 < códigoComEspaço.length && códigoComEspaço[posição + 1] === '/') {
      posição += 2; // Pula os caracteres '//'
      
      // Avança até encontrar o fim da linha ou fim do arquivo
      while (posição < códigoComEspaço.length && códigoComEspaço[posição] !== '\n') {
        posição++;
      }
      continue;
    }

    // Tratamento de comentários de bloco
    if (c === '/' && posição + 1 < códigoComEspaço.length && códigoComEspaço[posição + 1] === '*') {
      const linhaInicial = linhaAtual; // Guarda a linha onde o comentário começa
      posição += 2; // Pula os caracteres '/*'
      
      let comentarioFechado = false;
      
      // Avança até encontrar o fechamento do comentário '*/' ou fim do arquivo
      while (posição < códigoComEspaço.length - 1) {
        if (códigoComEspaço[posição] === '*' && códigoComEspaço[posição + 1] === '/') {
          posição += 2; // Pula os caracteres '*/'
          comentarioFechado = true;
          break;
        }
        
        if (códigoComEspaço[posição] === '\n') {
          linhaAtual++;
        }
        
        posição++;
      }
      
      // Se chegou ao fim sem encontrar o fechamento do comentário
      if (!comentarioFechado) {
        criarErroLéxico(`Comentário de bloco não fechado, iniciado na linha ${linhaInicial}`, linhaAtual);
      }
      
      continue;
    }

    // Tratamento de strings (literais de texto)
    if (c === '"') {
      let conteudoString = '';
      const linhaInicial = linhaAtual;
      posição++; // Pula o caractere de aspas inicial
      
      let stringFechada = false;
      
      // Avança até encontrar o fechamento da string ou fim de linha/arquivo
      while (posição < códigoComEspaço.length) {
        // Se encontrou o fechamento da string
        if (códigoComEspaço[posição] === '"') {
          posição++; // Pula a aspas final
          stringFechada = true;
          break;
        }
        
        // Se encontrou uma quebra de linha dentro da string
        if (códigoComEspaço[posição] === '\n') {
          linhaAtual++;
          criarErroLéxico(`String não fechada, iniciada na linha ${linhaInicial}`, linhaInicial);
          stringFechada = false;
          break;
        }
        
        // Suporte para caracteres de escape dentro da string
        if (códigoComEspaço[posição] === '\\' && posição + 1 < códigoComEspaço.length) {
          posição++; // Avança para o próximo caractere após a barra
          
          // Processa caracteres de escape como \n, \t, \", etc.
          switch (códigoComEspaço[posição]) {
            case 'n': conteudoString += '\n'; break;
            case 't': conteudoString += '\t'; break;
            case '"': conteudoString += '"'; break;
            case '\\': conteudoString += '\\'; break;
            default: conteudoString += códigoComEspaço[posição]; // Mantém outros caracteres após a barra
          }
          posição++;
        } else {
          conteudoString += códigoComEspaço[posição];
          posição++;
        }
      }
      
      // Se a string foi fechada corretamente, adiciona o token
      if (stringFechada) {
        tokens.push(new Token(`"${conteudoString}"`, 't_string', linhaInicial));
      }
      
      continue;
    }

    let lexema = c;
    posição++;

    // Identificadores e palavras-chave
    if (padrões.letraOuUnder.test(c)) {
      while (posição < códigoComEspaço.length && padrões.letraNumeroOuUnder.test(códigoComEspaço[posição])) {
        lexema += códigoComEspaço[posição];
        posição++;
      }

      // Verifica se é uma palavra-chave
      const tipo = palavrasChave.get(lexema) || 't_identificador';
      tokens.push(new Token(lexema, tipo, linhaAtual));
      continue;
    }

    // Números
    if (padrões.número.test(c)) {
      let temPonto = false;
      
      // Lê todos os dígitos
      while (posição < códigoComEspaço.length && (padrões.número.test(códigoComEspaço[posição]) || 
             (códigoComEspaço[posição] === '.' && !temPonto))) {
        if (códigoComEspaço[posição] === '.') {
          temPonto = true;
        }
        lexema += códigoComEspaço[posição];
        posição++;
      }

      // Verifica identificadores inválidos começados com números
      let tempLexema = lexema;
      while (posição < códigoComEspaço.length && padrões.letraOuUnder.test(códigoComEspaço[posição])) {
        tempLexema += códigoComEspaço[posição];
        posição++;
      }

      if (tempLexema !== lexema) {
        criarErroLéxico(`Identificador mal formado '${tempLexema}' (não pode começar com número)`, linhaAtual);
        continue;
      }

      tokens.push(new Token(lexema, temPonto ? 't_num_decimal' : 't_num', linhaAtual));
      continue;
    }

    // Operadores e símbolos
    switch(c) {
      case '=': 
        if (posição < códigoComEspaço.length && códigoComEspaço[posição] === '=') {
          tokens.push(new Token('==', 't_igualdade', linhaAtual));
          posição++;
        } else {
          tokens.push(new Token('=', 't_atribuicao', linhaAtual));
        }
        break;
      case '<': 
        if (posição < códigoComEspaço.length && códigoComEspaço[posição] === '=') {
          tokens.push(new Token('<=', 't_menor_igual', linhaAtual));
          posição++;
        } else {
          tokens.push(new Token('<', 't_menor', linhaAtual));
        }
        break;
      case '>': 
        if (posição < códigoComEspaço.length && códigoComEspaço[posição] === '=') {
          tokens.push(new Token('>=', 't_maior_igual', linhaAtual));
          posição++;
        } else {
          tokens.push(new Token('>', 't_maior', linhaAtual));
        }
        break;
      case '+': tokens.push(new Token('+', 't_soma', linhaAtual)); break;
      case '-': tokens.push(new Token('-', 't_subtracao', linhaAtual)); break;
      case '*': tokens.push(new Token('*', 't_multiplicacao', linhaAtual)); break;
      case '/': tokens.push(new Token('/', 't_divisao', linhaAtual)); break;
      case '(': tokens.push(new Token('(', 't_abre_par', linhaAtual)); break;
      case ')': tokens.push(new Token(')', 't_fecha_par', linhaAtual)); break;
      case '{': tokens.push(new Token('{', 't_abre_chave', linhaAtual)); break;
      case '}': tokens.push(new Token('}', 't_fecha_chave', linhaAtual)); break;
      case ';': tokens.push(new Token(';', 't_pv', linhaAtual)); break;
      case ',': tokens.push(new Token(',', 't_virgula', linhaAtual)); break;
      case ':': tokens.push(new Token(':', 't_dois_pontos', linhaAtual)); break;
      default:
        criarErroLéxico(`Caractere inválido '${c}'`, linhaAtual);
    }
  }

  return { tokens, erros };
};