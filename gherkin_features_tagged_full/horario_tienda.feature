@mvp @planificacion @REQ-HOR-001
Feature: Horario de tienda (semana y excepciones)
  Como encargado
  Quiero configurar el horario por día y excepciones
  Para validar que los turnos caigan dentro del horario de apertura

  Background:
    Given inicio sesión como "encargado"

  @REQ-HOR-002 @encargado
  Scenario Outline: Definir horario semanal
    When configuro "<dia>" como abierto entre "<abre>" y "<cierra>"
    Then el sistema muestra "<dia>" abierto de "<abre>" a "<cierra>"

    Examples:
      | dia     | abre  | cierra |
      | Lunes   | 09:00 | 20:00  |
      | Martes  | 09:00 | 20:00  |
      | Domingo | 00:00 | 00:00  |

  @REQ-HOR-003 @encargado
  Scenario: Marcar día cerrado
    When configuro "Domingo" como cerrado
    Then el sistema muestra "Domingo" como "Cerrado"

  @REQ-HOR-004 @encargado
  Scenario: Excepción por feriado
    Given "Lunes 2025-12-08" cae feriado
    When agrego excepción "Cerrado" para "2025-12-08"
    Then ese día aparece como "Cerrado" en el calendario
