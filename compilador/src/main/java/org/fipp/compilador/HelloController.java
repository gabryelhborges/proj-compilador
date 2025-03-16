package org.fipp.compilador;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextArea;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;

import java.util.ArrayList;
import java.util.List;

public class HelloController {

    public TextArea taTokens;
    public TextArea taErros;
    @FXML
    private TextArea taCodigo;
    @FXML
    private TextArea taNumeroLinhas;
    @FXML
    private ScrollPane spNumeroLinhas;
    private int posicao;
    private String codigo;
    private int linhaAtual;
    private List<Token> tokens;
    private List<String> erros;

    @FXML
    private void initialize() {
        tokens = new ArrayList<>();
        erros = new ArrayList<>();
        // Configurações iniciais
        taNumeroLinhas.setText("1");
        HBox.setHgrow(taCodigo, Priority.ALWAYS);

        // Garante que as fontes e espaçamentos sejam consistentes
        taNumeroLinhas.setStyle("-fx-font-family: 'monospace'; -fx-font-size: 18; -fx-text-alignment: right;");
        taCodigo.setStyle("-fx-font-family: 'monospace'; -fx-font-size: 18;");

        // Listener para atualizar os números quando o texto muda
        taCodigo.textProperty().addListener((obs, oldValue, newValue) -> {
            ajustarLinhasComNovoTexto();
        });

        // Vincula diretamente a rolagem dos dois ScrollPanes
        spNumeroLinhas.vvalueProperty().bind(taCodigo.scrollTopProperty().divide(taCodigo.getHeight() - taCodigo.getFont().getSize()));

        // Atualiza os números das linhas quando o scroll muda
        taCodigo.scrollTopProperty().addListener((obs, oldValue, newValue) -> {
            ajustarLinhasComNovoTexto();
        });

        ajustarLinhasComNovoTexto();
    }

    private void ajustarLinhasComNovoTexto() {
        int totalLines = taCodigo.getParagraphs().size();
        StringBuilder numbers = new StringBuilder();

        // Calcula a primeira linha visível com base no scroll
        double scrollTop = taCodigo.getScrollTop();
        double lineHeight = taCodigo.getFont().getSize() * 1.3; // Ajuste para espaçamento
        int firstVisibleLine = (int) (scrollTop / lineHeight) + 1;

        // Calcula quantas linhas cabem na área visível
        double height = taCodigo.getHeight();
        int linesVisible = (int) (height / lineHeight);
        int lastVisibleLine = firstVisibleLine + linesVisible - 1;

        if (lastVisibleLine > totalLines) {
            lastVisibleLine = totalLines;
        }

        // Garante que o número de linhas exibidas em taNumeroLinhas corresponda às linhas visíveis em taCodigo
        int linesToShow = Math.min(linesVisible, totalLines);
        for (int i = firstVisibleLine; i < firstVisibleLine + linesToShow; i++) {
            if (i <= totalLines) {
                numbers.append(i).append("\n");
            }
        }

        taNumeroLinhas.setText(numbers.toString());

        // Ajusta a altura de taNumeroLinhas para corresponder ao número de linhas exibidas
        taNumeroLinhas.setPrefRowCount(linesToShow);
    }

    @FXML
    private void analisarCodigo(ActionEvent event) {
        tokens.clear();
        erros.clear();
        taTokens.clear();
        taErros.clear();

        codigo = taCodigo.getText() + " ";
        posicao = 0;
        linhaAtual = 1;

        while (posicao < codigo.length()) {
            Token token = getProximoToken();
            if (token != null) {
                tokens.add(token);
                taTokens.appendText(token.toString() + "\n");
            }
            consumirEspacos();
        }

        if (!erros.isEmpty()) {
            for (String erro : erros) {
                taErros.appendText(erro + "\n");
            }
            destacarErros();
        }
    }

