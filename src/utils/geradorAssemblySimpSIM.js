export function gerarAssemblySimpSIM(codigoOtimizado) {
  if (!Array.isArray(codigoOtimizado) || codigoOtimizado.length === 0) {
    return {
      assembly: '; Programa vazio\nhalt\n',
      variaveis: {},
      labels: {}
    };
  }

  const assembly = [];
  const variaveis = new Map(); // variavel -> endereco
  const labels = new Map(); // label -> endereco
  const registradores = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'RA', 'RB', 'RC', 'RD', 'RE', 'RF'];
  let proxRegistrador = 0;
  let enderecoMemoria = 0x20; // Começar dados em 0x20
  let enderecoInstrucoes = 0x100; // Código em 0x100

  // Cabeçalho
  assembly.push('; Código Assembly SimpSIM gerado pelo compilador');
  assembly.push('; Gerado automaticamente - não editar manualmente');
  assembly.push('');

  // Seção de dados
  assembly.push('; === SEÇÃO DE DADOS ===');
  assembly.push(`org 0x${enderecoMemoria.toString(16).toUpperCase()}`);
  assembly.push('');

  // Constantes úteis
  assembly.push('; Constantes');
  assembly.push('ZERO db 0');
  assembly.push('UM db 1');
  assembly.push('MASCARA_NEG db 0xFF');
  assembly.push('');

  // Identificar variáveis usadas no código
  const variaveisUsadas = new Set();
  for (const linha of codigoOtimizado) {
    const matches = linha.match(/\b[a-zA-Z_]\w*\b/g);
    if (matches) {
      matches.forEach(match => {
        if (!/^(if|goto|call|return|L\d+)$/.test(match)) {
          variaveisUsadas.add(match);
        }
      });
    }
  }

  // Declarar variáveis na memória
  assembly.push('; Variáveis do programa');
  for (const variavel of variaveisUsadas) {
    assembly.push(`${variavel} db 0`);
    variaveis.set(variavel, enderecoMemoria);
    enderecoMemoria++;
  }
  assembly.push('');

  // Seção de código
  assembly.push('; === SEÇÃO DE CÓDIGO ===');
  assembly.push(`org 0x${enderecoInstrucoes.toString(16).toUpperCase()}`);
  assembly.push('');

  assembly.push('main:');
  assembly.push('    ; Inicializar R0 com zero para comparações');
  assembly.push('    load R0, [ZERO]');
  assembly.push('');

  // Traduzir cada linha do código intermediário
  for (let i = 0; i < codigoOtimizado.length; i++) {
    const linha = codigoOtimizado[i].trim();
    
    if (!linha || linha.startsWith(';')) {
      assembly.push(`    ${linha}`);
      continue;
    }

    assembly.push(`    ; ${linha}`);
    
    // Labels
    if (linha.endsWith(':')) {
      const label = linha.slice(0, -1);
      assembly.push(`${label}:`);
      labels.set(label, assembly.length - 1);
      continue;
    }

    // Atribuições
    const matchAtribuicao = linha.match(/^(\w+)\s*:=\s*(.+)$/);
    if (matchAtribuicao) {
      const [, variavel, expressao] = matchAtribuicao;
      traduzirAtribuicao(assembly, variavel, expressao, registradores, proxRegistrador);
      continue;
    }

    // Saltos condicionais
    const matchIf = linha.match(/^if\s+(.+?)\s+(==|!=|<|>|<=|>=)\s+(.+?)\s+goto\s+(\w+)$/);
    if (matchIf) {
      const [, esquerda, operador, direita, label] = matchIf;
      traduzirSaltoCondicional(assembly, esquerda, operador, direita, label, registradores, proxRegistrador);
      continue;
    }

    // Saltos incondicionais
    const matchGoto = linha.match(/^goto\s+(\w+)$/);
    if (matchGoto) {
      const [, label] = matchGoto;
      assembly.push(`    jmp ${label}`);
      continue;
    }

    // Chamadas de função
    const matchCall = linha.match(/^call\s+(\w+)(?:\((.+)\))?$/);
    if (matchCall) {
      const [, funcao, argumentos] = matchCall;
      traduzirChamadaFuncao(assembly, funcao, argumentos, registradores, proxRegistrador);
      continue;
    }

    // Return
    const matchReturn = linha.match(/^return(?:\s+(.+))?$/);
    if (matchReturn) {
      const [, valor] = matchReturn;
      traduzirReturn(assembly, valor, registradores, proxRegistrador);
      continue;
    }

    // Linha não reconhecida
    assembly.push(`    ; LINHA NÃO TRADUZIDA: ${linha}`);
  }

  // Finalizar programa
  assembly.push('');
  assembly.push('fim_programa:');
  assembly.push('    halt');
  assembly.push('');

  // Sub-rotinas auxiliares
  adicionarSubrotinasDivisao(assembly);
  adicionarSubrotinasMultiplicacao(assembly);

  return {
    assembly: assembly.join('\n'),
    variaveis: Object.fromEntries(variaveis),
    labels: Object.fromEntries(labels)
  };
}

