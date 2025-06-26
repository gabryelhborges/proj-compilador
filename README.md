# 🚀 Compilador de Linguagem Simples

Um compilador completo desenvolvido em React que realiza análise léxica, sintática e semântica de uma linguagem de programação simples, gerando código intermediário otimizado e traduzindo para assembly SimpSIM.

<div align="center">

![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

</div>

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [✨ Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [🏗️ Arquitetura](#️-arquitetura)
- [📚 Gramática da Linguagem](#-gramática-da-linguagem)
- [🚀 Como Executar](#-como-executar)
- [💻 Interface do Usuário](#-interface-do-usuário)
- [🔧 Compilação](#-compilação)
- [📊 Análises Implementadas](#-análises-implementadas)
- [⚡ Otimizações](#-otimizações)
- [🎯 Assembly SimpSIM](#-assembly-simpsim)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🤝 Contribuindo](#-contribuindo)

## 🎯 Visão Geral

Este projeto implementa um compilador completo para uma linguagem de programação simples, oferecendo uma interface web intuitiva para escrita, análise e compilação de código. O compilador realiza todas as fases tradicionais de compilação, desde a análise léxica até a geração de código assembly.

### 🌟 Destaques

- **Interface Web Moderna**: Editor de código com sintaxe colorizada e numeração de linhas
- **Compilação Completa**: Análise léxica, sintática, semântica e geração de código
- **Otimizações Avançadas**: Múltiplas técnicas de otimização de código intermediário
- **Tradução para Assembly**: Geração de código SimpSIM assembly
- **Detecção de Erros**: Relatórios detalhados com sugestões de correção
- **Gerenciamento de Arquivos**: Importar/exportar código e assembly

## ✨ Funcionalidades

### 🔍 Editor de Código
- **Editor com Sintaxe Colorizada**: Destaque visual para diferentes elementos da linguagem
- **Numeração de Linhas**: Sincronizada com rolagem e erros
- **Sobreposição de Erros**: Indicação visual de linhas com erros
- **Gerenciamento de Arquivos**: Abrir, salvar e criar novos arquivos

![image](https://github.com/user-attachments/assets/9d6ead50-f016-4ffd-aca6-8cb485d0112b)


### 🧠 Análises do Compilador

#### 📝 Análise Léxica
- Reconhecimento de tokens (palavras-chave, identificadores, operadores, literais)
- Tratamento de comentários de linha (`//`) e bloco (`/* */`)
- Strings com caracteres de escape
- Detecção e relatório de erros léxicos

![image](https://github.com/user-attachments/assets/c132aecf-13c0-4f20-83a2-66bf4a113d0c)

#### 🌳 Análise Sintática
- Análise sintática descendente recursiva
- Gramática LL(1) com tratamento de erros
- Sincronização após erros para continuar análise
- Mensagens de erro contextuais com sugestões

![image](https://github.com/user-attachments/assets/a5aa1c03-bfed-4783-bb35-84fba03bebaa)

#### 🧪 Análise Semântica
- Verificação de declaração e uso de variáveis
- Compatibilidade de tipos com casting implícito
- Escopo de variáveis e funções
- Detecção de variáveis não inicializadas/não utilizadas
- Avaliação de expressões constantes

![image](https://github.com/user-attachments/assets/813e115d-90b6-4814-a4ec-b4a41620f519)

### ⚡ Geração e Otimização de Código

#### 🔄 Código Intermediário
- Geração de código de três endereços
- Estruturas de controle (if/else, while, for)
- Chamadas de função e retornos
- Expressões aritméticas e relacionais

![image](https://github.com/user-attachments/assets/c1551d37-3dd0-4636-9fbf-3d980544f665)
![image](https://github.com/user-attachments/assets/55d69ff5-0c6f-4716-9fc5-f0bca4e17e26)

#### 🚀 Otimizações Implementadas
1. **Eliminação de Subexpressões Comuns**: Remove cálculos redundantes
2. **Propagação de Cópias**: Substitui variáveis por seus valores
3. **Eliminação de Código Morto**: Remove código inalcançável
4. **Propriedades Algébricas**: Simplifica expressões matemáticas
5. **Eliminação de Desvios**: Remove saltos desnecessários

#### 🎯 Tradução para SimpSIM
- Geração de assembly SimpSIM
- Mapeamento automático de variáveis para registradores
- Instruções otimizadas de load/store
- Controle de fluxo com saltos condicionais

![image](https://github.com/user-attachments/assets/c6f45012-2c1b-49da-92bb-6588be55cfe7)

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18+**: Framework principal para interface
- **CSS3**: Estilização moderna com Flexbox e Grid
- **JavaScript ES6+**: Lógica da aplicação

### Compilador
- **Análise Léxica**: Implementação custom de tokenização
- **Análise Sintática**: Parser descendente recursivo
- **Análise Semântica**: Verificação de tipos e escopos
- **Otimização**: Algoritmos de otimização de código
- **Geração de Código**: Tradução para assembly SimpSIM

### Ferramentas de Desenvolvimento
- **Create React App**: Setup inicial do projeto
- **Node.js**: Ambiente de desenvolvimento
- **npm**: Gerenciamento de dependências

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Interface     │    │   Compilador    │    │    Saída        │
│     Web         │    │                 │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Editor        │──▶│ • Anál. Léxica   │──▶│ • Tokens        │
│ • Numeração     │    │ • Anál. Sintát. │    │ • Erros         │
│ • Sobreposição  │    │ • Anál. Semânt. │    │ • Tab. Símbolos │
│ • Gerenc. Arq.  │    │ • Otimizações   │    │ • Cód. Inter.   │
│                 │    │ • Geração Cód.  │    │ • Assembly      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📚 Gramática da Linguagem

### Tipos de Dados
- **inteiro**: Números inteiros
- **decimal**: Números com ponto flutuante
- **texto**: Strings entre aspas
- **logico**: Valores verdadeiro/falso

### Estruturas de Controle
```javascript
// Condicional
se (condicao) {
    // código
} senao {
    // código alternativo
}

// Laços
enquanto (condicao) {
    // código
}

para (inicializacao; condicao; incremento) {
    // código
}

// Função
funcao nomeFuncao(param1: tipo, param2: tipo) {
    // código
    retornar valor;
}
```

### Exemplo de Código
```javascript
variavel x: inteiro = 10;
variavel y: decimal = 3.14;
variavel nome: texto = "João";
variavel ativo: logico = verdadeiro;

funcao calcular(a: inteiro, b: inteiro) {
    variavel resultado: inteiro = a + b * 2;
    retornar resultado;
}

se (x > 5) {
    y = calcular(x, 20);
    enquanto (x > 0) {
        x = x - 1;
    }
}
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 14+ instalado
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/proj-compilador.git

# Entre no diretório
cd proj-compilador

# Instale as dependências
npm install

# Execute o projeto
npm start
```

O projeto estará disponível em `http://localhost:3000`

### Scripts Disponíveis
```bash
npm start          # Inicia o servidor de desenvolvimento
npm run build      # Cria build de produção
```

## 💻 Interface do Usuário

### 📝 Editor Principal
- **Área de Código**: Editor com destaque de sintaxe
- **Numeração**: Linhas numeradas sincronizadas
- **Indicadores de Erro**: Sobreposição visual de erros por linha
- **Toolbar**: Botões para novo arquivo, abrir, salvar e analisar

### 📊 Painel de Resultados
Interface com abas organizadas:

#### 🎯 Aba Tokens
- Lista completa de tokens identificados
- Tipo e valor de cada token
- Linha de ocorrência

#### ❌ Aba Erros
- Erros léxicos, sintáticos e semânticos
- Código de cores por tipo de erro
- Mensagens detalhadas com sugestões

#### 📋 Aba Símbolos
- Tabela completa de símbolos
- Informações de tipo, escopo, inicialização
- Status de uso de variáveis

#### ⚙️ Aba Código Intermediário
- Código de três endereços gerado
- Instruções numeradas
- Comparação antes/depois das otimizações

#### 🎯 Aba Assembly SimpSIM
- Código assembly final
- Mapeamento de variáveis para registradores
- Instruções coloridas por tipo

![image](https://github.com/user-attachments/assets/439fe527-3511-4d66-b80d-24cb933205c7)

## 🔧 Compilação

### Fases do Compilador

#### 1️⃣ Análise Léxica ([`analisadorLexico.js`](src/utils/analisadorLexico.js))
```javascript
// Reconhece tokens da linguagem
const tokens = analisarCodigo(codigoFonte);
```

#### 2️⃣ Análise Sintática ([`analisadorSintatico.js`](src/utils/analisadorSintatico.js))
```javascript
// Verifica estrutura gramatical
const resultado = analisarSintatico(tokens);
```

#### 3️⃣ Análise Semântica ([`analisadorSemantico.js`](src/utils/analisadorSemantico.js))
```javascript
// Verifica tipos e escopos
const analise = analisarSemantico(tokens);
```

#### 4️⃣ Geração de Código ([`geradorCodigoIntermediario.js`](src/utils/geradorCodigoIntermediario.js))
```javascript
// Gera código intermediário
const codigo = gerarCodigoIntermediario(tokens, tabelaSimbolos);
```

#### 5️⃣ Tradução ([`tradutorSimpSIM.js`](src/utils/tradutorSimpSIM.js))
```javascript
// Traduz para assembly SimpSIM
const assembly = traduzirParaSimpSIM(codigoIntermediario);
```

## 📊 Análises Implementadas

### 🔍 Análise Léxica
- **Tokens Reconhecidos**:
  - Palavras-chave: `variavel`, `se`, `senao`, `enquanto`, `para`, `funcao`, `retornar`
  - Tipos: `inteiro`, `decimal`, `texto`, `logico`
  - Operadores: `+`, `-`, `*`, `/`, `=`, `==`, `<`, `>`, `<=`, `>=`
  - Delimitadores: `(`, `)`, `{`, `}`, `;`, `:`, `,`
  - Literais: números, strings, booleanos
  - Identificadores: nomes de variáveis e funções

### 🌳 Análise Sintática
- **Gramática LL(1)** com tratamento de erros
- **Recuperação de Erros** com sincronização
- **Mensagens Contextuais** com sugestões de correção

### 🧪 Análise Semântica
- **Verificação de Tipos**: Compatibilidade e casting implícito
- **Escopo de Variáveis**: Controle de visibilidade
- **Inicialização**: Detecção de uso antes da inicialização
- **Utilização**: Identificação de variáveis não utilizadas

## ⚡ Otimizações

### 1. Eliminação de Subexpressões Comuns
```javascript
// Antes
t1 := a + b
t2 := a + b

// Depois
t1 := a + b
t2 := t1
```

### 2. Propagação de Cópias
```javascript
// Antes
x := 5
y := x

// Depois
x := 5
y := 5
```

### 3. Eliminação de Código Morto
```javascript
// Antes
x := 5
x := 10  // Redundante

// Depois
x := 10
```

### 4. Propriedades Algébricas
```javascript
// Antes
x := y + 0
z := w * 1

// Depois
x := y
z := w
```

### 5. Eliminação de Desvios
```javascript
// Antes
goto L1
L1:

// Depois
// (removido)
```

## 🎯 Assembly SimpSIM

### Características
- **Arquitetura**: Registradores R0-R31
- **Instruções**: load, move, addi, jmp, jmpEQ, jmpLE, halt
- **Mapeamento Automático**: Variáveis → Registradores

### Exemplo de Tradução
```javascript
// Código fonte
variavel x: inteiro = 10;
x = x + 5;

// Assembly SimpSIM
; R1: x (variável)
load R1, 10
addi R1, R1, 5
halt
```

## 📁 Estrutura do Projeto

```
proj-compilador/
├── public/                    # Arquivos públicos
│   ├── index.html
│   └── manifest.json
├── src/                       # Código fonte
│   ├── components/            # Componentes React
│   │   ├── BotaoAnalise.jsx
│   │   ├── EditorCodigo.jsx
│   │   ├── NúmerosLinha.jsx
│   │   ├── SaidaAnalise.jsx
│   │   └── SobreposicaoCodigo.jsx
│   ├── utils/                 # Utilitários do compilador
│   │   ├── analisadorLexico.js
│   │   ├── analisadorSintatico.js
│   │   ├── analisadorSemantico.js
│   │   ├── geradorCodigoIntermediario.js
│   │   ├── otimizadorCodigo.js
│   │   ├── tradutorSimpSIM.js
│   │   └── Token.js
│   ├── App.jsx               # Componente principal
│   ├── App.css              # Estilos principais
│   └── index.js             # Ponto de entrada
├── codigosLinguagem/         # Exemplos de código
├── package.json             # Dependências e scripts
└── README.md               # Este arquivo
```

### 📦 Componentes Principais

#### [`App.jsx`](src/App.jsx)
- Componente raiz da aplicação
- Gerenciamento de estado global
- Integração entre editor e compilador

#### [`EditorCodigo.jsx`](src/components/EditorCodigo.jsx)
- Editor de código principal
- Sintaxe highlighting
- Controle de entrada do usuário

#### [`SaidaAnalise.jsx`](src/components/SaidaAnalise.jsx)
- Interface com abas dos resultados
- Exibição de tokens, erros, símbolos
- Visualização de código intermediário e assembly

#### [`SobreposicaoCodigo.jsx`](src/components/SobreposicaoCodigo.jsx)
- Sobreposição visual de erros
- Indicação de linhas problemáticas
- Sincronização com editor

---

<div align="center">
  
[⬆ Voltar ao topo](#-compilador-de-linguagem-simples)

</div>
