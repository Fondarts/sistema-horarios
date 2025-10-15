import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { v4 as uuidv4 } from 'uuid';
import { Download, Users, Calendar, Database } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export function TestDataGenerator() {
  const { stores, getAllStores } = useStore();
  const { addEmployee } = useEmployees();
  const { addShift } = useSchedule();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<any>(null);

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

  const generateTestData = async () => {
    setIsGenerating(true);
    setProgress('');
    setResults(null);

    try {
      // Obtener todas las tiendas
      const allStores = await getAllStores();
      setProgress(`Encontradas ${allStores.length} tiendas`);

      const results = {
        stores: allStores.length,
        employeesCreated: 0,
        shiftsCreated: 0,
        errors: [] as string[]
      };

      // Generar empleados para cada tienda
      for (let i = 0; i < allStores.length; i++) {
        const store = allStores[i];
        setProgress(`Procesando tienda: ${store.name} (${i + 1}/${allStores.length})`);

        // Crear 5 empleados para esta tienda
        const storeEmployees = testEmployees.slice(i * 5, (i + 1) * 5);
        const createdEmployees = [];

        for (const employeeData of storeEmployees) {
          try {
            const createdEmployee = await addEmployeeToStore(employeeData, store.id);
            createdEmployees.push(createdEmployee);
            results.employeesCreated++;
          } catch (error) {
            results.errors.push(`Error creando empleado ${employeeData.name}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Generar horarios para estos empleados
        setProgress(`Generando horarios para ${store.name}...`);
        const shifts = generateShiftsForTwoMonths(createdEmployees, store.id);
        
        for (const shiftData of shifts) {
          try {
            await addShiftToStore(shiftData);
            results.shiftsCreated++;
          } catch (error) {
            results.errors.push(`Error creando turno: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      setResults(results);
      setProgress('¡Datos de prueba generados exitosamente!');
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : String(error) });
      setProgress('Error generando datos de prueba');
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

        <button
          onClick={generateTestData}
          disabled={isGenerating}
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

        {progress && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            {progress}
          </div>
        )}

        {results && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
              Resultados:
            </h3>
            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <p>Tiendas procesadas: {results.stores}</p>
              <p>Empleados creados: {results.employeesCreated}</p>
              <p>Turnos generados: {results.shiftsCreated}</p>
              {results.errors && results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Errores:</p>
                  <ul className="list-disc list-inside">
                    {results.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
