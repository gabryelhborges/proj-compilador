export function traduzirParaSimpSIM(codigoIntermediario) {
  if (!Array.isArray(codigoIntermediario) || codigoIntermediario.length === 0) {
    return {
      codigoAssembly: [],
      mapeamentoVariaveis: {},
      informacoes: "Nenhum código intermediário para traduzir."
    };
  }

  const codigoAssembly = [];
  const mapeamentoVariaveis = {};
  const variaveisTemporarias = new Set();
  let contadorRegistrador = 1; // R1, R2, R3, etc.
  let contadorLabelMultiplicacao = 1;
  
  // Adicionar cabeçalho com comentários explicativos
  codigoAssembly.push("; Código Assembly SimpSIM gerado automaticamente");
  codigoAssembly.push("; Mapeamento de registradores:");
  codigoAssembly.push("; R0: Registrador de comparação para saltos condicionais");
  codigoAssembly.push("; R1-RF: Variáveis e temporárias do programa");
  codigoAssembly.push("");

  // Primeira passada: identificar todas as variáveis e temporárias
  for (const linha of codigoIntermediario) {
    const linhaLimpa = linha.trim();
    if (!linhaLimpa || linhaLimpa.startsWith(';') || linhaLimpa.endsWith(':')) continue;

    // Extrair variáveis de atribuições (lado esquerdo)
    const matchAtribuicao = linhaLimpa.match(/^(\w+)\s*:=\s*(.+)$/);
    if (matchAtribuicao) {
      const [, variavel] = matchAtribuicao;
      if (!mapeamentoVariaveis[variavel]) {
        mapeamentoVariaveis[variavel] = `R${contadorRegistrador++}`;
        if (variavel.startsWith('t')) {
          variaveisTemporarias.add(variavel);
        }
      }
    }

    // Extrair variáveis de expressões (lado direito)
    const variaveisUsadas = extrairVariaveis(linhaLimpa);
    for (const variavel of variaveisUsadas) {
      if (!mapeamentoVariaveis[variavel]) {
        mapeamentoVariaveis[variavel] = `R${contadorRegistrador++}`;
        if (variavel.startsWith('t')) {
          variaveisTemporarias.add(variavel);
        }
      }
    }
  }

  // Adicionar mapeamento de variáveis aos comentários
  for (const [variavel, registrador] of Object.entries(mapeamentoVariaveis)) {
    const tipo = variaveisTemporarias.has(variavel) ? "(temporária)" : "(variável)";
    codigoAssembly.push(`; ${registrador}: ${variavel} ${tipo}`);
  }
  codigoAssembly.push("");

  // Segunda passada: traduzir cada instrução
  for (let i = 0; i < codigoIntermediario.length; i++) {
    const linha = codigoIntermediario[i].trim();
    
    if (!linha || linha.startsWith(';')) {
      codigoAssembly.push(linha); // Preservar comentários e linhas vazias
      continue;
    }

    // Labels
    if (linha.endsWith(':')) {
      codigoAssembly.push(linha);
      continue;
    }

    // Atribuições
    const matchAtribuicao = linha.match(/^(\w+)\s*:=\s*(.+)$/);
    if (matchAtribuicao) {
      const [, variavel, expressao] = matchAtribuicao;
      const resultado = traduzirAtribuicao(variavel, expressao, mapeamentoVariaveis, contadorLabelMultiplicacao);
      codigoAssembly.push(...resultado.instrucoes);
      contadorLabelMultiplicacao = resultado.novoContadorLabel;
      continue;
    }

    // Saltos condicionais
    const matchIf = linha.match(/^if\s+(.+?)\s+goto\s+(\w+)$/);
    if (matchIf) {
      const [, condicao, label] = matchIf;
      const instrucoes = traduzirSaltoCondicional(condicao, label, mapeamentoVariaveis);
      codigoAssembly.push(...instrucoes);
      continue;
    }

    // Saltos incondicionais
    const matchGoto = linha.match(/^goto\s+(\w+)$/);
    if (matchGoto) {
      const [, label] = matchGoto;
      codigoAssembly.push(`jmp ${label}`);
      continue;
    }

    // Chamadas de função
    const matchCall = linha.match(/^call\s+(\w+)(?:\(([^)]*)\))?$/);
    if (matchCall) {
      const [, nomeFuncao, argumentos] = matchCall;
      codigoAssembly.push(`; Chamada de função: ${nomeFuncao}`);
      if (argumentos) {
        codigoAssembly.push(`; Argumentos: ${argumentos}`);
      }
      codigoAssembly.push(`call ${nomeFuncao}`);
      continue;
    }

    // Return
    const matchReturn = linha.match(/^return(?:\s+(.+))?$/);
    if (matchReturn) {
      const [, valor] = matchReturn;
      if (valor) {
        codigoAssembly.push(`; Retornar valor: ${valor}`);
        const reg = obterRegistradorOuValor(valor, mapeamentoVariaveis);
        codigoAssembly.push(`move RF, ${reg} ; RF usado para valor de retorno`);
      }
      codigoAssembly.push(`halt ; Fim da função/programa`);
      continue;
    }

    // Instrução não reconhecida
    codigoAssembly.push(`; INSTRUÇÃO NÃO RECONHECIDA: ${linha}`);
  }

  // Adicionar halt no final se não houver
  if (!codigoAssembly.some(linha => linha.includes('halt'))) {
    codigoAssembly.push("");
    codigoAssembly.push("halt ; Fim do programa");
  }

  return {
    codigoAssembly,
    mapeamentoVariaveis,
    informacoes: `Tradução concluída. ${Object.keys(mapeamentoVariaveis).length} variáveis mapeadas.`
  };
}

