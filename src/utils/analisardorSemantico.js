// utils/analisadorSemantico.js
class Simbolo {
    constructor(nome, tipo, linha, escopo, inicializada = false, usada = false) {
      this.nome = nome;
      this.tipo = tipo;
      this.linha = linha;
      this.escopo = escopo;
      this.inicializada = inicializada;
      this.usada = usada;
    }
  }
  
  class TabelaSimbolos {
    constructor() {
      this.escopos = [[]]; // Array de arrays, cada array é um escopo
      this.escopoAtual = 0;
    }
  
    // Entrar em um novo escopo
    entrarEscopo() {
      this.escopos.push([]);
      this.escopoAtual++;
    }
  
    // Sair do escopo atual
    sairEscopo() {
      this.escopos.pop();
      this.escopoAtual--;
    }
  
    // Adicionar símbolo ao escopo atual
    adicionarSimbolo(nome, tipo, linha) {
      const simboloExistente = this.buscarSimboloNoEscopoAtual(nome);
      if (simboloExistente) {
        return `Erro semântico na linha ${linha}: Variável '${nome}' já declarada na linha ${simboloExistente.linha}.`;
      }
      const simbolo = new Simbolo(nome, tipo, linha, this.escopoAtual);
      this.escopos[this.escopoAtual].push(simbolo);
      return null;
    }
  
    // Buscar símbolo no escopo atual
    buscarSimboloNoEscopoAtual(nome) {
      return this.escopos[this.escopoAtual].find((simbolo) => simbolo.nome === nome);
    }
  
    // Buscar símbolo em todos os escopos (do atual ao global)
    buscarSimbolo(nome) {
      for (let i = this.escopoAtual; i >= 0; i--) {
        const simbolo = this.escopos[i].find((simbolo) => simbolo.nome === nome);
        if (simbolo) return simbolo;
      }
      return null;
    }
  
    // Marcar símbolo como inicializado
    marcarInicializado(nome, linha) {
      const simbolo = this.buscarSimbolo(nome);
      if (!simbolo) {
        return `Erro semântico na linha ${linha}: Variável '${nome}' não declarada.`;
      }
      simbolo.inicializada = true;
      return null;
    }
  
    // Marcar símbolo como usado
    marcarUsado(nome, linha) {
      const simbolo = this.buscarSimbolo(nome);
      if (!simbolo) {
        return `Erro semântico na linha ${linha}: Variável '${nome}' não declarada.`;
      }
      if (!simbolo.inicializada) {
        return `Erro semântico na linha ${linha}: Variável '${(nome)}' usada antes de ser inicializada.`;
      }
      simbolo.usada = true;
      return null;
    }
  
    // Verificar tipos em uma atribuição ou expressão
    verificarTipos(tipoEsquerda, tipoDireita, linha, operacao = 'atribuicao') {
      const tiposCompatíveis = {
        inteiro: ['inteiro', 'decimal'], // Permite casting implícito de inteiro para decimal
        decimal: ['inteiro', 'decimal'],
        texto: ['texto'],
        logico: ['logico'],
      };
  
      if (!tiposCompatíveis[tipoEsquerda].includes(tipoDireita)) {
        return `Erro semântico na linha ${linha}: Tipos incompatíveis em ${operacao}. Esperado '${tipoEsquerda}', encontrado '${tipoDireita}'.`;
      }
      return null;
    }
  
    // Verificar variáveis não usadas
    verificarNaoUsadas() {
      const erros = [];
      this.escopos.forEach((escopo, idx) => {
        escopo.forEach((simbolo) => {
          if (!simbolo.usada) {
            erros.push(`Aviso semântico na linha ${simbolo.linha}: Variável '${simbolo.nome}' declarada mas não usada.`);
          }
        });
      });
      return erros;
    }
  }
  
  export const analisarSemantico = (tokens) => {
    const tabela = new TabelaSimbolos();
    const erros = [];
    let indiceToken = 0;
    const tokensComFim = [...tokens, { lexema: '$', tipo: '$', linha: tokens[tokens.length - 1]?.linha || 1 }];
  
    const proximoToken = () => (indiceToken < tokensComFim.length ? tokensComFim[indiceToken] : null);
    const consumir = (tipoEsperado) => {
      if (indiceToken < tokensComFim.length && tokensComFim[indiceToken].tipo === tipoEsperado) {
        indiceToken++;
        return true;
      }
      return false;
    };
  
    function programa() {
      while (indiceToken < tokensComFim.length && firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
        declaracao();
      }
    }
  
    function declaracao() {
      const tokenAtual = proximoToken();
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
          consumir('t_retornar');
          expressao();
          consumir('t_pv');
          break;
      }
    }
  
    function declaracao_variavel() {
      consumir('t_variavel');
      const identToken = proximoToken();
      consumir('t_identificador');
      consumir('t_dois_pontos');
      const tipoToken = proximoToken();
      consumir('t_tipo');
  
      const erro = tabela.adicionarSimbolo(identToken.lexema, tipoToken.lexema, identToken.linha);
      if (erro) erros.push(erro);
  
      if (consumir('t_atribuicao')) {
        const tipoExpressao = expressao();
        const erroTipo = tabela.verificarTipos(tipoToken.lexema, tipoExpressao, identToken.linha);
        if (erroTipo) erros.push(erroTipo);
        const erroInit = tabela.marcarInicializado(identToken.lexema, identToken.linha);
        if (erroInit) erros.push(erroInit);
      }
      consumir('t_pv');
    }
  
    function atribuicao() {
      const identToken = proximoToken();
      consumir('t_identificador');
      consumir('t_atribuicao');
      const tipoExpressao = expressao();
      consumir('t_pv');
  
      const simbolo = tabela.buscarSimbolo(identToken.lexema);
      if (!simbolo) {
        erros.push(`Erro semântico na linha ${identToken.linha}: Variável '${identToken.lexema}' não declarada.`);
        return;
      }
      const erroTipo = tabela.verificarTipos(simbolo.tipo, tipoExpressao, identToken.linha);
      if (erroTipo) erros.push(erroTipo);
      const erroInit = tabela.marcarInicializado(identToken.lexema, identToken.linha);
      if (erroInit) erros.push(erroInit);
    }
  
    function condicional() {
      consumir('t_se');
      consumir('t_abre_par');
      expressao_relacional();
      consumir('t_fecha_par');
      consumir('t_abre_chave');
      tabela.entrarEscopo();
      while (firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
        declaracao();
      }
      tabela.sairEscopo();
      consumir('t_fecha_chave');
      if (consumir('t_senao')) {
        consumir('t_abre_chave');
        tabela.entrarEscopo();
        while (firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
          declaracao();
        }
        tabela.sairEscopo();
        consumir('t_fecha_chave');
      }
    }
  
    function repeticao() {
      if (proximoToken().tipo === 't_enquanto') {
        consumir('t_enquanto');
        consumir('t_abre_par');
        expressao_relacional();
        consumir('t_fecha_par');
        consumir('t_abre_chave');
        tabela.entrarEscopo ();
        while (firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
          declaracao();
        }
        tabela.sairEscopo();
        consumir('t_fecha_chave');
      } else {
        consumir('t_para');
        consumir('t_abre_par');
        atribuicao();
        expressao_relacional();
        consumir('t_pv');
        atribuicao();
        consumir('t_fecha_par');
        consumir('t_abre_chave');
        tabela.entrarEscopo();
        while (firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
          declaracao();
        }
        tabela.sairEscopo();
        consumir('t_fecha_chave');
      }
    }
  
    function declaracao_funcao() {
      consumir('t_funcao');
      const identToken = proximoToken();
      consumir('t_identificador');
      consumir('t_abre_par');
      if (firstListaParametros.includes(tokensComFim[indiceToken].tipo)) {
        lista_parametros();
      }
      consumir('t_fecha_par');
      consumir('t_abre_chave');
      tabela.entrarEscopo();
      while (firstDeclaracao.includes(tokensComFim[indiceToken].tipo)) {
        declaracao();
      }
      tabela.sairEscopo();
      consumir('t_fecha_chave');
  
      const erro = tabela.adicionarSimbolo(identToken.lexema, 'funcao', identToken.linha);
      if (erro) erros.push(erro);
    }
  
    function lista_parametros() {
      parametro();
      while (consumir('t_virgula')) {
        parametro();
      }
    }
  
    function parametro() {
      const identToken = proximoToken();
      consumir('t_identificador');
      consumir('t_dois_pontos');
      const tipoToken = proximoToken();
      consumir('t_tipo');
  
      const erro = tabela.adicionarSimbolo(identToken.lexema, tipoToken.lexema, identToken.linha);
      if (erro) erros.push(erro);
      const erroInit = tabela.marcarInicializado(identToken.lexema, identToken.linha);
      if (erroInit) erros.push(erroInit);
    }
  
    function chamada_funcao() {
      const identToken = proximoToken();
      consumir('t_identificador');
      consumir('t_abre_par');
      if (firstExpressao.includes(tokensComFim[indiceToken].tipo)) {
        lista_argumentos();
      }
      consumir('t_fecha_par');
      consumir('t_pv');
  
      const erroUso = tabela.marcarUsado(identToken.lexema, identToken.linha);
      if (erroUso) erros.push(erroUso);
    }
  
    function lista_argumentos() {
      expressao();
      while (consumir('t_virgula')) {
        expressao();
      }
    }
  
    function expressao() {
      const tipo = termo();
      while (tokensComFim[indiceToken].tipo === 't_soma' || tokensComFim[indiceToken].tipo === 't_subtracao') {
        const op = tokensComFim[indiceToken].lexema;
        consumir(tokensComFim[indiceToken].tipo);
        const tipoDireita = termo();
        const erro = tabela.verificarTipos(tipo, tipoDireita, tokensComFim[indiceToken - 1].linha, `operação '${op}'`);
        if (erro) erros.push(erro);
      }
      return tipo;
    }
  
    function termo() {
      const tipo = fator();
      while (tokensComFim[indiceToken].tipo === 't_multiplicacao' || tokensComFim[indiceToken].tipo === 't_divisao') {
        const op = tokensComFim[indiceToken].lexema;
        consumir(tokensComFim[indiceToken].tipo);
        const tipoDireita = fator();
        const erro = tabela.verificarTipos(tipo, tipoDireita, tokensComFim[indiceToken - 1].linha, `operação '${op}'`);
        if (erro) erros.push(erro);
      }
      return tipo;
    }
  
    function fator() {
      const tokenAtual = proximoToken();
      if (consumir('t_identificador')) {
        const erroUso = tabela.marcarUsado(tokenAtual.lexema, tokenAtual.linha);
        if (erroUso) erros.push(erroUso);
        const simbolo = tabela.buscarSimbolo(tokenAtual.lexema);
        return simbolo ? simbolo.tipo : 'desconhecido';
      } else if (consumir('t_num')) {
        return 'inteiro'; // Assumindo que t_num é inteiro (ajustar para decimal se necessário)
      } else if (consumir('t_abre_par')) {
        const tipo = expressao();
        consumir('t_fecha_par');
        return tipo;
      }
      return 'desconhecido';
    }
  
    function expressao_relacional() {
      const tipoEsquerda = expressao();
      if (firstOperadorRelacional.includes(tokensComFim[indiceToken].tipo)) {
        consumir(tokensComFim[indiceToken].tipo);
        const tipoDireita = expressao();
        const erro = tabela.verificarTipos(tipoEsquerda, tipoDireita, tokensComFim[indiceToken - 1].linha, 'comparação relacional');
        if (erro) erros.push(erro);
      }
    }
  
    const firstDeclaracao = ['t_variavel', 't_identificador', 't_se', 't_enquanto', 't_para', 't_funcao', 't_retornar'];
    const firstListaParametros = ['t_identificador'];
    const firstExpressao = ['t_identificador', 't_num', 't_abre_par'];
    const firstOperadorRelacional = ['t_menor', 't_maior', 't_igualdade', 't_menor_igual', 't_maior_igual'];
  
    programa();
    const errosNaoUsadas = tabela.verificarNaoUsadas();
    erros.push(...errosNaoUsadas);
  
    return { erros };
  };