    private Token getProximoToken() {
        if (posicao >= codigo.length()) return null;

        char c = codigo.charAt(posicao);

        // Ignora espaços em branco iniciais
        if (Character.isWhitespace(c)) {
            if (c == '\n') linhaAtual++;
            posicao++;
            return null;
        }

        StringBuilder lexema = new StringBuilder();
        lexema.append(c);

        // Identificadores e palavras-chave
        if (Character.isLetter(c)) {
            posicao++;
            while (posicao < codigo.length() &&
                    (Character.isLetterOrDigit(codigo.charAt(posicao)) || codigo.charAt(posicao) == '_')) {
                lexema.append(codigo.charAt(posicao));
                posicao++;
            }

            String palavra = lexema.toString();
            return switch (palavra) {
                case "variavel" -> new Token(palavra, "t_variavel", linhaAtual);
                case "se" -> new Token(palavra, "t_se", linhaAtual);
                case "senao" -> new Token(palavra, "t_senao", linhaAtual);
                case "enquanto" -> new Token(palavra, "t_enquanto", linhaAtual);
                case "para" -> new Token(palavra, "t_para", linhaAtual);
                case "funcao" -> new Token(palavra, "t_funcao", linhaAtual);
                case "retornar" -> new Token(palavra, "t_retornar", linhaAtual);
                case "inteiro", "decimal", "texto", "logico" -> new Token(palavra, "t_tipo", linhaAtual);
                default -> new Token(palavra, "t_identificador", linhaAtual);
            };
        }

        // Números
        if (Character.isDigit(c)) {
            posicao++;
            while (posicao < codigo.length() && Character.isDigit(codigo.charAt(posicao))) {
                lexema.append(codigo.charAt(posicao));
                posicao++;
            }
            return new Token(lexema.toString(), "t_num", linhaAtual);
        }

        // Operadores e símbolos
        posicao++;
        switch (c) {
            case '=':
                if (posicao < codigo.length() && codigo.charAt(posicao) == '=') {
                    posicao++;
                    return new Token("==", "t_igualdade", linhaAtual);
                }
                return new Token("=", "t_atribuicao", linhaAtual);
            case '<':
                if (posicao < codigo.length() && codigo.charAt(posicao) == '=') {
                    posicao++;
                    return new Token("<=", "t_menor_igual", linhaAtual);
                }
                return new Token("<", "t_menor", linhaAtual);
            case '>':
                if (posicao < codigo.length() && codigo.charAt(posicao) == '=') {
                    posicao++;
                    return new Token(">=", "t_maior_igual", linhaAtual);
                }
                return new Token(">", "t_maior", linhaAtual);
            case '+':
                return new Token("+", "t_soma", linhaAtual);
            case '-':
                return new Token("-", "t_subtracao", linhaAtual);
            case '*':
                return new Token("*", "t_multiplicacao", linhaAtual);
            case '/':
                return new Token("/", "t_divisao", linhaAtual);
            case '(':
                return new Token("(", "t_abre_par", linhaAtual);
            case ')':
                return new Token(")", "t_fecha_par", linhaAtual);
            case '{':
                return new Token("{", "t_abre_chave", linhaAtual);
            case '}':
                return new Token("}", "t_fecha_chave", linhaAtual);
            case ';':
                return new Token(";", "t_pv", linhaAtual);
            case ',':
                return new Token(",", "t_virgula", linhaAtual);
            case ':': // New case for colon
                return new Token(":", "t_dois_pontos", linhaAtual);
            default:
                erros.add(String.format("Linha %d: Caractere inválido '%c'", linhaAtual, c));
                return null;
        }
    }

    private void consumirEspacos() {
        while (posicao < codigo.length() && Character.isWhitespace(codigo.charAt(posicao))) {
            if (codigo.charAt(posicao) == '\n') linhaAtual++;
            posicao++;
        }
    }

    private void destacarErros() {
        String[] linhas = taCodigo.getText().split("\n");
        StringBuilder textoFormatado = new StringBuilder();

        // Primeiro, vamos remover qualquer formatação anterior
        taCodigo.setStyle(null);  // Remove qualquer estilo anterior

        for (int i = 0; i < linhas.length; i++) {
            final int linhaAtual = i + 1;
            boolean temErro = erros.stream().anyMatch(e -> e.startsWith("Linha " + linhaAtual));

            if (temErro) {
                // Se houver erro, vamos adicionar um fundo vermelho à linha
                textoFormatado.append("").append(linhas[i]).append("\n");

                // Definindo o estilo para a linha com erro (o TextArea só permite aplicar estilo a todo o conteúdo)
                taCodigo.setStyle("-fx-text-fill: red;"); // Aplica o texto vermelho para as linhas com erro
            } else {
                textoFormatado.append(linhas[i]).append("\n");
                taCodigo.setStyle("-fx-text-fill: black;");
            }
        }

        taCodigo.setText(textoFormatado.toString());
        // Opcional: mover o cursor para o início
        taCodigo.positionCaret(0);
    }

    private void retroceder() {
        if (posicao > 0) posicao--;
    }
}