package org.fipp.compilador;

import javafx.fxml.FXML;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextArea;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;

public class HelloController {

    @FXML
    private TextArea taCodigo;
    @FXML
    private TextArea taNumeroLinhas;
    @FXML
    private ScrollPane spNumeroLinhas;

    @FXML
    private void initialize() {
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
}