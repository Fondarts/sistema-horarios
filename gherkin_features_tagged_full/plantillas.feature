@mvp_plus @planificacion @REQ-PLANT-001
Feature: Plantillas y copiar semana
  Como encargado
  Quiero reutilizar plantillas
  Para acelerar la planificación

  @REQ-PLANT-002 @encargado
  Scenario: Guardar semana como plantilla
    Given tengo una semana completa planificada
    When la guardo como plantilla con nombre "Semana Base"
    Then la plantilla "Semana Base" queda disponible para reutilizar

  @REQ-PLANT-003 @encargado
  Scenario: Aplicar plantilla a otra semana
    Given existe la plantilla "Semana Base"
    When la aplico a la semana que empieza "2025-10-20"
    Then los turnos se generan para esa semana
    And se ajustan a horario de tienda y excepciones de ese período

  @REQ-PLANT-004 @encargado
  Scenario: Copiar semana actual a la siguiente
    When uso "Copiar semana"
    Then se generan los mismos turnos en la semana siguiente
    And el sistema revalida conflictos antes de guardar
