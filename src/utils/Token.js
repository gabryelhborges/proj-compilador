class Token {
    constructor(lexema, tipo, linha) {
      this.lexema = lexema;
      this.tipo = tipo;
      this.linha = linha;
    }
  
    toString() {
      return `${this.tipo}: ${this.lexema} (linha ${this.linha})`;
    }
  }
  
  export default Token;