package org.fipp.compilador;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextArea;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.text.TextFlow;
import javafx.stage.FileChooser;
import java.io.*;
import java.util.ArrayList;
import java.util.List;
import javafx.scene.text.Text;

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
    private ScrollPane spNumeroLinhas;
    @FXML
    private TextFlow tfCodigo;

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

        // Listener para atualizar a formatação dinamicamente
        taCodigo.textProperty().addListener((obs, oldValue, newValue) -> {
            ajustarLinhasComNovoTexto();
            formatarCodigo(newValue);
        });

        // Vincula a rolagem do número de linhas com o código
        spNumeroLinhas.vvalueProperty().bind(taCodigo.scrollTopProperty().divide(taCodigo.getHeight() - taCodigo.getFont().getSize()));

        ajustarLinhasComNovoTexto();
    }

    private void ajustarLinhasComNovoTexto() {
        int totalLinhas = taCodigo.getText().split("\n").length;
        StringBuilder numbers = new StringBuilder();

        for (int i = 1; i <= totalLinhas; i++) {
            numbers.append(i).append("\n");
        }

        taNumeroLinhas.setText(numbers.toString());
        taNumeroLinhas.setPrefRowCount(totalLinhas);
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
                // ✅ Mantém a exibição de tokens sem alterações
                taTokens.appendText(token.toString() + "\n");
            }
            consumirEspacos();
        }

        if (!erros.isEmpty()) {
            for (String erro : erros) {
                taErros.appendText(erro + "\n");
            }
        }

        formatarCodigo(taCodigo.getText());
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

        // Identificadores
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
            case ':': // New case for colon
                return new Token(":", "t_dois_pontos", linhaAtual);
            default:


                //Identificador mal formado (ex.: j@, 1a)
                if (!Character.isLetterOrDigit(codigo.charAt(posicao)) && codigo.charAt(posicao) != '_') {
                    erros.add(String.format("Linha %d: Identificador mal formado '%s'", linhaAtual, lexema.toString()));
                }

                //Tamanho excessivo do identificador
                if (lexema.length() > 20) {
                    erros.add(String.format("Linha %d: Identificador muito longo '%s'", linhaAtual, lexema.toString()));
                }

                //Número mal formado (ex.: 2.a3)
                if (lexema.toString().matches("\\d+\\.\\d*\\.\\d+")) {
                    erros.add(String.format("Linha %d: Número mal formado '%s'", linhaAtual, lexema.toString()));
                }

                //Tamanho excessivo do número:
                if (lexema.length() > 10) {
                    erros.add(String.format("Linha %d: Número muito longo '%s'", linhaAtual, lexema.toString()));
                }

                // Fim de arquivo inesperado (comentário não fechado):
                if (lexema.toString().startsWith("{") && !lexema.toString().endsWith("}")) {
                    erros.add(String.format("Linha %d: Comentário não fechado", linhaAtual));
                }

                // String ou Char mal formado ex: "Hello World
                if (lexema.toString().startsWith("\"") && !lexema.toString().endsWith("\"")) {
                    erros.add(String.format("Linha %d: String não fechada '%s'", linhaAtual, lexema.toString()));
                }

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

    // ✅ Formata o código no TextFlow
    private void formatarCodigo(String texto) {
        String[] linhas = texto.split("\n");
        tfCodigo.getChildren().clear(); // Limpa o conteúdo anterior

        for (int i = 0; i < linhas.length; i++) {
            String linha = linhas[i];
            Text t = new Text(linha + "\n");

            // ✅ Torna 'linhaAtual' efetivamente final
            final int linhaAtual = i + 1;

            boolean temErro = erros.stream().anyMatch(e -> e.startsWith("Linha " + linhaAtual));

            if (temErro) {
                // 🔴 Linha com erro → vermelho + sublinhado
                t.setStyle("-fx-fill: red; -fx-underline: true;");
            } else {
                // ⚫ Linha sem erro → preta
                t.setStyle("-fx-fill: black;");
            }

            tfCodigo.getChildren().add(t);
        }

    }

    public void limparTudo(ActionEvent actionEvent) {
        taNumeroLinhas.clear();
        taCodigo.clear();
        tfCodigo.getChildren().clear();
        taErros.clear();
        taTokens.clear();
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
                // ✅ Mantém a exibição de tokens sem alterações
                taTokens.appendText(token.toString() + "\n");
            }
            consumirEspacos();
        }

        if (!erros.isEmpty()) {
            for (String erro : erros) {
                taErros.appendText(erro + "\n");
            }
        }

        formatarCodigo(taCodigo.getText());
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

        // Identificadores
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
            case ':': // New case for colon
                return new Token(":", "t_dois_pontos", linhaAtual);
            default:


                //Identificador mal formado (ex.: j@, 1a)
                if (!Character.isLetterOrDigit(codigo.charAt(posicao)) && codigo.charAt(posicao) != '_') {
                    erros.add(String.format("Linha %d: Identificador mal formado '%s'", linhaAtual, lexema.toString()));
                }

                //Tamanho excessivo do identificador
                if (lexema.length() > 20) {
                    erros.add(String.format("Linha %d: Identificador muito longo '%s'", linhaAtual, lexema.toString()));
                }

                //Número mal formado (ex.: 2.a3)
                if (lexema.toString().matches("\\d+\\.\\d*\\.\\d+")) {
                    erros.add(String.format("Linha %d: Número mal formado '%s'", linhaAtual, lexema.toString()));
                }

                //Tamanho excessivo do número:
                if (lexema.length() > 10) {
                    erros.add(String.format("Linha %d: Número muito longo '%s'", linhaAtual, lexema.toString()));
                }

                // Fim de arquivo inesperado (comentário não fechado):
                if (lexema.toString().startsWith("{") && !lexema.toString().endsWith("}")) {
                    erros.add(String.format("Linha %d: Comentário não fechado", linhaAtual));
                }

                // String ou Char mal formado ex: "Hello World
                if (lexema.toString().startsWith("\"") && !lexema.toString().endsWith("\"")) {
                    erros.add(String.format("Linha %d: String não fechada '%s'", linhaAtual, lexema.toString()));
                }

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

    // ✅ Formata o código no TextFlow
    private void formatarCodigo(String texto) {
        String[] linhas = texto.split("\n");
        tfCodigo.getChildren().clear(); // Limpa o conteúdo anterior

        for (int i = 0; i < linhas.length; i++) {
            String linha = linhas[i];
            Text t = new Text(linha + "\n");

            // ✅ Torna 'linhaAtual' efetivamente final
            final int linhaAtual = i + 1;

            boolean temErro = erros.stream().anyMatch(e -> e.startsWith("Linha " + linhaAtual));

            if (temErro) {
                // 🔴 Linha com erro → vermelho + sublinhado
                t.setStyle("-fx-fill: red; -fx-underline: true;");
            } else {
                // ⚫ Linha sem erro → preta
                t.setStyle("-fx-fill: black;");
            }

            tfCodigo.getChildren().add(t);
        }

    }

    public void limparTudo(ActionEvent actionEvent) {
        taNumeroLinhas.clear();
        taCodigo.clear();
        tfCodigo.getChildren().clear();
        taErros.clear();
        taTokens.clear();
    }
    // ✅ Salvar arquivo
    public void salvarArquivo(ActionEvent event) {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Salvar Código");
        fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("Arquivo de Texto (*.txt)", "*.txt"));
        File file = fileChooser.showSaveDialog(null);

        if (file != null) {
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
                writer.write(taCodigo.getText());
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    // ✅ Carregar arquivo
    public void carregarArquivo(ActionEvent event) {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Carregar Código");
        fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("Arquivo de Texto (*.txt)", "*.txt"));
        File file = fileChooser.showOpenDialog(null);

        if (file != null) {
            try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                String linha;
                StringBuilder conteudo = new StringBuilder();

                while ((linha = reader.readLine()) != null) {
                    conteudo.append(linha).append("\n");
                }

                taCodigo.setText(conteudo.toString());
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}

