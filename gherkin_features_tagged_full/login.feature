@mvp @ui @REQ-LOGIN-001
Feature: Sistema de logueo simple
  Como usuario de la app
  Quiero ingresar con mi nombre de usuario y clave numérica
  Para acceder según mi rol de encargado o empleado

  Background:
    Given la app muestra la pantalla de inicio de sesión

  @REQ-LOGIN-002 @encargado
  Scenario: Logueo exitoso como encargado
    When ingreso usuario "encargado1" y clave "12345"
    Then accedo a la vista del encargado
    And veo la opción para administrar horarios

  @REQ-LOGIN-003 @empleado
  Scenario: Logueo exitoso como empleado
    When ingreso usuario "empleado1" y clave "67890"
    Then accedo a la vista del empleado
    And solo puedo ver mis horarios

  @REQ-LOGIN-004
  Scenario: Error de autenticación
    When ingreso usuario "empleado1" y clave "99999"
    Then veo el mensaje "Usuario o clave incorrectos"