function traduzirAtribuicao(variavel, expressao, mapeamentoVariaveis, contadorLabel) {
  const instrucoes = [];
  const regDestino = mapeamentoVariaveis[variavel];

  // Atribuição simples de constante
  const matchConstante = expressao.match(/^(-?\d+(?:\.\d+)?)$/);
  if (matchConstante) {
    const [, valor] = matchConstante;
    instrucoes.push(`load ${regDestino}, ${valor} ; ${variavel} := ${valor}`);
    return { instrucoes, novoContadorLabel: contadorLabel };
  }

  // Atribuição simples de variável
  const matchVariavel = expressao.match(/^(\w+)$/);
  if (matchVariavel) {
    const [, varOrigem] = matchVariavel;
    const regOrigem = mapeamentoVariaveis[varOrigem];
    instrucoes.push(`move ${regDestino}, ${regOrigem} ; ${variavel} := ${varOrigem}`);
    return { instrucoes, novoContadorLabel: contadorLabel };
  }

  // Operações aritméticas binárias
  const matchBinaria = expressao.match(/^(\w+|\d+)\s*([\+\-\*\/])\s*(\w+|\d+)$/);
  if (matchBinaria) {
    const [, operando1, operador, operando2] = matchBinaria;
    
    switch (operador) {
      case '+':
        const reg1 = obterRegistradorOuValor(operando1, mapeamentoVariaveis);
        const reg2 = obterRegistradorOuValor(operando2, mapeamentoVariaveis);
        
        // Se um dos operandos for uma constante, carregá-la primeiro
        if (isConstante(operando1) && isConstante(operando2)) {
          // Ambos são constantes
          const valor = parseInt(operando1) + parseInt(operando2);
          instrucoes.push(`load ${regDestino}, ${valor} ; ${variavel} := ${operando1} + ${operando2}`);
        } else if (isConstante(operando1)) {
          // operando1 é constante, operando2 é variável
          instrucoes.push(`load R0, ${operando1} ; Carrega constante ${operando1}`);
          instrucoes.push(`addi ${regDestino}, R0, ${reg2} ; ${variavel} := ${operando1} + ${operando2}`);
        } else if (isConstante(operando2)) {
          // operando1 é variável, operando2 é constante
          instrucoes.push(`load R0, ${operando2} ; Carrega constante ${operando2}`);
          instrucoes.push(`addi ${regDestino}, ${reg1}, R0 ; ${variavel} := ${operando1} + ${operando2}`);
        } else {
          // Ambos são variáveis
          instrucoes.push(`addi ${regDestino}, ${reg1}, ${reg2} ; ${variavel} := ${operando1} + ${operando2}`);
        }
        break;

      case '-':
        instrucoes.push(`; Subtração: ${variavel} := ${operando1} - ${operando2}`);
        const regSub1 = obterRegistradorOuValor(operando1, mapeamentoVariaveis);
        
        if (isConstante(operando2)) {
          const valorNegativo = -parseInt(operando2);
          instrucoes.push(`load R0, ${valorNegativo} ; Carrega -${operando2}`);
          if (isConstante(operando1)) {
            instrucoes.push(`load RF, ${operando1} ; Carrega ${operando1}`);
            instrucoes.push(`addi ${regDestino}, RF, R0 ; ${variavel} := ${operando1} + (${valorNegativo})`);
          } else {
            instrucoes.push(`addi ${regDestino}, ${regSub1}, R0 ; ${variavel} := ${operando1} + (${valorNegativo})`);
          }
        } else {
          const regSub2 = obterRegistradorOuValor(operando2, mapeamentoVariaveis);
          instrucoes.push(`load R0, -1 ; Carrega -1 para negar`);
          instrucoes.push(`load RF, 0 ; Carrega 0`);
          instrucoes.push(`addi RF, RF, R0 ; RF = -1`);
          instrucoes.push(`addi RF, RF, ${regSub2} ; RF = -${operando2} (equivale a 0 - 1 * ${operando2})`);
          
          if (isConstante(operando1)) {
            instrucoes.push(`load R0, ${operando1} ; Carrega ${operando1}`);
            instrucoes.push(`addi ${regDestino}, R0, RF ; ${variavel} := ${operando1} + (-${operando2})`);
          } else {
            instrucoes.push(`addi ${regDestino}, ${regSub1}, RF ; ${variavel} := ${operando1} + (-${operando2})`);
          }
        }
        break;

      case '*':
        const resultado = traduzirMultiplicacao(variavel, operando1, operando2, mapeamentoVariaveis, contadorLabel);
        instrucoes.push(...resultado.instrucoes);
        contadorLabel = resultado.novoContadorLabel;
        break;

      case '/':
        const resultadoDiv = traduzirDivisao(variavel, operando1, operando2, mapeamentoVariaveis, contadorLabel);
        instrucoes.push(...resultadoDiv.instrucoes);
        contadorLabel = resultadoDiv.novoContadorLabel;
        break;

      default:
        instrucoes.push(`; OPERADOR DESCONHECIDO: ${operador}`);
        break;
    }
  } else {
    instrucoes.push(`; EXPRESSÃO NÃO RECONHECIDA: ${expressao}`);
    instrucoes.push(`load ${regDestino}, 0 ; Valor padrão`);
  }

  return { instrucoes, novoContadorLabel: contadorLabel };
}

