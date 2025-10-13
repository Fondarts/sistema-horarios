@mvp @REQ-EMP-001
Feature: Gestión de empleados
  Como encargado
  Quiero dar de alta empleados con tope y no disponibilidad
  Para planificar turnos válidos

  Background:
    Given inicio sesión como "encargado"

  @REQ-EMP-002 @encargado
  Scenario: Alta básica de empleado
    When creo un empleado con nombre "Ana Perez"
      And asigno tope mensual de "160" horas
      And defino no disponibilidad "Martes 14:00-18:00"
      And registro cumpleaños "1995-04-10"
    Then el empleado "Ana Perez" figura activo con esos datos

  @REQ-EMP-003 @encargado
  Scenario: Edición de tope mensual
    Given existe el empleado "Luis Gomez" con tope "120"
    When cambio su tope mensual a "150"
    Then el tope mensual de "Luis Gomez" es "150"