function traduzirAtribuicao(assembly, variavel, expressao, registradores, proxRegistrador) {
  // Expressão simples (número ou variável)
  if (/^\w+$/.test(expressao) || /^\d+$/.test(expressao)) {
    if (/^\d+$/.test(expressao)) {
      assembly.push(`    load R1, ${expressao}`);
    } else {
      assembly.push(`    load R1, [${expressao}]`);
    }
    assembly.push(`    store R1, [${variavel}]`);
    return;
  }

  // Expressão aritmética binária
  const matchAritmetica = expressao.match(/^(.+?)\s*([\+\-\*\/])\s*(.+)$/);
  if (matchAritmetica) {
    const [, esquerda, operador, direita] = matchAritmetica;
    
    // Carregar operandos
    if (/^\d+$/.test(esquerda)) {
      assembly.push(`    load R1, ${esquerda}`);
    } else {
      assembly.push(`    load R1, [${esquerda}]`);
    }
    
    if (/^\d+$/.test(direita)) {
      assembly.push(`    load R2, ${direita}`);
    } else {
      assembly.push(`    load R2, [${direita}]`);
    }
    
    // Executar operação
    switch (operador) {
      case '+':
        assembly.push(`    addi R3, R1, R2`);
        break;
      case '-':
        assembly.push(`    ; Subtração usando complemento de 2`);
        assembly.push(`    load R4, [MASCARA_NEG]`);
        assembly.push(`    xor R2, R2, R4`);
        assembly.push(`    load R4, [UM]`);
        assembly.push(`    addi R2, R2, R4`);
        assembly.push(`    addi R3, R1, R2`);
        break;
      case '*':
        assembly.push(`    ; Multiplicação por somas sucessivas`);
        assembly.push(`    move R3, R1`);
        assembly.push(`    move R4, R2`);
        assembly.push(`    jmp mult_subroutine`);
        break;
      case '/':
        assembly.push(`    ; Divisão por subtrações sucessivas`);
        assembly.push(`    move R3, R1`);
        assembly.push(`    move R4, R2`);
        assembly.push(`    jmp div_subroutine`);
        break;
    }
    
    assembly.push(`    store R3, [${variavel}]`);
    return;
  }

  // Expressão não reconhecida
  assembly.push(`    ; EXPRESSÃO NÃO TRADUZIDA: ${expressao}`);
}

function traduzirSaltoCondicional(assembly, esquerda, operador, direita, label, registradores, proxRegistrador) {
  // Carregar operandos
  if (/^\d+$/.test(esquerda)) {
    assembly.push(`    load R1, ${esquerda}`);
  } else {
    assembly.push(`    load R1, [${esquerda}]`);
  }
  
  if (/^\d+$/.test(direita)) {
    assembly.push(`    load R2, ${direita}`);
  } else {
    assembly.push(`    load R2, [${direita}]`);
  }
  
  // Calcular diferença (R1 - R2)
  assembly.push(`    ; Calcular R1 - R2 para comparação`);
  assembly.push(`    load R4, [MASCARA_NEG]`);
  assembly.push(`    xor R2, R2, R4`);
  assembly.push(`    load R4, [UM]`);
  assembly.push(`    addi R2, R2, R4`);
  assembly.push(`    addi R3, R1, R2`);
  
  // Salto baseado no operador
  switch (operador) {
    case '==':
      assembly.push(`    jmpEQ R3=R0, ${label}`);
      break;
    case '!=':
      assembly.push(`    jmpEQ R3=R0, skip_${label}`);
      assembly.push(`    jmp ${label}`);
      assembly.push(`skip_${label}:`);
      break;
    case '<':
      // R3 < 0: usar bit de sinal (assumindo complemento de 2)
      assembly.push(`    load R4, 0x80`);
      assembly.push(`    and R5, R3, R4`);
      assembly.push(`    jmpEQ R5=R4, ${label}`);
      break;
    case '<=':
      assembly.push(`    jmpLE R3<=R0, ${label}`);
      break;
    case '>':
      assembly.push(`    jmpLE R3<=R0, skip_${label}`);
      assembly.push(`    jmp ${label}`);
      assembly.push(`skip_${label}:`);
      break;
    case '>=':
      assembly.push(`    load R4, 0x80`);
      assembly.push(`    and R5, R3, R4`);
      assembly.push(`    jmpEQ R5=R4, skip_${label}`);
      assembly.push(`    jmp ${label}`);
      assembly.push(`skip_${label}:`);
      break;
  }
}