function traduzirMultiplicacao(variavel, operando1, operando2, mapeamentoVariaveis, contadorLabel) {
  const instrucoes = [];
  const regDestino = mapeamentoVariaveis[variavel];
  const labelLoop = `Loop_Mul_${contadorLabel}`;
  const labelFim = `Fim_Mul_${contadorLabel}`;
  
  instrucoes.push(`; Multiplicação: ${variavel} := ${operando1} * ${operando2}`);
  
  // Determinar multiplicando e multiplicador
  let regMultiplicando, multiplicador;
  
  if (isConstante(operando1) && isConstante(operando2)) {
    // Ambos são constantes - calcular diretamente
    const resultado = parseInt(operando1) * parseInt(operando2);
    instrucoes.push(`load ${regDestino}, ${resultado} ; ${variavel} := ${operando1} * ${operando2} (calculado)`);
    return { instrucoes, novoContadorLabel: contadorLabel + 1 };
  }
  
  if (isConstante(operando1)) {
    regMultiplicando = mapeamentoVariaveis[operando2];
    multiplicador = operando1;
  } else if (isConstante(operando2)) {
    regMultiplicando = mapeamentoVariaveis[operando1];
    multiplicador = operando2;
  } else {
    // Ambos são variáveis - usar operando2 como multiplicador
    regMultiplicando = mapeamentoVariaveis[operando1];
    multiplicador = mapeamentoVariaveis[operando2];
  }
  
  if (isConstante(multiplicador)) {
    // Multiplicador é constante
    instrucoes.push(`load RE, ${multiplicador} ; Contador do multiplicador`);
    instrucoes.push(`load ${regDestino}, 0 ; Inicializa resultado`);
    instrucoes.push(`load RD, -1 ; Constante para decrementar`);
    instrucoes.push(`load R0, 0 ; Para comparação`);
    
    instrucoes.push(`${labelLoop}:`);
    instrucoes.push(`    jmpEQ RE = R0, ${labelFim} ; Se contador == 0, fim`);
    instrucoes.push(`    addi ${regDestino}, ${regDestino}, ${regMultiplicando} ; Acumula`);
    instrucoes.push(`    addi RE, RE, RD ; Decrementa contador`);
    instrucoes.push(`    jmp ${labelLoop}`);
    instrucoes.push(`${labelFim}:`);
  } else {
    // Ambos são variáveis
    instrucoes.push(`load ${regDestino}, 0 ; Inicializa resultado`);
    instrucoes.push(`move RF, ${multiplicador} ; Copia multiplicador para contador`);
    instrucoes.push(`load RD, -1 ; Constante para decrementar`);
    instrucoes.push(`load R0, 0 ; Para comparação`);
    
    instrucoes.push(`${labelLoop}:`);
    instrucoes.push(`    jmpEQ RF = R0, ${labelFim} ; Se contador == 0, fim`);
    instrucoes.push(`    addi ${regDestino}, ${regDestino}, ${regMultiplicando} ; Acumula`);
    instrucoes.push(`    addi RF, RF, RD ; Decrementa contador`);
    instrucoes.push(`    jmp ${labelLoop}`);
    instrucoes.push(`${labelFim}:`);
  }
  
  return { instrucoes, novoContadorLabel: contadorLabel + 1 };
}

