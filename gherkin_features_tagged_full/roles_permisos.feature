@mvp @ui @REQ-ROLES-001
Feature: Vistas y permisos por rol
  Como usuario de la app
  Quiero que las capacidades dependan de mi rol
  Para asegurar que solo el encargado edite y el empleado consulte

  Background:
    Given existe un local con empleados cargados
    And existen turnos asignados para esta semana

  @REQ-ROLES-002 @empleado
  Scenario: El empleado solo puede ver
    Given inicio sesión como "empleado"
    When accedo a la pantalla de horarios
    Then veo únicamente mis turnos
    And no veo botones para crear, mover ni borrar turnos
    And no veo la pestaña de "Estadísticas"

  @REQ-ROLES-003 @encargado
  Scenario: El encargado puede administrar
    Given inicio sesión como "encargado"
    When accedo a la pantalla de horarios
    Then puedo crear, mover, redimensionar y borrar turnos
    And puedo ver y acceder a "Estadísticas"
