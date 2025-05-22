/**
 * Módulo de otimização para o código intermediário de três endereços
 */

/**
 * Aplica várias otimizações ao código intermediário
 * @param {string[]} codigo - O código intermediário a ser otimizado
 * @returns {string[]} - O código otimizado
 */
export function otimizarCodigo(codigo) {
  if (!Array.isArray(codigo) || codigo.length === 0) {
    return codigo;
  }

  let codigoOtimizado = [...codigo];
  let otimizacoesRealizadas = 0;
  const otimizacoesOriginais = {};
  
  // Aplicar otimizações em ciclo até não haver mais mudanças
  let continuar = true;
  let iteracoes = 0;
  const MAX_ITERACOES = 10; // Limite para evitar loops infinitos

  while (continuar && iteracoes < MAX_ITERACOES) {
    iteracoes++;
    const tamanhoAnterior = codigoOtimizado.length;
    
    // 1. Eliminação de subexpressões comuns
    codigoOtimizado = eliminarSubexpressoesComuns(codigoOtimizado);
    
    // 2. Eliminação de código morto
    codigoOtimizado = eliminarCodigoMorto(codigoOtimizado);
    
    // 3. Propagação de cópias
    codigoOtimizado = propagarCopias(codigoOtimizado);
    
    // 4. Eliminação de desvios desnecessários
    codigoOtimizado = eliminarDesviosUnnecessarios(codigoOtimizado);
    
    // 5. Uso de propriedades algébricas
    codigoOtimizado = aplicarPropriedadesAlgebricas(codigoOtimizado);
    
    // 6. Simplificação de condições
    codigoOtimizado = simplificarCondicoes(codigoOtimizado);
    
    // 7. Eliminação de código redundante
    codigoOtimizado = eliminarCodigoRedundante(codigoOtimizado);

    // Verificar se houve mudança neste ciclo
    continuar = codigoOtimizado.length !== tamanhoAnterior;
    
    // Contar otimizações realizadas
    if (continuar) {
      otimizacoesRealizadas++;
    }
  }

  // Registrar as mudanças para exibição
  for (let i = 0; i < codigo.length; i++) {
    if (i >= codigoOtimizado.length || codigo[i] !== codigoOtimizado[i]) {
      otimizacoesOriginais[i] = codigo[i];
    }
  }

  return {
    codigo: codigoOtimizado,
    otimizacoesRealizadas,
    otimizacoesOriginais
  };
}

/**
 * 1. Elimina subexpressões comuns
 * @param {string[]} codigo 
 * @returns {string[]}
 */
function eliminarSubexpressoesComuns(codigo) {
  const resultado = [...codigo];
  const expressoes = new Map();
  
  // Encontrar padrões de expressões comuns: t1 := a op b
  for (let i = 0; i < resultado.length; i++) {
    const linha = resultado[i];
    
    // Verificar se é uma atribuição com operação
    const match = linha.match(/^(t\d+) := ([^ ]+) ([\+\-\*\/]) ([^ ]+)$/);
    if (match) {
      const [_, temp, op1, operador, op2] = match;
      const expressaoChave = `${op1} ${operador} ${op2}`;
      
      // Se já vimos esta expressão antes, podemos reutilizar o resultado
      if (expressoes.has(expressaoChave)) {
        const tempAnterior = expressoes.get(expressaoChave);
        
        // Substituir todas as ocorrências posteriores de temp pelo tempAnterior
        for (let j = i + 1; j < resultado.length; j++) {
          resultado[j] = resultado[j].replace(
            new RegExp(`\\b${temp}\\b`, 'g'), 
            tempAnterior
          );
        }
        
        // Remover a linha atual (expressão redundante)
        resultado.splice(i, 1);
        i--; // Ajustar o índice após a remoção
      } else {
        expressoes.set(expressaoChave, temp);
      }
    }
  }
  
  return resultado;
}

/**
 * 2. Elimina código morto (variáveis temporárias não utilizadas)
 * @param {string[]} codigo 
 * @returns {string[]}
 */
