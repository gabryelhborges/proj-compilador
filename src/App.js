// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [tokens, setTokens] = useState([]);
  const [errors, setErrors] = useState([]);
  const [lineNumbers, setLineNumbers] = useState('1');
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Atualiza números de linha quando o código muda
  useEffect(() => {
    const lines = code.split('\n').length;
    const numbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    setLineNumbers(numbers);
  }, [code]);

  // Sincroniza a rolagem entre textarea, overlay e números de linha
  useEffect(() => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    const lineNumbers = lineNumbersRef.current;

    const syncScroll = () => {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
      lineNumbers.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, []);

  // Função do analisador léxico
  const analyzeCode = () => {
    setTokens([]);
    setErrors([]);
    
    let position = 0;
    let currentLine = 1;
    const codeWithSpace = code + ' ';
    const newTokens = [];
    const newErrors = [];

    while (position < codeWithSpace.length) {
      const result = getNextToken(codeWithSpace, position, currentLine, newErrors);
      if (result) {
        if (result.token) {
          newTokens.push(result.token);
        }
        position = result.newPosition;
        if (result.lineIncrement) {
          currentLine++;
        }
      } else {
        position++;
      }
    }

    setTokens(newTokens);
    setErrors(newErrors);
  };

  // Função para obter próximo token
  const getNextToken = (code, pos, line, errors) => {
    if (pos >= code.length) return null;
    
    let position = pos;
    const c = code[position];

    if (/\s/.test(c)) {
      return {
        token: null,
        newPosition: position + 1,
        lineIncrement: c === '\n'
      };
    }

    let lexeme = c;
    position++;

    // Identificadores e palavras-chave (deve começar com letra)
    if (/[a-zA-Z]/.test(c)) {
      while (position < code.length && /[a-zA-Z0-9_]/.test(code[position])) {
        lexeme += code[position];
        position++;
      }
      
      const keywords = {
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
        token: new Token(lexeme, keywords[lexeme] || 't_identificador', line),
        newPosition: position,
        lineIncrement: false
      };
    }

    // Números
    if (/[0-9]/.test(c)) {
      while (position < code.length && /[0-9]/.test(code[position])) {
        lexeme += code[position];
        position++;
      }
      // Verifica se há letras após o número (ex.: 123abc), o que seria um identificador mal formado
      let tempLexeme = lexeme;
      while (position < code.length && /[a-zA-Z_]/.test(code[position])) {
        tempLexeme += code[position];
        position++;
      }
      if (tempLexeme !== lexeme) {
        errors.push(`Linha ${line}: Identificador mal formado '${tempLexeme}' (não pode começar com número)`);
        return {
          token: null,
          newPosition: position,
          lineIncrement: false
        };
      }
      return {
        token: new Token(lexeme, 't_num', line),
        newPosition: position,
        lineIncrement: false
      };
    }

    const symbols = {
      '=': () => {
        if (position < code.length && code[position] === '=') {
          position++;
          return ['==', 't_igualdade'];
        }
        return ['=', 't_atribuicao'];
      },
      '<': () => {
        if (position < code.length && code[position] === '=') {
          position++;
          return ['<=', 't_menor_igual'];
        }
        return ['<', 't_menor'];
      },
      '>': () => {
        if (position < code.length && code[position] === '=') {
          position++;
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

    if (symbols[c]) {
      const [lex, type] = symbols[c]();
      return {
        token: new Token(lex, type, line),
        newPosition: position,
        lineIncrement: false
      };
    }

    errors.push(`Linha ${line}: Caractere inválido '${c}'`);
    return {
      token: null,
      newPosition: position,
      lineIncrement: false
    };
  };

  // Classe Token
  class Token {
    constructor(lexeme, type, line) {
      this.lexeme = lexeme;
      this.type = type;
      this.line = line;
    }
    
    toString() {
      return `${this.type}: ${this.lexeme} (linha ${this.line})`;
    }
  }

  // Renderização das linhas com destaque de erro
  const renderCodeLines = () => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const hasError = errors.some(err => err.includes(`Linha ${index + 1}`));
      return (
        <div 
          key={index} 
          className={`code-line ${hasError ? 'error-line' : ''}`}
        >
          {line || ' '}
        </div>
      );
    });
  };

  return (
    <div className="app">
      <div className="editor-container">
        <div className="line-numbers" ref={lineNumbersRef}>
          <pre>{lineNumbers}</pre>
        </div>
        <div className="code-editor">
          <div className="code-overlay" ref={overlayRef}>
            {renderCodeLines()}
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite seu código aqui..."
            spellCheck="false"
          />
        </div>
      </div>
      
      <button onClick={analyzeCode}>▶ Analisar</button>
      
      <div className="output-container">
        <div className="tokens">
          <h3>Tokens</h3>
          <pre>{tokens.map(t => t.toString()).join('\n')}</pre>
        </div>
        <div className="errors">
          <h3>Erros</h3>
          <pre>{errors.join('\n')}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;