function traduzirSaltoCondicional(condicao, label, mapeamentoVariaveis) {
  const instrucoes = [];
  
  // Analisar condição (ex: "x >= 3", "t1 < y")
  const matchCondicao = condicao.match(/^(\w+|\d+)\s*(>=|<=|>|<|==|!=)\s*(\w+|\d+)$/);
  if (!matchCondicao) {
    instrucoes.push(`; CONDIÇÃO NÃO RECONHECIDA: ${condicao}`);
    instrucoes.push(`jmp ${label} ; Salto incondicional por segurança`);
    return instrucoes;
  }
  
  const [, operando1, operador, operando2] = matchCondicao;
  const labelPular = `Pular_${label}_${Math.random().toString(36).substr(2, 5)}`;
  
  instrucoes.push(`; if ${condicao} goto ${label}`);
  
  const reg1 = obterRegistradorOuValor(operando1, mapeamentoVariaveis);
  const reg2 = obterRegistradorOuValor(operando2, mapeamentoVariaveis);
  
  switch (operador) {
    case '>=':
      // x >= 3 equivale a !(x < 3) que é !(x <= 2)
      // Se x <= (3-1), pula o salto para label
      if (isConstante(operando2)) {
        const valorComparacao = parseInt(operando2) - 1;
        instrucoes.push(`load R0, ${valorComparacao} ; Carrega ${operando2} - 1`);
        if (isConstante(operando1)) {
          instrucoes.push(`load RF, ${operando1} ; Carrega ${operando1}`);
          instrucoes.push(`jmpLE RF <= R0, ${labelPular} ; Se ${operando1} <= ${valorComparacao}, pula salto`);
        } else {
          instrucoes.push(`jmpLE ${reg1} <= R0, ${labelPular} ; Se ${operando1} <= ${valorComparacao}, pula salto`);
        }
      } else {
        // Comparação entre variáveis - mais complexo
        instrucoes.push(`; Comparação complexa ${operando1} >= ${operando2}`);
        instrucoes.push(`load R0, -1 ; Carrega -1`);
        if (isConstante(operando1)) {
          instrucoes.push(`load RF, ${operando1} ; Carrega ${operando1}`);
          instrucoes.push(`addi RF, ${reg2}, R0 ; RF = ${operando2} - 1`);
          instrucoes.push(`jmpLE RF <= R0, ${labelPular} ; Se ${operando1} <= (${operando2} - 1), pula`);
        } else {
          instrucoes.push(`addi R0, ${reg2}, R0 ; R0 = ${operando2} - 1`);
          instrucoes.push(`jmpLE ${reg1} <= R0, ${labelPular} ; Se ${operando1} <= (${operando2} - 1), pula`);
        }
      }
      instrucoes.push(`jmp ${label} ; Condição verdadeira, salto para ${label}`);
      instrucoes.push(`${labelPular}:`);
      break;
      
    case '<=':
      // x <= 3 - tradução direta
      if (isConstante(operando2)) {
        instrucoes.push(`load R0, ${operando2} ; Carrega ${operando2}`);
        if (isConstante(operando1)) {
          instrucoes.push(`load RF, ${operando1} ; Carrega ${operando1}`);
          instrucoes.push(`jmpLE RF <= R0, ${label} ; Se ${operando1} <= ${operando2}, salto`);
        } else {
          instrucoes.push(`jmpLE ${reg1} <= R0, ${label} ; Se ${operando1} <= ${operando2}, salto`);
        }
      } else {
        instrucoes.push(`; Comparação entre variáveis ${operando1} <= ${operando2}`);
        // Implementação mais complexa seria necessária
        instrucoes.push(`jmp ${label} ; Simplificado - sempre salta`);
      }
      break;
      
    case '==':
      // x == 3 - tradução direta
      if (isConstante(operando2)) {
        instrucoes.push(`load R0, ${operando2} ; Carrega ${operando2}`);
        if (isConstante(operando1)) {
          instrucoes.push(`load RF, ${operando1} ; Carrega ${operando1}`);
          instrucoes.push(`jmpEQ RF = R0, ${label} ; Se ${operando1} == ${operando2}, salto`);
        } else {
          instrucoes.push(`jmpEQ ${reg1} = R0, ${label} ; Se ${operando1} == ${operando2}, salto`);
        }
      } else {
        instrucoes.push(`; Comparação entre variáveis ${operando1} == ${operando2}`);
        // Implementação mais complexa seria necessária
        instrucoes.push(`jmp ${label} ; Simplificado - sempre salta`);
      }
      break;
      
    default:
      instrucoes.push(`; OPERADOR DE COMPARAÇÃO NÃO IMPLEMENTADO: ${operador}`);
      instrucoes.push(`jmp ${label} ; Salto incondicional por segurança`);
      break;
  }
  
  return instrucoes;
}

