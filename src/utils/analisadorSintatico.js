import Token from './Token.js';

export const analisarSintatico = (tokens) => {
  if (!Array.isArray(tokens)) {
    return { erros: ['Erro: Lista de tokens inválida. Esperava um array de tokens.'] };
  }

  if (tokens.length === 0) {
    return { erros: ['Erro: Entrada vazia. Esperava um programa com pelo menos uma declaração.'] };
  }

  const erros = [];
  let indiceToken = 0;
  // Adicionamos o token de fim apenas para ter uma referência, mas não permitiremos
  // que ele interrompa a análise prematuramente
  const tokensComFim = [...tokens, new Token('$', '$', tokens[tokens.length - 1]?.linha || 1)];

  // Função auxiliar para obter o próximo token
  const proximoToken = () => {
    return indiceToken < tokensComFim.length ? tokensComFim[indiceToken] : null;
  };

  // Função auxiliar para consumir um token esperado
  const consumir = (tipoEsperado) => {
    if (indiceToken < tokensComFim.length && tokensComFim[indiceToken].tipo === tipoEsperado) {
      indiceToken++;
      return true;
    }
    return false;
  };

  // Função para reportar erros com mensagens detalhadas
  const reportarErro = (mensagem, token, contexto = '', sugestao = '') => {
    const linha = token ? token.linha : (tokensComFim[tokensComFim.length - 1]?.linha || 1);
    const tokenEncontrado = token ? `'${token.lexema}' (${token.tipo})` : 'fim de entrada';
    const msg = `Erro sintático na linha ${linha}: ${mensagem}. Encontrado: ${tokenEncontrado}.${contexto ? ` Contexto: ${contexto}.` : ''}${sugestao ? ` Sugestão: ${sugestao}.` : ''}`;
    erros.push(msg);
  };

  // Função para sincronizar após erro
  const sincronizar = (followSet) => {
    while (indiceToken < tokens.length && !followSet.includes(tokensComFim[indiceToken].tipo)) {
      indiceToken++;
    }
  };

  // Funções recursivas para cada não-terminal
  function programa() {
    // Processar todas as declarações até o fim dos tokens reais
    // Modificamos o loop para garantir que vamos até o último token real, ignorando o '$' artificial
    while (indiceToken < tokens.length) {
      if (firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
        declaracao();
      } else {
        // Se encontrarmos um token que não inicia uma declaração, reportamos erro e avançamos
        const token = proximoToken();
        reportarErro(
          `Token inesperado: '${token.lexema}'`,
          token,
          'Programa',
          `Esperava 'variavel', identificador, 'se', 'enquanto', 'para', 'funcao' ou 'retornar'`
        );
        indiceToken++;
      }
    }
  }

  function declaracao() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Entrada incompleta',
        null,
        'Declaração esperada',
        'Esperava uma variável, atribuição, condicional, repetição, função, chamada de função ou retorno'
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_fecha_chave', '$'];

    switch (tokenAtual.tipo) {
      case 't_variavel':
        declaracao_variavel();
        break;
      case 't_identificador':
        if (tokensComFim[indiceToken + 1]?.tipo === 't_abre_par') {
          chamada_funcao();
        } else {
          atribuicao();
        }
        break;
      case 't_se':
        condicional();
        break;
      case 't_enquanto':
      case 't_para':
        repeticao();
        break;
      case 't_funcao':
        declaracao_funcao();
        break;
      case 't_retornar':
        if (!consumir('t_retornar')) {
          reportarErro(
            "Esperado 'retornar'",
            tokenAtual,
            'Instrução de retorno',
            "Use a palavra-chave 'retornar' seguida de uma expressão"
          );
          sincronizar(follow);
          return;
        }
        if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
          expressao();
        } else {
          reportarErro(
            'Esperada uma expressão após retornar',
            proximoToken(),
            'Instrução de retorno',
            'Adicione uma expressão válida após retornar'
          );
        }
        if (!consumir('t_pv')) {
          reportarErro(
            "Esperado ';' após expressão de retorno",
            proximoToken(),
            'Instrução de retorno',
            "Adicione ';' ao final da instrução"
          );
        }
        break;
      default:
        reportarErro(
          `Token inesperado: '${tokenAtual.lexema}'`,
          tokenAtual,
          'Declaração',
          `Esperava 'variavel', identificador, 'se', 'enquanto', 'para', 'funcao' ou 'retornar'`
        );
        sincronizar(follow);
    }
  }

  function declaracao_variavel() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Declaração de variável incompleta',
        null,
        'Declaração de variável',
        "Esperava 'variavel' seguido de identificador, ':', tipo e opcionalmente '='"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_fecha_chave', '$'];

    if (!consumir('t_variavel')) {
      reportarErro(
        "Esperado 'variavel'",
        tokenAtual,
        'Declaração de variável',
        "Use a palavra-chave 'variavel' para iniciar a declaração"
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_identificador')) {
      reportarErro(
        'Esperado identificador após palavra-chave variavel',
        proximoToken(),
        'Declaração de variável',
        'Identificador deve começar com uma letra seguida de letras, dígitos ou _'
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_dois_pontos')) {
      reportarErro(
        "Esperado ':' após identificador",
        proximoToken(),
        'Declaração de variável',
        "Adicione ':' para especificar o tipo da variável"
      );
      sincronizar(follow);
      return;
    }
    tipo();
    if (consumir('t_atribuicao')) {
      if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        expressao();
      } else {
        reportarErro(
          'Esperada uma expressão após =',
          proximoToken(),
          'Declaração de variável',
          'Adicione uma expressão válida após ='
        );
      }
    }
    if (!consumir('t_pv')) {
      reportarErro(
        "Esperado ';' ao final da declaração de variável",
        proximoToken(),
        'Declaração de variável',
        "Adicione ';' para finalizar a declaração"
      );
    }
  }

  function atribuicao() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Atribuição incompleta',
        null,
        'Atribuição',
        "Esperava identificador seguido de '=' e uma expressão"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_fecha_chave', '$'];

    if (!consumir('t_identificador')) {
      reportarErro(
        'Esperado identificador para atribuição',
        tokenAtual,
        'Atribuição',
        'Identificador deve começar com uma letra seguida de letras, dígitos ou _'
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_atribuicao')) {
      reportarErro(
        "Esperado '=' após identificador",
        proximoToken(),
        'Atribuição',
        "Use '=' para atribuir um valor à variável"
      );
      sincronizar(follow);
      return;
    }
    if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
      expressao();
    } else {
      reportarErro(
        'Esperada uma expressão após =',
        proximoToken(),
        'Atribuição',
        'Adicione uma expressão válida após ='
      );
    }
    if (!consumir('t_pv')) {
      reportarErro(
        "Esperado ';' ao final da atribuição",
        proximoToken(),
        'Atribuição',
        "Adicione ';' para finalizar a atribuição"
      );
    }
  }

  function condicional() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Condicional incompleto',
        null,
        'Estrutura condicional',
        "Esperava 'se' seguido de '(', expressão relacional, ')', '{' e declarações"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_fecha_chave', '$'];

    if (!consumir('t_se')) {
      reportarErro(
        "Esperado 'se'",
        tokenAtual,
        'Estrutura condicional',
        "Use a palavra-chave 'se' para iniciar uma condicional"
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_abre_par')) {
      reportarErro(
        "Esperado '(' após 'se'",
        proximoToken(),
        'Estrutura condicional',
        "Adicione '(' para iniciar a expressão relacional"
      );
      sincronizar(follow);
      return;
    }
    if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
      expressao_relacional();
    } else {
      reportarErro(
        'Esperada uma expressão relacional',
        proximoToken(),
        'Estrutura condicional',
        'Adicione uma expressão relacional válida'
      );
    }
    if (!consumir('t_fecha_par')) {
      reportarErro(
        "Esperado ')' após expressão relacional",
        proximoToken(),
        'Estrutura condicional',
        "Adicione ')' para fechar a expressão"
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_abre_chave')) {
      reportarErro(
        "Esperado '{' para bloco de declarações",
        proximoToken(),
        'Estrutura condicional',
        "Adicione '{' para iniciar o bloco de código"
      );
      sincronizar(follow);
      return;
    }
    while (indiceToken < tokensComFim.length && firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
      declaracao();
    }
    if (!consumir('t_fecha_chave')) {
      reportarErro(
        "Esperado '}' para fechar bloco de declarações",
        proximoToken(),
        'Estrutura condicional',
        "Adicione '}' para finalizar o bloco"
      );
      sincronizar(follow);
      return;
    }
    if (consumir('t_senao')) {
      if (!consumir('t_abre_chave')) {
        reportarErro(
          "Esperado '{' após 'senao'",
          proximoToken(),
          'Estrutura condicional',
          "Adicione '{' para iniciar o bloco do 'senao'"
        );
        sincronizar(follow);
        return;
      }
      while (indiceToken < tokensComFim.length && firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
        declaracao();
      }
      if (!consumir('t_fecha_chave')) {
        reportarErro(
          "Esperado '}' para fechar bloco do 'senao'",
          proximoToken(),
          'Estrutura condicional',
          "Adicione '}' para finalizar o bloco"
        );
        sincronizar(follow);
      }
    }
  }

  function repeticao() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Laço incompleto',
        null,
        'Estrutura de repetição',
        "Esperava 'enquanto' ou 'para' seguido de uma estrutura válida"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_fecha_chave', '$'];

    if (tokenAtual.tipo === 't_enquanto') {
      if (!consumir('t_enquanto')) {
        reportarErro(
          "Esperado 'enquanto'",
          tokenAtual,
          'Laço enquanto',
          "Use a palavra-chave 'enquanto' para iniciar o laço"
        );
        sincronizar(follow);
        return;
      }
      if (!consumir('t_abre_par')) {
        reportarErro(
          "Esperado '(' após 'enquanto'",
          proximoToken(),
          'Laço enquanto',
          "Adicione '(' para iniciar a expressão relacional"
        );
        sincronizar(follow);
        return;
      }
      if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        expressao_relacional();
      } else {
        reportarErro(
          'Esperada uma expressão relacional',
          proximoToken(),
          'Laço enquanto',
          'Adicione uma expressão relacional válida'
        );
      }
      if (!consumir('t_fecha_par')) {
        reportarErro(
          "Esperado ')' após expressão relacional",
          proximoToken(),
          'Laço enquanto',
          "Adicione ')' para fechar a expressão"
        );
        sincronizar(follow);
        return;
      }
      if (!consumir('t_abre_chave')) {
        reportarErro(
          "Esperado '{' para bloco de declarações",
          proximoToken(),
          'Laço enquanto',
          "Adicione '{' para iniciar o bloco de código"
        );
        sincronizar(follow);
        return;
      }
      while (indiceToken < tokensComFim.length && firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
        declaracao();
      }
      if (!consumir('t_fecha_chave')) {
        reportarErro(
          "Esperado '}' para fechar bloco de declarações",
          proximoToken(),
          'Laço enquanto',
          "Adicione '}' para finalizar o bloco"
        );
        sincronizar(follow);
      }
    } else if (tokenAtual.tipo === 't_para') {
      if (!consumir('t_para')) {
        reportarErro(
          "Esperado 'para'",
          tokenAtual,
          'Laço para',
          "Use a palavra-chave 'para' para iniciar o laço"
        );
        sincronizar(follow);
        return;
      }
      if (!consumir('t_abre_par')) {
        reportarErro(
          "Esperado '(' após 'para'",
          proximoToken(),
          'Laço para',
          "Adicione '(' para iniciar as expressões do laço"
        );
        sincronizar(follow);
        return;
      }
      if (indiceToken < tokensComFim.length && tokensComFim[indiceToken].tipo === 't_identificador') {
        atribuicao();
      } else {
        reportarErro(
          'Esperada uma atribuição inicial',
          proximoToken(),
          'Laço para',
          'Adicione uma atribuição válida para inicialização'
        );
      }
      if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        expressao_relacional();
      } else {
        reportarErro(
          'Esperada uma expressão relacional',
          proximoToken(),
          'Laço para',
          'Adicione uma expressão relacional válida'
        );
      }
      if (!consumir('t_pv')) {
        reportarErro(
          "Esperado ';' após expressão relacional",
          proximoToken(),
          'Laço para',
          "Adicione ';' para separar as expressões"
        );
        sincronizar(follow);
        return;
      }
      if (indiceToken < tokensComFim.length && tokensComFim[indiceToken].tipo === 't_identificador') {
        atribuicao();
      } else {
        reportarErro(
          'Esperada uma atribuição de incremento',
          proximoToken(),
          'Laço para',
          'Adicione uma atribuição válida para incremento'
        );
      }
      if (!consumir('t_fecha_par')) {
        reportarErro(
          "Esperado ')' após expressões do laço",
          proximoToken(),
          'Laço para',
          "Adicione ')' para fechar as expressões"
        );
        sincronizar(follow);
        return;
      }
      if (!consumir('t_abre_chave')) {
        reportarErro(
          "Esperado '{' para bloco de declarações",
          proximoToken(),
          'Laço para',
          "Adicione '{' para iniciar o bloco de código"
        );
        sincronizar(follow);
        return;
      }
      while (indiceToken < tokensComFim.length && firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
        declaracao();
      }
      if (!consumir('t_fecha_chave')) {
        reportarErro(
          "Esperado '}' para fechar bloco de declarações",
          proximoToken(),
          'Laço para',
          "Adicione '}' para finalizar o bloco"
        );
        sincronizar(follow);
      }
    } else {
      reportarErro(
        "Esperado 'enquanto' ou 'para'",
        tokenAtual,
        'Estrutura de repetição',
        "Use 'enquanto' ou 'para' para iniciar um laço"
      );
      sincronizar(follow);
    }
  }

  function declaracao_funcao() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Declaração de função incompleta',
        null,
        'Declaração de função',
        "Esperava 'funcao' seguido de identificador, '(', parâmetros, ')', '{' e declarações"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_fecha_chave', '$'];

    if (!consumir('t_funcao')) {
      reportarErro(
        "Esperado 'funcao'",
        tokenAtual,
        'Declaração de função',
        "Use a palavra-chave 'funcao' para iniciar a declaração"
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_identificador')) {
      reportarErro(
        'Esperado identificador após palavra-chave funcao',
        proximoToken(),
        'Declaração de função',
        'Identificador deve começar com uma letra seguida de letras, dígitos ou _'
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_abre_par')) {
      reportarErro(
        "Esperado '(' após identificador",
        proximoToken(),
        'Declaração de função',
        "Adicione '(' para iniciar a lista de parâmetros"
      );
      sincronizar(follow);
      return;
    }
    if (indiceToken < tokensComFim.length && firstListaParametros.includes(tokensComFim[indiceToken].tipo)) {
      lista_parametros();
    }
    if (!consumir('t_fecha_par')) {
      reportarErro(
        "Esperado ')' após lista de parâmetros",
        proximoToken(),
        'Declaração de função',
        "Adicione ')' para fechar a lista de parâmetros"
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_abre_chave')) {
      reportarErro(
        "Esperado '{' para bloco de declarações",
        proximoToken(),
        'Declaração de função',
        "Adicione '{' para iniciar o bloco de código"
      );
      sincronizar(follow);
      return;
    }
    while (indiceToken < tokensComFim.length && firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
      declaracao();
    }
    if (!consumir('t_fecha_chave')) {
      reportarErro(
        "Esperado '}' para fechar bloco de declarações",
        proximoToken(),
        'Declaração de função',
        "Adicione '}' para finalizar o bloco"
      );
      sincronizar(follow);
    }
  }

  function lista_parametros() {
    const follow = ['t_fecha_par'];
    parametro();
    while (consumir('t_virgula')) {
      if (indiceToken < tokensComFim.length && firstListaParametros.includes(tokensComFim[indiceToken].tipo)) {
        parametro();
      } else {
        reportarErro(
          'Esperado parâmetro após vírgula',
          proximoToken(),
          'Lista de parâmetros',
          'Adicione um parâmetro válido após a vírgula'
        );
        sincronizar(follow);
        break;
      }
    }
  }

  function parametro() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Parâmetro incompleto',
        null,
        'Lista de parâmetros',
        "Esperava identificador seguido de ':' e tipo"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_virgula', 't_fecha_par'];

    if (!consumir('t_identificador')) {
      reportarErro(
        'Esperado identificador para parâmetro',
        tokenAtual,
        'Lista de parâmetros',
        'Identificador deve começar com uma letra seguida de letras, dígitos ou _'
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_dois_pontos')) {
      reportarErro(
        "Esperado ':' após identificador",
        proximoToken(),
        'Lista de parâmetros',
        "Adicione ':' para especificar o tipo do parâmetro"
      );
      sincronizar(follow);
      return;
    }
    tipo();
  }

  function chamada_funcao() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Chamada de função incompleta',
        null,
        'Chamada de função',
        "Esperava identificador seguido de '(', argumentos e ')'"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_pv', 't_fecha_chave', '$'];

    if (!consumir('t_identificador')) {
      reportarErro(
        'Esperado identificador para chamada de função',
        tokenAtual,
        'Chamada de função',
        'Identificador deve começar com uma letra seguida de letras, dígitos ou _'
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_abre_par')) {
      reportarErro(
        "Esperado '(' após identificador",
        proximoToken(),
        'Chamada de função',
        "Adicione '(' para iniciar a lista de argumentos"
      );
      sincronizar(follow);
      return;
    }
    if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
      lista_argumentos();
    }
    if (!consumir('t_fecha_par')) {
      reportarErro(
        "Esperado ')' após lista de argumentos",
        proximoToken(),
        'Chamada de função',
        "Adicione ')' para fechar a lista de argumentos"
      );
      sincronizar(follow);
      return;
    }
    if (!consumir('t_pv')) {
      reportarErro(
        "Esperado ';' ao final da chamada de função",
        proximoToken(),
        'Chamada de função',
        "Adicione ';' para finalizar a chamada"
      );
    }
  }

  function lista_argumentos() {
    const follow = ['t_fecha_par'];
    if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
      expressao();
    } else {
      reportarErro(
        'Esperada uma expressão como argumento',
        proximoToken(),
        'Lista de argumentos',
        'Adicione uma expressão válida'
      );
      sincronizar(follow);
      return;
    }
    while (consumir('t_virgula')) {
      if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        expressao();
      } else {
        reportarErro(
          'Esperada uma expressão após vírgula',
          proximoToken(),
          'Lista de argumentos',
          'Adicione uma expressão válida após a vírgula'
        );
        sincronizar(follow);
        break;
      }
    }
  }

  function expressao() {
    const follow = ['t_pv', 't_virgula', 't_fecha_par', 't_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'];
    if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
      termo();
    } else {
      reportarErro(
        'Esperada uma expressão válida',
        proximoToken(),
        'Expressão',
        'Use um identificador, número ou expressão entre parênteses'
      );
      sincronizar(follow);
      return;
    }
    while (indiceToken < tokensComFim.length && (tokensComFim[indiceToken].tipo === 't_soma' || tokensComFim[indiceToken].tipo === 't_subtracao')) {
      consumir(tokensComFim[indiceToken].tipo);
      if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        termo();
      } else {
        reportarErro(
          'Esperado um termo após operador + ou -',
          proximoToken(),
          'Expressão',
          'Adicione um termo válido após o operador'
        );
        sincronizar(follow);
        break;
      }
    }
  }

  function termo() {
    const follow = ['t_soma', 't_subtracao', 't_pv', 't_virgula', 't_fecha_par', 't_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'];
    if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
      fator();
    } else {
      reportarErro(
        'Esperado um fator',
        proximoToken(),
        'Termo',
        'Use um identificador, número ou expressão entre parênteses'
      );
      sincronizar(follow);
      return;
    }
    while (indiceToken < tokensComFim.length && (tokensComFim[indiceToken].tipo === 't_multiplicacao' || tokensComFim[indiceToken].tipo === 't_divisao')) {
      consumir(tokensComFim[indiceToken].tipo);
      if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        fator();
      } else {
        reportarErro(
          'Esperado um fator após operador * ou /',
          proximoToken(),
          'Termo',
          'Adicione um fator válido após o operador'
        );
        sincronizar(follow);
        break;
      }
    }
  }

  function fator() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Fator incompleto',
        null,
        'Expressão',
        "Esperava identificador, número, string ou expressão entre parênteses"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_multiplicacao', 't_divisao', 't_soma', 't_subtracao', 't_pv', 't_virgula', 't_fecha_par', 't_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'];

    if (consumir('t_identificador')) {
      return;
    } else if (consumir('t_num') || consumir('t_num_decimal')) {
      return;
    } else if (consumir('t_string')) {  // Add support for string literals
      return;
    } else if (consumir('t_abre_par')) {
      if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        expressao();
      } else {
        reportarErro(
          'Esperada uma expressão entre parênteses',
          proximoToken(),
          'Expressão',
          'Adicione uma expressão válida após ('
        );
      }
      if (!consumir('t_fecha_par')) {
        reportarErro(
          "Esperado ')' para fechar expressão",
          proximoToken(),
          'Expressão',
          "Adicione ')' para fechar a expressão entre parênteses"
        );
        sincronizar(follow);
      }
    } else {
      reportarErro(
        "Esperado identificador, número, string ou '('",
        tokenAtual,
        'Expressão',
        "Use um identificador, número, string ou expressão entre parênteses"
      );
      sincronizar(follow);
    }
  }

  function expressao_relacional() {
    const follow = ['t_fecha_par', 't_pv'];
    if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
      expressao();
    } else {
      reportarErro(
        'Esperada uma expressão',
        proximoToken(),
        'Expressão relacional',
        'Adicione uma expressão válida'
      );
      sincronizar(follow);
      return;
    }
    if (indiceToken < tokensComFim.length && firstOperadorRelacional.includes(tokensComFim[indiceToken].tipo)) {
      operador_relacional();
      if (indiceToken < tokensComFim.length && firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        expressao();
      } else {
        reportarErro(
          'Esperada uma expressão após operador relacional',
          proximoToken(),
          'Expressão relacional',
          'Adicione uma expressão válida após o operador'
        );
      }
    }
  }

  function operador_relacional() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Operador relacional incompleto',
        null,
        'Expressão relacional',
        "Esperava '<', '>', '==', '<=' ou '>='"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_identificador', 't_num', 't_abre_par'];

    if (consumir('t_menor') || consumir('t_maior') || consumir('t_igualdade') || consumir('t_menor_igual') || consumir('t_maior_igual')) {
      return;
    } else {
      reportarErro(
        "Esperado operador relacional ('<', '>', '==', '<=', '>=')",
        tokenAtual,
        'Expressão relacional',
        "Use um operador relacional válido"
      );
      sincronizar(follow);
    }
  }

  function tipo() {
    if (indiceToken >= tokensComFim.length) {
      reportarErro(
        'Esperado tipo de dado',
        null,
        'Declaração de tipo',
        "Esperava 'inteiro', 'decimal', 'texto' ou 'logico'"
      );
      return;
    }
    const tokenAtual = proximoToken();
    const follow = ['t_atribuicao', 't_pv', 't_virgula', 't_fecha_par'];

    if (!consumir('t_tipo')) {
      reportarErro(
        `Esperado tipo ('inteiro', 'decimal', 'texto', 'logico'), encontrado '${tokenAtual.lexema}'`,
        tokenAtual,
        'Declaração de tipo',
        "Use um tipo de dado válido"
      );
      sincronizar(follow);
    }
  }

  // Conjuntos FIRST para guiar a análise
  const firstDeclaracao = ['t_variavel', 't_identificador', 't_se', 't_enquanto', 't_para', 't_funcao', 't_retornar'];
  const firstListaParametros = ['t_identificador'];
  const firstExpressao = ['t_identificador', 't_num', 't_num_decimal', 't_string', 't_abre_par'];
  const firstOperadorRelacional = ['t_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'];

  // Iniciar análise
  programa();

  return { erros };
};