@mvp @sync @REQ-SYNC-001
Feature: Sincronización local y en la nube
  Como usuario de la app
  Quiero usarla offline y que sincronice al reconectar
  Para no perder datos y mantenerme al día

  Background:
    Given hay conectividad inestable

  @REQ-SYNC-002
  Scenario: Uso offline con Local Storage
    Given pierdo la conexión
    When creo y edito borradores de turnos como encargado
    Then los cambios se guardan localmente
    And la UI indica "Cambios pendientes de sincronizar"

  @REQ-SYNC-003
  Scenario: Sincronización al recuperar conexión
    Given tengo cambios pendientes locales
    When se restablece la conexión
    Then los cambios se suben a la nube
    And las vistas de los empleados se actualizan automáticamente