// Funções auxiliares
function extrairVariaveis(linha) {
  const variaveis = new Set();
  const matches = linha.match(/\b[a-zA-Z_]\w*\b/g);
  if (matches) {
    matches.forEach(match => {
      if (!/^(if|goto|call|return|load|store|move|addi|jmp|jmpEQ|jmpLE|halt)$/.test(match)) {
        variaveis.add(match);
      }
    });
  }
  return variaveis;
}

function isConstante(valor) {
  return /^-?\d+(?:\.\d+)?$/.test(valor);
}

function obterRegistradorOuValor(operando, mapeamentoVariaveis) {
  if (isConstante(operando)) {
    return operando;
  }
  return mapeamentoVariaveis[operando] || operando;
}

function traduzirDivisao(variavel, operando1, operando2, mapeamentoVariaveis, contadorLabel) {
  const instrucoes = [];
  const regDestino = mapeamentoVariaveis[variavel];
  const labelLoop = `Loop_Div_${contadorLabel}`;
  const labelFim = `Fim_Div_${contadorLabel}`;
  const labelErroDivZero = `Erro_Div_Zero_${contadorLabel}`;
  
  instrucoes.push(`; Divisão: ${variavel} := ${operando1} / ${operando2}`);
  
  // Verificar divisão por zero primeiro
  if (isConstante(operando2)) {
    if (parseInt(operando2) === 0) {
      instrucoes.push(`; ERRO: Divisão por zero detectada!`);
      instrucoes.push(`load ${regDestino}, 0 ; Resultado = 0 por segurança`);
      return { instrucoes, novoContadorLabel: contadorLabel + 1 };
    }
  } else {
    // Verificar se divisor é zero em tempo de execução
    const regDivisor = mapeamentoVariaveis[operando2];
    instrucoes.push(`load R0, 0 ; Para comparação com zero`);
    instrucoes.push(`jmpEQ ${regDivisor} = R0, ${labelErroDivZero} ; Se divisor == 0, vai para erro`);
  }
  
  // Ambos são constantes - calcular diretamente
  if (isConstante(operando1) && isConstante(operando2)) {
    const resultado = Math.floor(parseInt(operando1) / parseInt(operando2));
    instrucoes.push(`load ${regDestino}, ${resultado} ; ${variavel} := ${operando1} / ${operando2} (calculado)`);
    return { instrucoes, novoContadorLabel: contadorLabel + 1 };
  }
  
  // Preparar registradores para divisão
  let regDividendo, regDivisor;
  
  if (isConstante(operando1)) {
    instrucoes.push(`load RF, ${operando1} ; Carrega dividendo ${operando1}`);
    regDividendo = 'RF';
  } else {
    regDividendo = mapeamentoVariaveis[operando1];
    instrucoes.push(`move RF, ${regDividendo} ; Copia dividendo para RF`);
    regDividendo = 'RF';
  }
  
  if (isConstante(operando2)) {
    instrucoes.push(`load RE, ${operando2} ; Carrega divisor ${operando2}`);
    regDivisor = 'RE';
  } else {
    regDivisor = mapeamentoVariaveis[operando2];
    instrucoes.push(`move RE, ${regDivisor} ; Copia divisor para RE`);
    regDivisor = 'RE';
  }
  
  // Inicializar registradores auxiliares
  instrucoes.push(`load ${regDestino}, 0 ; Inicializa quociente = 0`);
  instrucoes.push(`load RD, -1 ; Constante -1`);
  
  // Calcular -divisor para subtração usando sintaxe correta do SimpSIM
  instrucoes.push(`; Calcular negativo do divisor para subtração`);
  instrucoes.push(`load RC, 255 ; Máscara para complemento de 1 (255 = 0xFF)`);
  instrucoes.push(`xor RC, ${regDivisor}, RC ; RC = ~divisor (complemento de 1)`);
  instrucoes.push(`move RB, RC ; RB = ~divisor`);
  instrucoes.push(`load RC, 1 ; Constante 1`);
  instrucoes.push(`addi RB, RB, RC ; RB = -divisor (complemento de 2)`);
  
  // Loop principal da divisão
  instrucoes.push(`${labelLoop}:`);
  instrucoes.push(`    ; Verificar se dividendo < divisor`);
  instrucoes.push(`    ; Se dividendo <= (divisor - 1), então dividendo < divisor`);
  instrucoes.push(`    move RA, ${regDivisor} ; RA = divisor`);
  instrucoes.push(`    load RC, -1 ; Carrega -1`);
  instrucoes.push(`    addi RA, RA, RC ; RA = divisor - 1`);
  instrucoes.push(`    ; Calcular diferença: dividendo - (divisor - 1)`);
  instrucoes.push(`    load RC, -1 ; Carrega -1`);
  instrucoes.push(`    addi RC, RA, RC ; RC = -(divisor - 1)`);
  instrucoes.push(`    addi RC, ${regDividendo}, RC ; RC = dividendo - (divisor - 1)`);
  instrucoes.push(`    load R0, 0 ; Carrega 0 no R0 para comparação`);
  instrucoes.push(`    jmpLE RC <= R0, ${labelFim} ; Se RC <= 0, fim`);
  
  instrucoes.push(`    ; dividendo >= divisor: subtrai e incrementa quociente`);
  instrucoes.push(`    addi ${regDividendo}, ${regDividendo}, RB ; dividendo = dividendo - divisor`);
  instrucoes.push(`    load RC, 1 ; Constante 1`);
  instrucoes.push(`    addi ${regDestino}, ${regDestino}, RC ; quociente++`);
  instrucoes.push(`    jmp ${labelLoop} ; Volta para o loop`);
  
  instrucoes.push(`${labelFim}:`);
  instrucoes.push(`    ; ${regDestino} contém o quociente`);
  instrucoes.push(`    ; ${regDividendo} contém o resto (não usado)`);
  
  // Tratar erro de divisão por zero (se necessário)
  if (!isConstante(operando2)) {
    instrucoes.push(`    jmp ${labelFim}_Skip ; Pula tratamento de erro`);
    instrucoes.push(`${labelErroDivZero}:`);
    instrucoes.push(`    ; Divisão por zero detectada em tempo de execução`);
    instrucoes.push(`    load ${regDestino}, 0 ; Resultado = 0 por segurança`);
    instrucoes.push(`${labelFim}_Skip:`);
  }
  
  return { instrucoes, novoContadorLabel: contadorLabel + 1 };
}