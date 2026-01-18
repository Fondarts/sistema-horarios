/**
 * Sistema de roles jerárquicos y permisos
 * 
 * Jerarquía (de mayor a menor):
 * 1. region - Encargado de región
 * 2. distrito - Encargado de distrito
 * 3. encargado - Encargado de tienda
 * 4. empleado - Empleado regular
 * 
 * Especial:
 * - it - IT (permisos especiales para configuración de empresa)
 */

export type EmployeeRole = 'region' | 'distrito' | 'encargado' | 'empleado' | 'it';

// Niveles de jerarquía (mayor número = mayor jerarquía)
const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  'region': 4,
  'distrito': 3,
  'encargado': 2,
  'empleado': 1,
  'it': 0 // IT no tiene jerarquía, tiene permisos especiales
};

/**
 * Obtiene el nivel jerárquico de un rol
 */
export function getRoleLevel(role: EmployeeRole): number {
  return ROLE_HIERARCHY[role] || 0;
}

/**
 * Verifica si un rol es superior a otro
 */
export function isRoleSuperior(superiorRole: EmployeeRole, inferiorRole: EmployeeRole): boolean {
  // IT no puede cambiar roles (aunque puede modificar configuración de empresa)
  if (superiorRole === 'it') {
    return false;
  }
  
  return getRoleLevel(superiorRole) > getRoleLevel(inferiorRole);
}

/**
 * Verifica si un rol puede cambiar el rol de otro empleado
 */
export function canChangeRole(changerRole: EmployeeRole, targetRole: EmployeeRole): boolean {
  // IT no puede cambiar roles
  if (changerRole === 'it') {
    return false;
  }
  
  // Solo superiores pueden cambiar roles de inferiores
  return isRoleSuperior(changerRole, targetRole);
}

/**
 * Obtiene los roles que un usuario puede asignar
 */
export function getAssignableRoles(userRole: EmployeeRole): EmployeeRole[] {
  if (userRole === 'it') {
    return []; // IT no puede asignar roles
  }
  
  const userLevel = getRoleLevel(userRole);
  const assignableRoles: EmployeeRole[] = [];
  
  // Puede asignar cualquier rol inferior
  for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
    if (level < userLevel && role !== 'it') {
      assignableRoles.push(role as EmployeeRole);
    }
  }
  
  return assignableRoles;
}

/**
 * Verifica si un usuario tiene permisos de IT
 */
export function isIT(role: EmployeeRole): boolean {
  return role === 'it';
}

/**
 * Verifica si un usuario es manager (encargado o superior)
 */
export function isManager(role: EmployeeRole): boolean {
  return role === 'encargado' || role === 'distrito' || role === 'region';
}

/**
 * Obtiene el nombre legible de un rol
 */
export function getRoleLabel(role: EmployeeRole): string {
  const labels: Record<EmployeeRole, string> = {
    'region': 'Encargado de Región',
    'distrito': 'Encargado de Distrito',
    'encargado': 'Encargado',
    'empleado': 'Empleado',
    'it': 'IT'
  };
  return labels[role] || role;
}