function traduzirChamadaFuncao(assembly, funcao, argumentos, registradores, proxRegistrador) {
  assembly.push(`    ; Chamada de função: ${funcao}`);
  if (argumentos) {
    assembly.push(`    ; Argumentos: ${argumentos}`);
    // Implementar passagem de argumentos se necessário
  }
  assembly.push(`    jmp ${funcao}`);
}

function traduzirReturn(assembly, valor, registradores, proxRegistrador) {
  if (valor) {
    if (/^\d+$/.test(valor)) {
      assembly.push(`    load RF, ${valor}`);
    } else {
      assembly.push(`    load RF, [${valor}]`);
    }
  }
  assembly.push(`    jmp fim_programa`);
}

function adicionarSubrotinasMultiplicacao(assembly) {
  assembly.push('; === SUBROTINA DE MULTIPLICAÇÃO ===');
  assembly.push('mult_subroutine:');
  assembly.push('    ; R3 = R3 * R4 (entrada: R3, R4; saída: R3)');
  assembly.push('    load R5, [ZERO]    ; Resultado = 0');
  assembly.push('    load R6, [ZERO]    ; Contador = 0');
  assembly.push('mult_loop:');
  assembly.push('    jmpEQ R6=R4, mult_end');
  assembly.push('    addi R5, R5, R3');
  assembly.push('    load R7, [UM]');
  assembly.push('    addi R6, R6, R7');
  assembly.push('    jmp mult_loop');
  assembly.push('mult_end:');
  assembly.push('    move R3, R5');
  assembly.push('    ; Retornar ao código principal seria aqui');
  assembly.push('');
}

function adicionarSubrotinasDivisao(assembly) {
  assembly.push('; === SUBROTINA DE DIVISÃO ===');
  assembly.push('div_subroutine:');
  assembly.push('    ; R3 = R3 / R4 (entrada: R3, R4; saída: R3)');
  assembly.push('    ; Verificar divisão por zero');
  assembly.push('    jmpEQ R4=R0, div_erro');
  assembly.push('    load R5, [ZERO]    ; Quociente = 0');
  assembly.push('    move R6, R3        ; Dividendo');
  assembly.push('div_loop:');
  assembly.push('    ; Verificar se dividendo < divisor');
  assembly.push('    load R7, [MASCARA_NEG]');
  assembly.push('    xor R8, R4, R7');
  assembly.push('    load R7, [UM]');
  assembly.push('    addi R8, R8, R7    ; -R4');
  assembly.push('    addi R9, R6, R8    ; R6 - R4');
  assembly.push('    load R7, 0x80');
  assembly.push('    and RA, R9, R7');
  assembly.push('    jmpEQ RA=R7, div_end  ; Se negativo, termina');
  assembly.push('    move R6, R9        ; Atualizar dividendo');
  assembly.push('    load R7, [UM]');
  assembly.push('    addi R5, R5, R7    ; Incrementar quociente');
  assembly.push('    jmp div_loop');
  assembly.push('div_end:');
  assembly.push('    move R3, R5        ; Resultado no R3');
  assembly.push('    ; Retornar ao código principal seria aqui');
  assembly.push('div_erro:');
  assembly.push('    load R3, [ZERO]    ; Resultado = 0 em caso de erro');
  assembly.push('    ; Tratar erro de divisão por zero');
  assembly.push('');
}