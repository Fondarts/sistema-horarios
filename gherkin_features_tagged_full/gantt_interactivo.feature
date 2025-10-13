@mvp @planificacion @ui @REQ-GANTT-001
Feature: Gantt interactivo (arrastrar y redimensionar)
  Como encargado
  Quiero manipular turnos visualmente
  Para ajustar planes de forma rápida

  Background:
    Given inicio sesión como "encargado"
    And existe el empleado "Ana Perez"

  @REQ-GANTT-002 @encargado
  Scenario: Crear turno por arrastre
    When creo una barra para "Ana Perez" el "2025-10-10" de "09:00" a "17:00"
    Then veo una barra en la fila de "Ana Perez" con duración "8h"
    And dentro de la barra se muestra "09:00–17:00 (8h)"

  @REQ-GANTT-003 @encargado
  Scenario: Mover turno por arrastre
    Given existe un turno de "Ana Perez" el "2025-10-10" de "09:00" a "17:00"
    When arrastro el turno a "2025-10-11" manteniendo duración
    Then el turno queda el "2025-10-11" de "09:00" a "17:00"

  @REQ-GANTT-004 @encargado
  Scenario: Redimensionar turno
    Given existe un turno de "Ana Perez" el "2025-10-10" de "09:00" a "17:00"
    When achico el extremo derecho hasta "16:00"
    Then la barra muestra "09:00–16:00 (7h)"

  @mvp_plus @REQ-GANTT-005 @ui
  Scenario: Snap a intervalos
    Given el snap está configurado en "15" minutos
    When intento ajustar un turno a "09:07"
    Then el turno se ajusta automáticamente a "09:00" o "09:15"

  @mvp_plus @REQ-GANTT-006 @ui
  Scenario: Zoom diario y semanal
    When selecciono zoom "Diario"
    Then el Gantt muestra una única jornada con escala de minutos/horas
    When cambio a zoom "Semanal"
    Then el Gantt muestra 7 días con escala por bloques
