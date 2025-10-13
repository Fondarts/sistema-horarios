@mvp_plus @notificacion @REQ-PUB-001
Feature: Publicación y notificaciones
  Como encargado
  Quiero publicar cambios y notificar a empleados
  Para que todos vean la última versión

  Background:
    Given inicio sesión como "encargado"

  @REQ-PUB-002 @encargado
  Scenario: Publicar cambios
    Given realicé ajustes de turnos esta semana
    When presiono "Publicar"
    Then el estado pasa a "Publicado"
    And se dispara una notificación a los empleados afectados

  @REQ-PUB-003 @empleado
  Scenario: Empleado recibe notificación
    Given soy "empleado" con notificaciones habilitadas
    And el encargado publicó cambios que me afectan
    When abro la app
    Then veo un aviso "Tus horarios fueron actualizados"
    And puedo ver un resumen de qué cambió
