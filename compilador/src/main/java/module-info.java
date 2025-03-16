module org.fipp.compilador {
    requires javafx.controls;
    requires javafx.fxml;


    opens org.fipp.compilador to javafx.fxml;
    exports org.fipp.compilador;
}