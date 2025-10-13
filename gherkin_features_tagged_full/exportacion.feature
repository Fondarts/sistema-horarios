@mvp_plus @export @REQ-EXP-001
Feature: Exportación de horarios
  Como encargado
  Quiero exportar horarios
  Para compartir y auditar fuera de la app

  @REQ-EXP-002 @encargado
  Scenario: Exportar a iCal
    Given hay turnos publicados esta semana
    When exporto a "iCal"
    Then descargo un archivo ".ics" con mis turnos

  @REQ-EXP-003 @encargado
  Scenario: Exportar a Google Calendar
    Given hay turnos publicados este mes
    When exporto a "Google Calendar"
    Then se crea/actualiza un calendario con los turnos publicados

  @REQ-EXP-4 @encargado
  Scenario: Exportar CSV
    Given hay turnos publicados
    When exporto a "CSV"
    Then descargo un archivo ".csv" con columnas "empleado, fecha, desde, hasta, horas"
