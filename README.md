# Sistema de Gestión de Horarios de Empleados

Una aplicación web moderna para gestionar horarios de empleados con funcionalidades avanzadas de planificación, validación y análisis.

## 🚀 Características Principales

### MVP (Funcionalidades Core)
- ✅ **Sistema de Autenticación** - Login con roles (encargado/empleado)
- ✅ **Gestión de Empleados** - Alta, edición, topes mensuales, no disponibilidad
- ✅ **Configuración de Tienda** - Horarios semanales y excepciones
- ✅ **Gantt Interactivo** - Crear, mover y redimensionar turnos visualmente
- ✅ **Validaciones Automáticas** - Detección de conflictos y errores
- ✅ **Roles y Permisos** - Vistas diferenciadas según el rol
- ✅ **Almacenamiento Offline** - Funciona sin conexión usando Local Storage
- ✅ **UI Responsive** - Adaptable a móvil y escritorio

### MVP+ (Funcionalidades Avanzadas)
- ✅ **Estadísticas** - Métricas de carga, cobertura, utilización
- ✅ **Exportación** - iCal, CSV, Google Calendar (en desarrollo)
- ✅ **Plantillas** - Guardar y reutilizar semanas completas
- ✅ **Notificaciones** - Sistema de avisos (estructura preparada)

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Iconos**: Lucide React
- **Fechas**: date-fns
- **Almacenamiento**: Local Storage (offline-first)
- **Drag & Drop**: @dnd-kit (preparado para futuras mejoras)

## 📋 Casos de Uso Implementados

### Para Encargados
1. **Planificación Visual** - Crear turnos arrastrando en el Gantt
2. **Gestión de Empleados** - Administrar información y restricciones
3. **Configuración de Tienda** - Definir horarios y excepciones
4. **Validación Automática** - Prevenir conflictos y errores
5. **Análisis y Estadísticas** - Métricas de carga y cobertura
6. **Exportación** - Compartir horarios en diferentes formatos

### Para Empleados
1. **Consulta de Horarios** - Ver solo sus turnos asignados
2. **Información Personal** - Acceso a sus datos y restricciones
3. **Notificaciones** - Avisos de cambios en horarios

## 🎯 Funcionalidades del Gantt

- **Creación Visual** - Click para crear turnos de 8 horas
- **Drag & Drop** - Mover turnos arrastrando
- **Redimensionamiento** - Ajustar duración de turnos
- **Navegación Semanal** - Cambiar entre semanas
- **Vista de Borradores** - Mostrar/ocultar turnos no publicados
- **Validación en Tiempo Real** - Alertas inmediatas de conflictos

## 🔧 Instalación y Uso

### Prerrequisitos
- Node.js 16+ 
- npm o yarn

### Instalación
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

### Usuarios de Prueba
- **Encargado**: `encargado1` / `12345`
- **Empleado**: `empleado1` / `67890`

## 📱 Diseño Responsive

La aplicación está optimizada para:
- **Desktop** - Vista completa con todas las funcionalidades
- **Tablet** - Interfaz adaptada con navegación por pestañas
- **Móvil** - Vista simplificada con controles táctiles

## 🔒 Seguridad y Roles

### Encargado
- Acceso completo a todas las funcionalidades
- Gestión de empleados y horarios
- Configuración del sistema
- Análisis y exportación

### Empleado
- Solo lectura de sus propios horarios
- Información personal limitada
- Sin acceso a funciones administrativas

## 📊 Validaciones Implementadas

- **Horario de Tienda** - Turnos fuera del horario de apertura
- **Excepciones** - Turnos en días cerrados
- **Solapamiento** - Conflictos entre turnos del mismo empleado
- **No Disponibilidad** - Respeto a restricciones de horario
- **Tope Mensual** - Control de horas asignadas vs límite

## 🚀 Próximas Mejoras

- [ ] Integración con Google Calendar API
- [ ] Sistema de notificaciones push
- [ ] Plantillas avanzadas con condiciones
- [ ] Sincronización en la nube
- [ ] Reportes avanzados y gráficos
- [ ] API REST para integraciones
- [ ] Modo oscuro
- [ ] Accesibilidad mejorada

## 📝 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── AppRouter.tsx   # Enrutamiento principal
│   ├── LoginScreen.tsx # Pantalla de login
│   ├── ManagerDashboard.tsx # Dashboard del encargado
│   ├── EmployeeDashboard.tsx # Dashboard del empleado
│   ├── EmployeeManagement.tsx # Gestión de empleados
│   ├── ScheduleManagement.tsx # Gantt interactivo
│   ├── StoreSettings.tsx # Configuración de tienda
│   ├── Statistics.tsx   # Estadísticas y métricas
│   └── ExportTools.tsx # Herramientas de exportación
├── contexts/            # Contextos de React
│   ├── AuthContext.tsx # Autenticación
│   ├── EmployeeContext.tsx # Gestión de empleados
│   └── ScheduleContext.tsx # Gestión de horarios
├── types/               # Definiciones TypeScript
│   └── index.ts        # Tipos principales
└── App.tsx             # Componente raíz
```

## 🎨 Diseño y UX

- **Paleta de Colores** - Azul primario con grises neutros
- **Tipografía** - Inter (sistema) para legibilidad
- **Iconografía** - Lucide React para consistencia
- **Espaciado** - Sistema de espaciado de Tailwind
- **Interacciones** - Transiciones suaves y feedback visual

## 📈 Métricas y Analytics

El sistema incluye métricas clave:
- Horas asignadas vs tope mensual
- Días desde último fin de semana libre
- Día más ocupado por empleado
- Problemas de cobertura
- Utilización de recursos

---

**Desarrollado con ❤️ para optimizar la gestión de horarios empresariales**


