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

function App() {
  const [código, setCódigo] = useState('');
  const [tokens, setTokens] = useState([]);
  const [erros, setErros] = useState([]);
  const [númerosLinha, setNúmerosLinha] = useState('1');
  const [tabelaSimbolos, setTabelaSimbolos] = useState([]);
  const [analisando, setAnalisando] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  
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
      
      const resultadoSemantico = analisarSemantico(novosTokens);
      errosSemanticos = Array.isArray(resultadoSemantico.erros) ? resultadoSemantico.erros : [];
      simbolos = Array.isArray(resultadoSemantico.tabelaSimbolos) ? resultadoSemantico.tabelaSimbolos : [];
      
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
      <SaidaAnalise tokens={tokens} erros={erros} tabelaSimbolos={tabelaSimbolos} />
    </div>
  );
}

export default App;