function eliminarCodigoMorto(codigo) {
  const resultado = [...codigo];
  let mudou = true;
  
  while (mudou) {
    mudou = false;
    const variaveis = new Set();
    const definicoes = new Map();
    
    // Primeiro passo: encontrar todas as variáveis usadas
    for (let i = 0; i < resultado.length; i++) {
      const linha = resultado[i];
      
      // Ignorar linhas de label ou goto
      if (linha.includes(':') || linha.startsWith('goto')) {
        continue;
      }
      
      // Encontrar variáveis usadas no lado direito ou em condições
      if (linha.includes(' := ')) {
        const partes = linha.split(' := ');
        const varDef = partes[0].trim();
        const ladoDireito = partes[1];
        
        // Armazenar definição
        definicoes.set(varDef, i);
        
        // Buscar variáveis usadas no lado direito
        const usadas = ladoDireito.match(/\b[a-zA-Z][a-zA-Z0-9_]*\b/g) || [];
        usadas.forEach(v => variaveis.add(v));
      }
      else if (linha.startsWith('if ')) {
        const usadas = linha.match(/\b[a-zA-Z][a-zA-Z0-9_]*\b/g) || [];
        usadas.forEach(v => {
          if (v !== 'if' && v !== 'goto') {
            variaveis.add(v);
          }
        });
      }
    }
    
    // Segundo passo: remover definições de temporários não usados
    for (const [varDef, indice] of definicoes.entries()) {
      // Só considerar temporários (t1, t2, etc)
      if (varDef.startsWith('t') && /^t\d+$/.test(varDef) && !variaveis.has(varDef)) {
        resultado.splice(indice, 1);
        mudou = true;
        break; // Recomeçar porque os índices mudaram
      }
    }
  }
  
  return resultado;
}

/**
 * 3. Propaga cópias simples (a := b)
 * @param {string[]} codigo 
 * @returns {string[]}
 */
function propagarCopias(codigo) {
  const resultado = [...codigo];
  const copias = new Map();
  
  for (let i = 0; i < resultado.length; i++) {
    const linha = resultado[i];
    
    // Verificar se é uma cópia simples: variável := variável
    const matchCopia = linha.match(/^([a-zA-Z][a-zA-Z0-9_]*) := ([a-zA-Z][a-zA-Z0-9_]*)$/);
    if (matchCopia) {
      const [_, destino, origem] = matchCopia;
      
      // Não considerar atribuições para si mesmo (a := a)
      if (destino !== origem) {
        copias.set(destino, origem);
        
        // Propagar a cópia para as linhas seguintes
        for (let j = i + 1; j < resultado.length; j++) {
          // Interromper propagação se destino for redefinido
          if (resultado[j].startsWith(`${destino} :=`) || 
              resultado[j].includes(`:${destino}:`)) {
            break;
          }
          
          // Substituir uso do destino pelo origem
          resultado[j] = resultado[j].replace(
            new RegExp(`\\b${destino}\\b`, 'g'),
            origem
          );
        }
      }
    }
    
    // Atualizar linha atual usando propagações anteriores
    for (const [destino, origem] of copias.entries()) {
      if (!linha.startsWith(`${destino} :=`)) {
        resultado[i] = resultado[i].replace(
          new RegExp(`\\b${destino}\\b`, 'g'),
          origem
        );
      }
    }
  }
  
  return resultado;
}

/**
 * 4. Elimina desvios desnecessários (goto para o próximo label)
 * @param {string[]} codigo 
 * @returns {string[]}
 */
function eliminarDesviosUnnecessarios(codigo) {
  const resultado = [...codigo];
  
  for (let i = 0; i < resultado.length - 1; i++) {
    // Verificar se é um goto seguido pelo label para onde ele aponta
    if (resultado[i].startsWith('goto L')) {
      const label = resultado[i].substring(5).trim();
      if (resultado[i + 1] === `${label}:`) {
        resultado.splice(i, 1); // Remover o goto desnecessário
        i--; // Ajustar índice
      }
    }
    
    // Remover goto após condição que nunca é executado
    if (resultado[i].startsWith('goto') && resultado[i + 1].endsWith(':')) {
      resultado.splice(i, 1);
      i--;
    }
  }
  
  return resultado;
}

/**
 * 5. Aplica propriedades algébricas para simplificação
 * @param {string[]} codigo 
 * @returns {string[]}
 */
