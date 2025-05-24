import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import EditorCodigo from './components/EditorCodigo.jsx';
import SobreposicaoCodigo from './components/SobreposicaoCodigo.jsx';
import NúmerosLinha from './components/NúmerosLinha.jsx';
import SaidaAnalise from './components/SaidaAnalise.jsx';
import BotaoAnalise from './components/BotaoAnalise.jsx';
import { analisarCodigo } from './utils/analisadorLexico.js';
import { analisarSintatico } from './utils/analisadorSintatico.js';
import { analisarSemantico } from './utils/analisadorSemantico.js';
import { gerarCodigoIntermediario } from './utils/geradorCodigoIntermediario.js';
import { traduzirParaSimpSIM } from './utils/tradutorSimpSIM.js';

function App() {
  const [código, setCódigo] = useState('');
  const [tokens, setTokens] = useState([]);
  const [erros, setErros] = useState([]);
  const [númerosLinha, setNúmerosLinha] = useState('1');
  const [tabelaSimbolos, setTabelaSimbolos] = useState([]);
  const [analisando, setAnalisando] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [codigoIntermediario, setCodigoIntermediario] = useState([]);

  const refTextArea = useRef(null);
  const refSobreposição = useRef(null);
  const refNúmerosLinha = useRef(null);
  const fileInputRef = useRef(null);

  // Atualiza números de linha ao alterar o código
  useEffect(() => {
    const linhas = código.split('\n').length;
    const números = Array.from({ length: linhas }, (_, i) => i + 1).join('\n');
    setNúmerosLinha(números);
  }, [código]);

  // Sincroniza rolagem entre elementos
  useEffect(() => {
    const textarea = refTextArea.current;
    const sobreposição = refSobreposição.current;
    const númerosLinha = refNúmerosLinha.current;

    if (!textarea || !sobreposição || !númerosLinha) return;

    const sincronizarRolagem = () => {
      if (sobreposição) sobreposição.scrollTop = textarea.scrollTop;
      if (sobreposição) sobreposição.scrollLeft = textarea.scrollLeft;
      if (númerosLinha) númerosLinha.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener('scroll', sincronizarRolagem);
    return () => textarea.removeEventListener('scroll', sincronizarRolagem);
  }, []);

  // Executa a análise do código
  const executarAnálise = useCallback(async () => {
    setAnalisando(true);

    try {
      // Análise léxica
      const resultadoLexico = analisarCodigo(código);
      const novosTokens = Array.isArray(resultadoLexico.tokens) ? resultadoLexico.tokens : [];
      const errosLexicos = Array.isArray(resultadoLexico.erros) ? resultadoLexico.erros : [];

      // Análise sintática
      let errosSintaticos = [];
      const resultadoSintatico = analisarSintatico(novosTokens);
      errosSintaticos = Array.isArray(resultadoSintatico.erros) ? resultadoSintatico.erros : [];

      // Análise semântica
      let errosSemanticos = [];
      let simbolos = [];
      setCodigoIntermediario([]);
      if (errosSintaticos.length === 0) {
        const resultadoSemantico = analisarSemantico(novosTokens);
        errosSemanticos = Array.isArray(resultadoSemantico.erros) ? resultadoSemantico.erros : [];
        simbolos = Array.isArray(resultadoSemantico.tabelaSimbolos) ? resultadoSemantico.tabelaSimbolos : [];

        if (errosSemanticos.length === 0) {
          // Geração de código intermediário
          const codIntermediario = gerarCodigoIntermediario(novosTokens, simbolos);
          
          // Tradução para SimpSIM
          const traduzido = traduzirParaSimpSIM(codIntermediario.codigoOtimizado);
          
          setCodigoIntermediario({
            ...codIntermediario,
            codigoSimpSIM: traduzido.codigoAssembly,
            mapeamentoVariaveis: traduzido.mapeamentoVariaveis,
            informacoesTradução: traduzido.informacoes
          });
        }
      }
      setTokens(novosTokens);
      setErros([...errosLexicos, ...errosSintaticos, ...errosSemanticos]);
      setTabelaSimbolos(simbolos);

    } catch (error) {
      console.error("Erro ao analisar código:", error);
      setErros([`Erro durante a análise: ${error.message}`]);
    } finally {
      setAnalisando(false);
    }
  }, [código]);

  // Função para exportar código assembly SimpSIM
  const exportarSimpSIM = useCallback(() => {
    if (!codigoIntermediario.codigoSimpSIM || codigoIntermediario.codigoSimpSIM.length === 0) {
      alert('Nenhum código SimpSIM disponível para exportar.');
      return;
    }

    const conteudo = codigoIntermediario.codigoSimpSIM.join('\n');
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codigo_simpsim.asm';
    a.click();
    URL.revokeObjectURL(url);
  }, [codigoIntermediario]);

  // Funções para gerenciamento de arquivos
  const handleAbrirArquivo = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCurrentFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCódigo(e.target.result);
        setTokens([]);
        setErros([]);
        setTabelaSimbolos([]);
      };
      reader.readAsText(file);
    }
  };

  const handleSalvar = useCallback(() => {
    if (!código.trim()) return;

    const blob = new Blob([código], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile ? currentFile.name : 'codigo.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [código, currentFile]);

  const handleSalvarComo = useCallback(() => {
    if (!código.trim()) return;

    const blob = new Blob([código], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codigo.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [código]);

  const handleNovoArquivo = useCallback(() => {
    if (código.trim() && !window.confirm('Deseja criar um novo arquivo? As alterações não salvas serão perdidas.')) {
      return;
    }

    setCódigo('');
    setTokens([]);
    setErros([]);
    setTabelaSimbolos([]);
    setCurrentFile(null);
  }, [código]);

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={handleNovoArquivo}>Novo Arquivo</button>
        <button onClick={handleAbrirArquivo}>Abrir Arquivo</button>
        <button onClick={handleSalvar}>Salvar</button>
        <button onClick={handleSalvarComo}>Salvar Como</button>
        <button 
          onClick={exportarSimpSIM}
          disabled={!codigoIntermediario.codigoSimpSIM || codigoIntermediario.codigoSimpSIM.length === 0}
          style={{ marginLeft: '20px', backgroundColor: '#28a745' }}
        >
          Exportar SimpSIM (.asm)
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept=".txt,.js,.py"
        />
      </div>
      <div className="editor-container">
        <NúmerosLinha refNúmerosLinha={refNúmerosLinha} númerosLinha={númerosLinha} />
        <div className="code-editor">
          <SobreposicaoCodigo refSobreposição={refSobreposição} código={código} erros={erros} />
          <EditorCodigo refTextArea={refTextArea} código={código} setCódigo={setCódigo} />
        </div>
      </div>
      <BotaoAnalise onClick={executarAnálise} disabled={analisando || !código.trim()} />
      <SaidaAnalise
        tokens={tokens}
        erros={erros}
        tabelaSimbolos={tabelaSimbolos}
        codigoIntermediario={codigoIntermediario}
      />
    </div>
  );
}

export default App;