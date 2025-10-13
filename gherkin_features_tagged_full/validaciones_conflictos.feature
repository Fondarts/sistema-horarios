@mvp @regla @REQ-VAL-001
Feature: Validaciones y detección de conflictos
  Como encargado
  Quiero alertas de conflictos
  Para evitar errores de planificación

  Background:
    Given inicio sesión como "encargado"
    And el horario de tienda para "Lunes" es "09:00–20:00"
    And el empleado "Luis Gomez" tiene tope mensual "150"
    And "Luis Gomez" no está disponible "Martes 14:00–18:00"

  @REQ-VAL-002 @encargado
  Scenario: Turno fuera del horario de tienda
    When intento crear un turno el "Lunes" de "08:00" a "12:00" para "Luis Gomez"
    Then veo un error "Turno fuera del horario de tienda"
    And el turno no se guarda

  @REQ-VAL-003 @encargado
  Scenario: Turno en día cerrado por excepción
    Given "2025-12-08" está marcado "Cerrado"
    When intento crear un turno el "2025-12-08" de "10:00" a "14:00" para "Luis Gomez"
    Then veo un error "La tienda está cerrada por excepción"
    And el turno no se guarda

  @REQ-VAL-004 @encargado
  Scenario: Solapamiento de turnos del mismo empleado
    Given existe un turno de "Luis Gomez" el "2025-10-10" de "10:00" a "14:00"
    When intento crear otro turno el "2025-10-10" de "13:00" a "18:00"
    Then veo un error "Solapamiento de turnos"

  @REQ-VAL-005 @encargado
  Scenario Outline: No disponibilidad del empleado
    When intento crear un turno el "<dia>" de "<desde>" a "<hasta>" para "Luis Gomez"
    Then veo un error "Empleado no disponible"
    And el turno no se guarda

    Examples:
      | dia    | desde | hasta |
      | Martes | 14:00 | 18:00 |

  @REQ-VAL-006 @encargado
  Scenario: Exceso de tope mensual
    Given "Luis Gomez" ya tiene asignadas "148" horas en el mes
    When intento asignarle un turno de "4" horas
    Then veo una advertencia "Supera el tope mensual (150h)"
    And el sistema bloquea el guardado
