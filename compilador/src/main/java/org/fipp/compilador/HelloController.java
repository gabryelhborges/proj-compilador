package org.fipp.compilador;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextArea;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;

import java.util.ArrayList;
import java.util.List;

public class HelloController {

    @FXML
    private TextArea taCodigo;
    @FXML
    private TextArea taNumeroLinhas;
    @FXML
    private TextArea taTokens;
    @FXML
    private TextArea taErros;
    @FXML
    private TextFlow tfCodigo;
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

        // Listener para atualizar a formatação dinamicamente
        taCodigo.textProperty().addListener((obs, oldValue, newValue) -> {
            ajustarLinhasComNovoTexto();
            atualizarTextoFormatado(newValue);
        });

        ajustarLinhasComNovoTexto();
    }

    private void ajustarLinhasComNovoTexto() {
        String[] linhas = taCodigo.getText().split("\n");
        StringBuilder sb = new StringBuilder();

        for (int i = 1; i <= linhas.length; i++) {
            sb.append(i).append("\n");
        }

        taNumeroLinhas.setText(sb.toString());
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
        }

        atualizarTextoFormatado(taCodigo.getText());
    }

    private void atualizarTextoFormatado(String texto) {
        tfCodigo.getChildren().clear();

        String[] linhas = texto.split("\n");
        for (int i = 0; i < linhas.length; i++) {
            Text t = new Text(linhas[i] + "\n");

            // Verifica se a linha tem erro
            int linhaAtual = i + 1;
            boolean temErro = erros.stream().anyMatch(e -> e.startsWith("Linha " + linhaAtual));

            if (temErro) {
                // 🔴 SUBLINHAR a linha com erro
                t.setFill(Color.RED);
                t.setUnderline(true); // Sublinhado para sinalizar erro
            } else {
                t.setFill(Color.BLACK);
                t.setUnderline(false);
            }

            tfCodigo.getChildren().add(t);
        }
    }

    private void consumirEspacos() {
        while (posicao < codigo.length() && Character.isWhitespace(codigo.charAt(posicao))) {
            if (codigo.charAt(posicao) == '\n') linhaAtual++;
            posicao++;
        }
    }

    private Token getProximoToken() {
        if (posicao >= codigo.length()) return null;

        char c = codigo.charAt(posicao);

        // Ignora espaços em branco
        if (Character.isWhitespace(c)) {
            if (c == '\n') linhaAtual++;
            posicao++;
            return null;
        }

        StringBuilder lexema = new StringBuilder();
        lexema.append(c);
        posicao++;

        // Identificadores e palavras-chave
        if (Character.isLetter(c)) {
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
            while (posicao < codigo.length() && Character.isDigit(codigo.charAt(posicao))) {
                lexema.append(codigo.charAt(posicao));
                posicao++;
            }
            return new Token(lexema.toString(), "t_num", linhaAtual);
        }

        // Operadores e símbolos
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
            case ':':
                return new Token(":", "t_dois_pontos", linhaAtual);
            default:
                // Se não for reconhecido, adiciona erro léxico
                erros.add(String.format("Linha %d: Caractere inválido '%c'", linhaAtual, c));
                return null;
        }
    }

}