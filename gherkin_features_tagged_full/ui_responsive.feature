@mvp @ui @REQ-UI-001
Feature: UI responsive y accesible
  Como usuario móvil o de escritorio
  Quiero una interfaz usable en ambas plataformas
  Para operar sin fricción

  @REQ-UI-002
  Scenario: Gantt en móvil
    Given estoy en un dispositivo móvil
    When abro el Gantt
    Then puedo desplazar horizontalmente
    And puedo arrastrar y redimensionar con gestos táctiles

  @REQ-UI-003
  Scenario: Contraste y tamaños táctiles
    When uso la app en exteriores
    Then los colores y contrastes permiten distinguir turnos y estados
    And los controles táctiles tienen área mínima de "44x44 px"
