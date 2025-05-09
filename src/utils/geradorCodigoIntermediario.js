/**
 * Gerador de código intermediário usando representação de três endereços
 * 
 * Converte tokens e tabela de símbolos em instruções de código intermediário
 * onde cada instrução tem a forma: resultado = operando1 operador operando2
 */

export const gerarCodigoIntermediario = (tokens, tabelaSimbolos) => {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return { codigoIntermediario: [], erros: ['Nenhum token para gerar código intermediário'] };
  }

  const codigoIntermediario = [];
  const erros = [];
  let contadorTemp = 0;
  let contadorRotulo = 0;
  const pilhaRotulos = [];

  // Função para gerar um novo nome de variável temporária
  const gerarTemp = () => `t${contadorTemp++}`;

  // Função para gerar um novo rótulo
  const gerarRotulo = () => `L${contadorRotulo++}`;

  // Função para verificar se um token é operador
  const ehOperador = (tipo) => ['t_soma', 't_subtracao', 't_multiplicacao', 't_divisao'].includes(tipo);

  // Função para converter tipo de token em operador para código intermediário
  const converterOperador = (tipo) => {
    switch (tipo) {
      case 't_soma': return '+';
      case 't_subtracao': return '-';
      case 't_multiplicacao': return '*';
      case 't_divisao': return '/';
      case 't_menor': return '<';
      case 't_maior': return '>';
      case 't_igualdade': return '==';
      case 't_menor_igual': return '<=';
      case 't_maior_igual': return '>=';
      default: return '';
    }
  };

  // Processamento do array de tokens para gerar código intermediário
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Declaração de variável
    if (token.tipo === 't_variavel' && i + 3 < tokens.length) {
      const identificador = tokens[i + 1];
      // Verifica se há atribuição na declaração
      if (i + 5 < tokens.length && tokens[i + 3].tipo === 't_atribuicao') {
        // Pula tokens até a atribuição
        i += 4; // Avança até a expressão depois do '='

        // Processa expressões simples (sem operadores compostos por enquanto)
        if (['t_num', 't_num_decimal', 't_string', 't_identificador'].includes(tokens[i].tipo)) {
          const valorExpr = tokens[i].lexema;
          codigoIntermediario.push(`${identificador.lexema} = ${valorExpr}`);
        }
      } else {
        // Declaração sem inicialização
        codigoIntermediario.push(`${identificador.lexema} = 0 // variável não inicializada`);
        i += 2; // Pula para depois do tipo
      }
    }
    
    // Atribuição simples
    else if (token.tipo === 't_identificador' && i + 2 < tokens.length && tokens[i + 1].tipo === 't_atribuicao') {
      const identificador = token.lexema;
      const expInicial = i + 2;
      let expFinal = expInicial;
      let tempVars = [];
      
      // Encontrar o final da expressão (até o ponto-e-vírgula)
      while (expFinal < tokens.length && tokens[expFinal].tipo !== 't_pv') {
        expFinal++;
      }

      // Se a expressão é muito simples (apenas um valor)
      if (expFinal - expInicial === 1) {
        const valorExpr = tokens[expInicial].lexema;
        codigoIntermediario.push(`${identificador} = ${valorExpr}`);
        i = expFinal; // Avança até o ponto-e-vírgula
        continue;
      }
      
      // Processa expressões mais complexas
      let j = expInicial;
      while (j < expFinal) {
        // Expressão entre parênteses
        if (tokens[j].tipo === 't_abre_par') {
          const inicioParenteses = j;
          let contadorPar = 1;
          j++;
          
          // Encontra o fechamento do parêntese
          while (j < expFinal && contadorPar > 0) {
            if (tokens[j].tipo === 't_abre_par') contadorPar++;
            if (tokens[j].tipo === 't_fecha_par') contadorPar--;
            j++;
          }
          
          const fimParenteses = j - 1;
          if (fimParenteses > inicioParenteses + 1) {
            const tempVar = gerarTemp();
            // Processamento da expressão dentro dos parênteses (recursivamente)
            // Simplificação: apenas atribuição do conteúdo a uma var temporária
            codigoIntermediario.push(`${tempVar} = (expressão complexa em parênteses)`);
            tempVars.push(tempVar);
          }
        }
        // Expressão com operador binário
        else if (j + 2 < expFinal && ehOperador(tokens[j + 1].tipo)) {
          const operando1 = tokens[j].lexema;
          const operador = converterOperador(tokens[j + 1].tipo);
          const operando2 = tokens[j + 2].lexema;
          const tempVar = gerarTemp();
          codigoIntermediario.push(`${tempVar} = ${operando1} ${operador} ${operando2}`);
          tempVars.push(tempVar);
          j += 3;
        }
        // Outros casos
        else {
          j++;
        }
      }

      // Atribuição do resultado final
      if (tempVars.length > 0) {
        codigoIntermediario.push(`${identificador} = ${tempVars[tempVars.length - 1]}`);
      }
      
      i = expFinal; // Avança até o ponto-e-vírgula
    }
    
    // Estrutura condicional (if-else)
    else if (token.tipo === 't_se') {
      const rotuloPulaElse = gerarRotulo();
      const rotuloFimIf = gerarRotulo();
      pilhaRotulos.push({ pulaElse: rotuloPulaElse, fimIf: rotuloFimIf });
      
      // Avança para a condição 
      i += 2; // Pula "se" e "("
      
      if (i + 2 < tokens.length && tokens[i + 1].tipo.startsWith('t_')) {
        const operando1 = tokens[i].lexema;
        const operador = converterOperador(tokens[i + 1].tipo);
        const operando2 = tokens[i + 2].lexema;
        codigoIntermediario.push(`if ${operando1} ${operador} ${operando2} goto ${rotuloPulaElse}`);
        codigoIntermediario.push(`goto ${rotuloFimIf}`);
        codigoIntermediario.push(`${rotuloPulaElse}:`);
      }
      
      // Avança até achar o fecha parênteses
      while (i < tokens.length && tokens[i].tipo !== 't_fecha_par') {
        i++;
      }
    }
    
    // Encontrou um "else"
    else if (token.tipo === 't_senao' && pilhaRotulos.length > 0) {
      const rotulos = pilhaRotulos.pop();
      codigoIntermediario.push(`goto ${rotulos.fimIf}`);
      codigoIntermediario.push(`${rotulos.pulaElse}:`);
    }
    
    // Encontrou um "}" que pode fechar um bloco if-else
    else if (token.tipo === 't_fecha_chave' && pilhaRotulos.length > 0) {
      const rotulos = pilhaRotulos.pop();
      codigoIntermediario.push(`${rotulos.fimIf}:`);
    }
    
    // Laços de repetição (while)
    else if (token.tipo === 't_enquanto') {
      const rotuloInicio = gerarRotulo();
      const rotuloFim = gerarRotulo();
      pilhaRotulos.push({ inicio: rotuloInicio, fim: rotuloFim });
      
      codigoIntermediario.push(`${rotuloInicio}:`);
      
      // Avança para a condição
      i += 2; // Pula "enquanto" e "("
      
      if (i + 2 < tokens.length && tokens[i + 1].tipo.startsWith('t_')) {
        const operando1 = tokens[i].lexema;
        const operador = converterOperador(tokens[i + 1].tipo);
        const operando2 = tokens[i + 2].lexema;
        codigoIntermediario.push(`if not (${operando1} ${operador} ${operando2}) goto ${rotuloFim}`);
      }
      
      // Avança até achar o fecha parênteses
      while (i < tokens.length && tokens[i].tipo !== 't_fecha_par') {
        i++;
      }
    }
    
    // Chamada de função
    else if (token.tipo === 't_identificador' && i + 1 < tokens.length && tokens[i + 1].tipo === 't_abre_par') {
      const nomeFuncao = token.lexema;
      const args = [];
      
      // Coleta argumentos
      let j = i + 2;
      while (j < tokens.length && tokens[j].tipo !== 't_fecha_par') {
        if (['t_identificador', 't_num', 't_num_decimal', 't_string'].includes(tokens[j].tipo)) {
          args.push(tokens[j].lexema);
        }
        j++;
      }
      
      // Gera código para passagem de parâmetros e chamada
      for (let k = 0; k < args.length; k++) {
        codigoIntermediario.push(`param ${args[k]}`);
      }
      
      const tempVar = gerarTemp();
      codigoIntermediario.push(`${tempVar} = call ${nomeFuncao}, ${args.length}`);
      
      i = j; // Avança para depois do fecha parênteses
    }
  }
  
  return { codigoIntermediario, erros };
};