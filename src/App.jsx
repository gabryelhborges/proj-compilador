import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import EditorCodigo from './components/EditorCodigo.jsx';
import SobreposicaoCodigo from './components/SobreposicaoCodigo.jsx';
import NúmerosLinha from './components/NúmerosLinha.jsx';
import SaidaAnalise from './components/SaidaAnalise.jsx';
import BotaoAnalise from './components/BotaoAnalise.jsx';
import { analisarCodigo } from './utils/analisadorLexico.js';
import { analisarSintatico } from './utils/analisadorSintatico.js';

function App() {
  const [código, setCódigo] = useState('');
  const [tokens, setTokens] = useState([]);
  const [erros, setErros] = useState([]);
  const [númerosLinha, setNúmerosLinha] = useState('1');
  const refTextArea = useRef(null);
  const refSobreposição = useRef(null);
  const refNúmerosLinha = useRef(null);
  const fileInputRef = useRef(null);
  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    const linhas = código.split('\n').length;
    const números = Array.from({ length: linhas }, (_, i) => i + 1).join('\n');
    setNúmerosLinha(números);
  }, [código]);

  useEffect(() => {
    const textarea = refTextArea.current;
    const sobreposição = refSobreposição.current;
    const númerosLinha = refNúmerosLinha.current;

    const sincronizarRolagem = () => {
      sobreposição.scrollTop = textarea.scrollTop;
      sobreposição.scrollLeft = textarea.scrollLeft;
      númerosLinha.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener('scroll', sincronizarRolagem);
    return () => textarea.removeEventListener('scroll', sincronizarRolagem);
  }, []);

  const executarAnálise = async () => {
    const resultadoLexico = analisarCodigo(código);
    const novosTokens = Array.isArray(resultadoLexico.tokens) ? resultadoLexico.tokens : [];
    const errosLexicos = Array.isArray(resultadoLexico.erros) ? resultadoLexico.erros : [];
    const resultadoSintatico = analisarSintatico(novosTokens);
    const errosSintaticos = Array.isArray(resultadoSintatico.erros) ? resultadoSintatico.erros : [];
    setTokens(novosTokens);
    setErros([...errosLexicos, ...errosSintaticos]);
  };

  // Função para abrir arquivo
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
      };
      reader.readAsText(file);
    }
  };

  // Função para salvar alterações no arquivo atual
  const handleSalvar = () => {
    if (currentFile) {
      const blob = new Blob([código], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFile.name;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      handleSalvarComo();
    }
  };

  // Função para salvar como novo arquivo
  const handleSalvarComo = () => {
    const blob = new Blob([código], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codigo.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <div className="toolbar">
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
      <BotaoAnalise onClick={executarAnálise} />
      <SaidaAnalise tokens={tokens} erros={erros} />
    </div>
  );
}

export default App;