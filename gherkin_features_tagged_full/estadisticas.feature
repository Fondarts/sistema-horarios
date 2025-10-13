@mvp_plus @metricas @REQ-MET-001
Feature: Estadísticas (solo encargado)
  Como encargado
  Quiero ver métricas de cobertura y carga
  Para tomar decisiones informadas

  Background:
    Given inicio sesión como "encargado"

  @REQ-MET-002 @encargado
  Scenario: Días con mayor carga por empleado
    When abro la pestaña "Estadísticas"
    Then veo para cada empleado el día de la semana con mayor cantidad de horas promedio

  @REQ-MET-003 @encargado
  Scenario: Tiempo desde último fin de semana libre
    When consulto "Estadísticas"
    Then para cada empleado veo "días desde el último fin de semana libre"

  @REQ-MET-004 @encargado
  Scenario: Tope vs. asignado
    When consulto "Estadísticas"
    Then veo por empleado "horas asignadas en el mes" y "tope mensual"
    And se resaltan en alerta los que superan o están a <10% del tope

  @REQ-MET-005 @encargado
  Scenario: Cobertura diaria mínima
    Given la cobertura mínima es "2" personas en franja "12:00–14:00"
    When miro "Estadísticas" de la semana vigente
    Then veo para cada día si la franja "12:00–14:00" cumple la cobertura