function aplicarPropriedadesAlgebricas(codigo) {
  const resultado = [];
  
  for (const linha of codigo) {
    // Multiplicação por 1
    if (linha.includes(' * 1')) {
      const match = linha.match(/^(.*) := (.*) \* 1$/);
      if (match) {
        resultado.push(`${match[1]} := ${match[2]}`);
        continue;
      }
    }
    
    // Multiplicação por 0
    if (linha.includes(' * 0')) {
      const match = linha.match(/^(.*) := (.*) \* 0$/);
      if (match) {
        resultado.push(`${match[1]} := 0`);
        continue;
      }
    }
    
    // Adição com 0
    if (linha.includes(' + 0')) {
      const match = linha.match(/^(.*) := (.*) \+ 0$/);
      if (match) {
        resultado.push(`${match[1]} := ${match[2]}`);
        continue;
      }
    }
    
    // Subtração de 0
    if (linha.endsWith(' - 0')) {
      const match = linha.match(/^(.*) := (.*) - 0$/);
      if (match) {
        resultado.push(`${match[1]} := ${match[2]}`);
        continue;
      }
    }
    
    // Divisão por 1
    if (linha.endsWith(' / 1')) {
      const match = linha.match(/^(.*) := (.*) \/ 1$/);
      if (match) {
        resultado.push(`${match[1]} := ${match[2]}`);
        continue;
      }
    }
    
    resultado.push(linha);
  }
  
  return resultado;
}

/**
 * 6. Simplifica condições constantes
 * @param {string[]} codigo 
 * @returns {string[]}
 */
function simplificarCondicoes(codigo) {
  const resultado = [...codigo];
  
  for (let i = 0; i < resultado.length; i++) {
    const linha = resultado[i];
    
    // Simplificar condições constantes
    if (linha.startsWith('if ')) {
      // Condição sempre verdadeira: x == x
      const matchIgual = linha.match(/^if ([a-zA-Z0-9_]+) == \1 goto (.+)$/);
      if (matchIgual) {
        resultado[i] = `goto ${matchIgual[2]}`;
        continue;
      }
      
      // Condição sempre falsa: x != x
      const matchDif = linha.match(/^if ([a-zA-Z0-9_]+) != \1 goto (.+)$/);
      if (matchDif) {
        resultado.splice(i, 1); // Remover a condição
        i--;
        continue;
      }
      
      // Condições numéricas constantes
      const matchNum = linha.match(/^if (\d+) ([<>=!]+) (\d+) goto (.+)$/);
      if (matchNum) {
        const num1 = parseInt(matchNum[1]);
        const operador = matchNum[2];
        const num2 = parseInt(matchNum[3]);
        const label = matchNum[4];
        
        let resultado = false;
        switch (operador) {
          case '==': resultado = num1 === num2; break;
          case '!=': resultado = num1 !== num2; break;
          case '<': resultado = num1 < num2; break;
          case '<=': resultado = num1 <= num2; break;
          case '>': resultado = num1 > num2; break;
          case '>=': resultado = num1 >= num2; break;
        }
        
        if (resultado) {
          resultado[i] = `goto ${label}`;
        } else {
          resultado.splice(i, 1); // Remover a condição
          i--;
        }
      }
    }
  }
  
  return resultado;
}

/**
 * 7. Elimina código redundante (incluindo atribuições do tipo a := a)
 * @param {string[]} codigo 
 * @returns {string[]}
 */
function eliminarCodigoRedundante(codigo) {
  const resultado = [];
  
  for (let i = 0; i < codigo.length; i++) {
    const linha = codigo[i];
    
    // Eliminar atribuições redundantes: x := x
    const matchRedundante = linha.match(/^([a-zA-Z][a-zA-Z0-9_]*) := \1$/);
    if (matchRedundante) {
      continue; // Pular esta linha
    }
    
    // Eliminar duplicação de labels adjacentes
    if (linha.endsWith(':') && i > 0 && codigo[i-1].endsWith(':')) {
      // Obter todos os gotos para este label e substituir pelo anterior
      const labelAtual = linha.substring(0, linha.length - 1);
      const labelAnterior = codigo[i-1].substring(0, codigo[i-1].length - 1);
      
      // Substituir todas as referências ao label atual pelo anterior
      for (let j = 0; j < codigo.length; j++) {
        if (codigo[j].includes(`goto ${labelAtual}`)) {
          codigo[j] = codigo[j].replace(`goto ${labelAtual}`, `goto ${labelAnterior}`);
        }
      }
      continue; // Pular este label
    }
    
    resultado.push(linha);
  }
  
  return resultado;
}