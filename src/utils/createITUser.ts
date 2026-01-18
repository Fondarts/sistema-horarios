/**
 * Script para crear un usuario IT en Firebase
 * Ejecutar desde la consola del navegador o como función temporal
 */

import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { EmployeeRole } from '../types';

export async function createITUser(username: string = 'it.admin', password: string = 'it123456') {
  try {
    // Verificar si ya existe un usuario IT con ese username
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where('username', '==', username));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const existingUser = snapshot.docs[0].data();
      return { 
        success: false, 
        message: `Ya existe un usuario con username "${username}"`,
        credentials: {
          username: existingUser.username,
          password: '*** (ya existe)'
        }
      };
    }

    // Crear usuario IT (sin storeId porque IT no pertenece a una tienda específica)
    const itEmployee = {
      name: 'Administrador IT',
      username: username,
      password: password,
      role: 'it' as EmployeeRole,
      color: '#8B5CF6', // Púrpura
      weeklyLimit: 0,
      monthlyHoursLimit: 0,
      unavailableTimes: [],
      unavailableHours: [],
      birthday: '1990-01-01',
      isActive: true,
      isManager: false, // IT no es manager tradicional
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
      // No incluir storeId - IT no pertenece a una tienda
    };

    const docRef = await addDoc(employeesRef, itEmployee);
    
    console.log('✅ Usuario IT creado exitosamente!');
    console.log('📋 Credenciales:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID del documento: ${docRef.id}`);
    
    return {
      success: true,
      message: 'Usuario IT creado exitosamente',
      credentials: {
        username: username,
        password: password
      },
      id: docRef.id
    };
  } catch (error) {
    console.error('❌ Error creando usuario IT:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

// Función para exponer en la consola del navegador (útil para debugging)
if (typeof window !== 'undefined') {
  (window as any).createITUser = createITUser;
}
