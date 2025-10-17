import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Download, Users, Calendar, Database, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useStore } from '../contexts/StoreContext';

export function TestDataGenerator() {
  const { setCurrentStore } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<any>(null);

  // Función para convertir tiempo a minutos
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Datos de empleados de prueba
  const testEmployees = [
    // Tienda 1 - Empleados
    {
      name: "María González",
      username: "maria.gonzalez",
      password: "123456",
      weeklyLimit: 40,
      monthlyHoursLimit: 160,
      birthday: "1990-03-15",
      isActive: true,
      color: "#3B82F6",
      role: "encargado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 0, startTime: "00:00", endTime: "23:59" }, // Domingo no disponible
        { id: uuidv4(), dayOfWeek: 1, startTime: "00:00", endTime: "08:00" }  // Lunes antes de 8am
      ]
    },
    {
      name: "Carlos Rodríguez",
      username: "carlos.rodriguez", 
      password: "123456",
      weeklyLimit: 35,
      monthlyHoursLimit: 140,
      birthday: "1985-07-22",
      isActive: true,
      color: "#10B981",
      role: "empleado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 2, startTime: "18:00", endTime: "23:59" }, // Miércoles después de 6pm
        { id: uuidv4(), dayOfWeek: 6, startTime: "00:00", endTime: "23:59" }  // Sábado no disponible
      ]
    },
    {
      name: "Ana Martínez",
      username: "ana.martinez",
      password: "123456", 
      weeklyLimit: 30,
      monthlyHoursLimit: 120,
      birthday: "1992-11-08",
      isActive: true,
      color: "#F59E0B",
      role: "empleado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 3, startTime: "00:00", endTime: "10:00" }, // Jueves antes de 10am
        { id: uuidv4(), dayOfWeek: 4, startTime: "20:00", endTime: "23:59" }  // Viernes después de 8pm
      ]
    },
    {
      name: "Luis Fernández",
      username: "luis.fernandez",
      password: "123456",
      weeklyLimit: 25,
      monthlyHoursLimit: 100,
      birthday: "1988-05-12",
      isActive: true,
      color: "#EF4444",
      role: "empleado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 1, startTime: "00:00", endTime: "12:00" }, // Lunes antes de 12pm
        { id: uuidv4(), dayOfWeek: 5, startTime: "00:00", endTime: "23:59" }  // Viernes no disponible
      ]
    },
    {
      name: "Sofia López",
      username: "sofia.lopez",
      password: "123456",
      weeklyLimit: 20,
      monthlyHoursLimit: 80,
      birthday: "1995-09-30",
      isActive: true,
      color: "#8B5CF6",
      role: "empleado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 0, startTime: "00:00", endTime: "23:59" }, // Domingo no disponible
        { id: uuidv4(), dayOfWeek: 6, startTime: "00:00", endTime: "23:59" }  // Sábado no disponible
      ]
    },
    // Tienda 2 - Empleados
    {
      name: "Roberto Silva",
      username: "roberto.silva",
      password: "123456",
      weeklyLimit: 40,
      monthlyHoursLimit: 160,
      birthday: "1987-01-18",
      isActive: true,
      color: "#06B6D4",
      role: "encargado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 0, startTime: "00:00", endTime: "23:59" }, // Domingo no disponible
        { id: uuidv4(), dayOfWeek: 1, startTime: "00:00", endTime: "09:00" }  // Lunes antes de 9am
      ]
    },
    {
      name: "Carmen Ruiz",
      username: "carmen.ruiz",
      password: "123456",
      weeklyLimit: 35,
      monthlyHoursLimit: 140,
      birthday: "1991-04-25",
      isActive: true,
      color: "#84CC16",
      role: "empleado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 2, startTime: "19:00", endTime: "23:59" }, // Miércoles después de 7pm
        { id: uuidv4(), dayOfWeek: 6, startTime: "00:00", endTime: "23:59" }  // Sábado no disponible
      ]
    },
    {
      name: "Diego Morales",
      username: "diego.morales",
      password: "123456",
      weeklyLimit: 30,
      monthlyHoursLimit: 120,
      birthday: "1993-08-14",
      isActive: true,
      color: "#F97316",
      role: "empleado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 3, startTime: "00:00", endTime: "11:00" }, // Jueves antes de 11am
        { id: uuidv4(), dayOfWeek: 4, startTime: "21:00", endTime: "23:59" }  // Viernes después de 9pm
      ]
    },
    {
      name: "Patricia Vega",
      username: "patricia.vega",
      password: "123456",
      weeklyLimit: 25,
      monthlyHoursLimit: 100,
      birthday: "1989-12-03",
      isActive: true,
      color: "#EC4899",
      role: "empleado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 1, startTime: "00:00", endTime: "13:00" }, // Lunes antes de 1pm
        { id: uuidv4(), dayOfWeek: 5, startTime: "00:00", endTime: "23:59" }  // Viernes no disponible
      ]
    },
    {
      name: "Miguel Torres",
      username: "miguel.torres",
      password: "123456",
      weeklyLimit: 20,
      monthlyHoursLimit: 80,
      birthday: "1996-06-20",
      isActive: true,
      color: "#6366F1",
      role: "empleado" as const,
      unavailableTimes: [
        { id: uuidv4(), dayOfWeek: 0, startTime: "00:00", endTime: "23:59" }, // Domingo no disponible
        { id: uuidv4(), dayOfWeek: 6, startTime: "00:00", endTime: "23:59" }  // Sábado no disponible
      ]
    }
  ];

  // Función para generar horarios para los próximos 2 meses
  const generateShiftsForTwoMonths = (employees: any[], storeId: string) => {
    const shifts = [];
    const today = new Date();
    const twoMonthsFromNow = new Date(today);
    twoMonthsFromNow.setMonth(today.getMonth() + 2);
    
    // Horarios típicos de tienda
    const shiftPatterns = [
      { startTime: "08:00", endTime: "14:00", hours: 6 }, // Mañana
      { startTime: "14:00", endTime: "20:00", hours: 6 }, // Tarde
      { startTime: "10:00", endTime: "18:00", hours: 8 }, // Día completo
      { startTime: "09:00", endTime: "15:00", hours: 6 }, // Medio día
      { startTime: "16:00", endTime: "22:00", hours: 6 }  // Noche
    ];
    
    for (let date = new Date(today); date <= twoMonthsFromNow; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const dateStr = date.toISOString().split('T')[0];
      
      // No generar turnos los domingos (día 0)
      if (dayOfWeek === 0) continue;
      
      // Generar 2-4 turnos por día
      const numShifts = Math.floor(Math.random() * 3) + 2; // 2-4 turnos
      
      for (let i = 0; i < numShifts; i++) {
        const employee = employees[Math.floor(Math.random() * employees.length)];
        const pattern = shiftPatterns[Math.floor(Math.random() * shiftPatterns.length)];
        
        // Verificar si el empleado está disponible en este horario
        const isUnavailable = employee.unavailableTimes.some((ut: any) => 
          ut.dayOfWeek === dayOfWeek && 
          (pattern.startTime < ut.endTime && pattern.endTime > ut.startTime)
        );
        
        if (!isUnavailable) {
          shifts.push({
            employeeId: employee.id,
            date: dateStr,
            startTime: pattern.startTime,
            endTime: pattern.endTime,
            hours: pattern.hours,
            isPublished: Math.random() > 0.3, // 70% publicados
            storeId: storeId
          });
        }
      }
    }
    
    return shifts;
  };

  // Función auxiliar para agregar empleado directamente a Firebase
  const addEmployeeToStore = async (employeeData: any, storeId: string) => {
    const newEmployee = {
      ...employeeData,
      storeId: storeId,
      color: employeeData.color || getNextAvailableColor([]),
      role: employeeData.role || 'empleado'
    };
    
    const docRef = await addDoc(collection(db, 'employees'), newEmployee);
    return { ...newEmployee, id: docRef.id };
  };

  // Función auxiliar para agregar turno directamente a Firebase
  const addShiftToStore = async (shiftData: any) => {
    const newShift = {
      ...shiftData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'shifts'), newShift);
  };

  // Función auxiliar para obtener el siguiente color disponible
  const getNextAvailableColor = (existingEmployees: any[]) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];
    const usedColors = existingEmployees.map(emp => emp.color);
    return colors.find(color => !usedColors.includes(color)) || colors[0];
  };

  const clearAllData = async () => {
    if (!confirm('¿Estás seguro de que quieres borrar TODOS los datos? Esta acción eliminará todas las tiendas, empleados y turnos. Esta acción no se puede deshacer.')) {
      return;
    }

    setIsClearing(true);
    setProgress('');
    setResults(null);

    try {
      let deletedCount = 0;
      const errors: string[] = [];

      // Temporalmente desactivar la tienda actual para evitar recreación automática
      setProgress('Desactivando tienda actual...');
      setCurrentStore('');
      
      // Marcar que estamos en proceso de borrado para evitar recreación automática
      localStorage.setItem('isClearingData', 'true');

      // Lista de todas las colecciones a borrar
      const collections = [
        'shifts',
        'employees', 
        'stores',
        'storeSchedule',
        'storeExceptions',
        'templates',
        'vacationRequests',
        'absenceRequests',
        'holidays',
        'notifications'
      ];

      // Función para borrar una colección completa con reintentos
      const deleteCollection = async (collectionName: string, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            setProgress(`Borrando ${collectionName} (intento ${attempt}/${maxRetries})...`);
            const snapshot = await getDocs(collection(db, collectionName));
            let collectionDeleted = 0;
            
            for (const docSnapshot of snapshot.docs) {
              try {
                await deleteDoc(doc(db, collectionName, docSnapshot.id));
                collectionDeleted++;
                deletedCount++;
              } catch (docError) {
                errors.push(`Error borrando documento ${docSnapshot.id} de ${collectionName}: ${docError instanceof Error ? docError.message : String(docError)}`);
              }
            }
            
            console.log(`${collectionName}: ${collectionDeleted} documentos eliminados (intento ${attempt})`);
            
            // Si no hay documentos, salir del bucle de reintentos
            if (collectionDeleted === 0) {
              break;
            }
            
            // Esperar un poco antes del siguiente intento para evitar conflictos
            if (attempt < maxRetries && collectionDeleted > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            return collectionDeleted;
          } catch (collectionError) {
            errors.push(`Error accediendo a colección ${collectionName} (intento ${attempt}): ${collectionError instanceof Error ? collectionError.message : String(collectionError)}`);
            if (attempt === maxRetries) {
              return 0;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        return 0;
      };

      // Borrar todas las colecciones con reintentos
      for (const collectionName of collections) {
        await deleteCollection(collectionName);
      }

      // Esperar un poco más para que se complete la sincronización
      setProgress('Esperando sincronización...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar que realmente se borraron todos los datos
      setProgress('Verificando borrado completo...');
      let remainingDocs = 0;
      for (const collectionName of collections) {
        try {
          const verifySnapshot = await getDocs(collection(db, collectionName));
          remainingDocs += verifySnapshot.docs.length;
          if (verifySnapshot.docs.length > 0) {
            errors.push(`ADVERTENCIA: ${collectionName} aún tiene ${verifySnapshot.docs.length} documentos`);
            // Mostrar IDs de documentos restantes para debugging
            const remainingIds = verifySnapshot.docs.map(doc => doc.id).join(', ');
            errors.push(`IDs restantes en ${collectionName}: ${remainingIds}`);
          }
        } catch (verifyError) {
          errors.push(`Error verificando ${collectionName}: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
        }
      }

      if (errors.length > 0) {
        setProgress(`Borrado completado con ${errors.length} advertencias. ${deletedCount} documentos eliminados.`);
        setResults({
          cleared: true,
          deletedCount,
          errors,
          remainingDocs
        });
      } else {
        setProgress(`Datos borrados exitosamente. ${deletedCount} documentos eliminados.`);
        setResults({
          cleared: true,
          deletedCount,
          remainingDocs
        });
      }

    } catch (error) {
      console.error('Error borrando datos:', error);
      setProgress(`Error borrando datos: ${error instanceof Error ? error.message : String(error)}`);
      setResults({
        cleared: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      // Limpiar el flag de borrado
      localStorage.removeItem('isClearingData');
      setIsClearing(false);
    }
  };

  const generateShiftsForFourMonths = (employees: any[], storeId: string, storeSchedule: any) => {
    const shifts = [];
    const today = new Date();
    
    // Generar turnos para los últimos 3 meses
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    // Generar turnos para el próximo mes
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    // Horarios típicos de tienda
    const shiftPatterns = [
      { startTime: "09:00", endTime: "14:00", hours: 5 }, // Mañana
      { startTime: "14:00", endTime: "20:00", hours: 6 }, // Tarde
      { startTime: "10:00", endTime: "18:00", hours: 8 }, // Día completo
      { startTime: "16:00", endTime: "21:00", hours: 5 }, // Tarde-noche
    ];

    // Generar turnos para cada día en el rango
    const currentDate = new Date(threeMonthsAgo);
    while (currentDate <= nextMonth) {
      const dayOfWeek = currentDate.getDay();
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      const daySchedule = storeSchedule[dayName];
      
      if (daySchedule && daySchedule.isOpen && daySchedule.timeRanges.length > 0) {
        // Seleccionar empleados aleatorios para este día (1-3 empleados)
        const numEmployees = Math.floor(Math.random() * 3) + 1;
        const shuffledEmployees = [...employees].sort(() => 0.5 - Math.random());
        const selectedEmployees = shuffledEmployees.slice(0, numEmployees);
        
        for (const employee of selectedEmployees) {
          // Verificar si el empleado está disponible este día
          const isUnavailable = employee.unavailableTimes.some((ut: any) => 
            ut.dayOfWeek === dayOfWeek
          );
          
          if (!isUnavailable) {
            // Seleccionar un patrón de turno aleatorio
            const pattern = shiftPatterns[Math.floor(Math.random() * shiftPatterns.length)];
            
            // Verificar que el turno esté dentro del horario de la tienda
            const shiftStart = timeToMinutes(pattern.startTime);
            const shiftEnd = timeToMinutes(pattern.endTime);
            
            let validShift = false;
            for (const timeRange of daySchedule.timeRanges) {
              const storeOpen = timeToMinutes(timeRange.openTime);
              const storeClose = timeToMinutes(timeRange.closeTime);
              
              if (shiftStart >= storeOpen && shiftEnd <= storeClose) {
                validShift = true;
                break;
              }
            }
            
            if (validShift) {
              shifts.push({
                employeeId: employee.id,
                storeId: storeId,
                date: currentDate.toISOString().split('T')[0],
                startTime: pattern.startTime,
                endTime: pattern.endTime,
                hours: pattern.hours,
                isPublished: Math.random() > 0.3, // 70% de turnos publicados
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          }
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return shifts;
  };

  const generateTestData = async () => {
    setIsGenerating(true);
    setProgress('');
    setResults(null);

    try {
      const results = {
        stores: 0,
        employeesCreated: 0,
        shiftsCreated: 0,
        errors: [] as string[]
      };

      // Definir las 3 tiendas específicas
      const storesToCreate = [
        {
          name: "Tienda Centro",
          address: "Av. Principal 123, Centro",
          phone: "+54 11 1234-5678",
          employees: [
            { name: "Ana Martínez", role: "encargado" as const, weeklyLimit: 40, color: "#3B82F6", unavailableTimes: [] },
            { name: "Luis Fernández", role: "empleado" as const, weeklyLimit: 35, color: "#10B981", unavailableTimes: [{ dayOfWeek: 0, startTime: "00:00", endTime: "23:59" }] },
            { name: "Sofia López", role: "empleado" as const, weeklyLimit: 30, color: "#F59E0B", unavailableTimes: [{ dayOfWeek: 6, startTime: "00:00", endTime: "23:59" }] }
          ],
          schedule: {
            // Horario partido, no abre domingo
            monday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "14:00" }, { openTime: "16:00", closeTime: "21:00" }] },
            tuesday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "14:00" }, { openTime: "16:00", closeTime: "21:00" }] },
            wednesday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "14:00" }, { openTime: "16:00", closeTime: "21:00" }] },
            thursday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "14:00" }, { openTime: "16:00", closeTime: "21:00" }] },
            friday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "14:00" }, { openTime: "16:00", closeTime: "21:00" }] },
            saturday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            sunday: { isOpen: false, timeRanges: [] }
          }
        },
        {
          name: "Tienda Norte",
          address: "Av. Norte 456, Zona Norte",
          phone: "+54 11 2345-6789",
          employees: [
            { name: "Carlos Rodríguez", role: "encargado" as const, weeklyLimit: 40, color: "#EF4444", unavailableTimes: [] },
            { name: "María González", role: "empleado" as const, weeklyLimit: 35, color: "#8B5CF6", unavailableTimes: [{ dayOfWeek: 1, startTime: "00:00", endTime: "08:00" }] },
            { name: "Pedro Sánchez", role: "empleado" as const, weeklyLimit: 30, color: "#06B6D4", unavailableTimes: [{ dayOfWeek: 3, startTime: "18:00", endTime: "23:59" }] },
            { name: "Laura Torres", role: "empleado" as const, weeklyLimit: 25, color: "#84CC16", unavailableTimes: [{ dayOfWeek: 5, startTime: "00:00", endTime: "23:59" }] },
            { name: "Diego Morales", role: "empleado" as const, weeklyLimit: 30, color: "#F97316", unavailableTimes: [{ dayOfWeek: 2, startTime: "12:00", endTime: "14:00" }] }
          ],
          schedule: {
            // Horario normal, abre todos los días
            monday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            tuesday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            wednesday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            thursday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            friday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            saturday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            sunday: { isOpen: true, timeRanges: [{ openTime: "10:00", closeTime: "18:00" }] }
          }
        },
        {
          name: "Tienda Sur",
          address: "Av. Sur 789, Zona Sur",
          phone: "+54 11 3456-7890",
          employees: [
            { name: "Elena Ruiz", role: "encargado" as const, weeklyLimit: 40, color: "#EC4899", unavailableTimes: [] },
            { name: "Roberto Vega", role: "empleado" as const, weeklyLimit: 35, color: "#6366F1", unavailableTimes: [{ dayOfWeek: 0, startTime: "00:00", endTime: "23:59" }] },
            { name: "Carmen Díaz", role: "empleado" as const, weeklyLimit: 30, color: "#F59E0B", unavailableTimes: [{ dayOfWeek: 4, startTime: "00:00", endTime: "23:59" }] },
            { name: "Javier Herrera", role: "empleado" as const, weeklyLimit: 25, color: "#10B981", unavailableTimes: [{ dayOfWeek: 6, startTime: "14:00", endTime: "23:59" }] }
          ],
          schedule: {
            // Horario normal, abre todos los días
            monday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            tuesday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            wednesday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            thursday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            friday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            saturday: { isOpen: true, timeRanges: [{ openTime: "09:00", closeTime: "20:00" }] },
            sunday: { isOpen: true, timeRanges: [{ openTime: "10:00", closeTime: "18:00" }] }
          }
        }
      ];

      // Crear las tiendas
      for (const storeData of storesToCreate) {
        setProgress(`Creando tienda: ${storeData.name}`);
        
        try {
          const store = await addDoc(collection(db, 'stores'), {
            name: storeData.name,
            address: storeData.address,
            phone: storeData.phone,
            isActive: true,
            employees: [],
            shifts: [],
            storeSchedule: [],
            settings: {}
          });
          
          results.stores++;

          // Crear empleados para esta tienda
          const createdEmployees = [];
          for (const employeeData of storeData.employees) {
            try {
              const employeeDoc = await addDoc(collection(db, 'employees'), {
                name: employeeData.name,
                username: employeeData.name.toLowerCase().replace(/\s+/g, '.'),
                password: "123456",
                weeklyLimit: employeeData.weeklyLimit,
                monthlyHoursLimit: employeeData.weeklyLimit * 4,
                birthday: "1990-01-01",
                isActive: true,
                color: employeeData.color,
                role: employeeData.role,
                storeId: store.id,
                unavailableTimes: employeeData.unavailableTimes.map(ut => ({
                  id: uuidv4(),
                  ...ut
                })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              
              createdEmployees.push({
                id: employeeDoc.id,
                name: employeeData.name,
                color: employeeData.color,
                unavailableTimes: employeeData.unavailableTimes
              });
              results.employeesCreated++;
            } catch (error) {
              results.errors.push(`Error creando empleado ${employeeData.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

          // Crear horarios de tienda
          setProgress(`Configurando horarios para ${storeData.name}`);
          const dayMapping = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
          
          for (const [dayName, schedule] of Object.entries(storeData.schedule)) {
            const dayOfWeek = dayMapping[dayName as keyof typeof dayMapping];
            const timeRanges = schedule.timeRanges.map((range, index) => ({
              id: `range_${dayOfWeek}_${index}`,
              openTime: range.openTime,
              closeTime: range.closeTime
            }));

            await addDoc(collection(db, 'storeSchedule'), {
              dayOfWeek,
              isOpen: schedule.isOpen,
              timeRanges,
              storeId: store.id
            });
          }

          // Generar turnos para los últimos 3 meses y próximo mes
          setProgress(`Generando turnos para ${storeData.name}...`);
          const shifts = generateShiftsForFourMonths(createdEmployees, store.id, storeData.schedule);
          
          for (const shiftData of shifts) {
            try {
              await addDoc(collection(db, 'shifts'), shiftData);
              results.shiftsCreated++;
            } catch (error) {
              results.errors.push(`Error creando turno: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

        } catch (error) {
          results.errors.push(`Error creando tienda ${storeData.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      setProgress('Datos generados exitosamente');
      setResults(results);

    } catch (error) {
      console.error('Error generando datos:', error);
      setProgress(`Error generando datos: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Generador de Datos de Prueba
        </h2>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            ¿Qué se generará?
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              5 empleados por tienda con restricciones realistas
            </li>
            <li className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Horarios para los próximos 2 meses
            </li>
            <li className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Datos optimizados para probar estadísticas
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={clearAllData}
            disabled={isClearing || isGenerating}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isClearing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Borrando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Borrar Todos los Datos
              </>
            )}
          </button>

          <button
            onClick={generateTestData}
            disabled={isGenerating || isClearing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generando...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Generar Datos de Prueba
              </>
            )}
          </button>
        </div>

        {progress && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            {progress}
          </div>
        )}

        {results && (
          <div className={`border rounded-lg p-4 ${
            results.cleared === false 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : results.errors && results.errors.length > 0
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <h3 className={`font-medium mb-2 ${
              results.cleared === false 
                ? 'text-red-900 dark:text-red-100'
                : results.errors && results.errors.length > 0
                ? 'text-yellow-900 dark:text-yellow-100'
                : 'text-green-900 dark:text-green-100'
            }`}>
              {results.cleared === false ? 'Error:' : 'Resultados:'}
            </h3>
            <div className={`text-sm space-y-1 ${
              results.cleared === false 
                ? 'text-red-800 dark:text-red-200'
                : results.errors && results.errors.length > 0
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-green-800 dark:text-green-200'
            }`}>
              {results.cleared === false ? (
                <p>Error: {results.error}</p>
              ) : (
                <>
                  {results.deletedCount !== undefined && (
                    <p>Documentos eliminados: {results.deletedCount}</p>
                  )}
                  {results.remainingDocs !== undefined && (
                    <p>Documentos restantes: {results.remainingDocs}</p>
                  )}
                  {results.stores !== undefined && (
                    <p>Tiendas procesadas: {results.stores}</p>
                  )}
                  {results.employeesCreated !== undefined && (
                    <p>Empleados creados: {results.employeesCreated}</p>
                  )}
                  {results.shiftsCreated !== undefined && (
                    <p>Turnos generados: {results.shiftsCreated}</p>
                  )}
                  {results.errors && results.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Advertencias/Errores:</p>
                      <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                        {results.errors.map((error: string, index: number) => (
                          <li key={index} className="text-xs">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
