import { Holiday } from '../contexts/HolidayContext';

export interface CountryHolidays {
  [country: string]: (year: number) => Holiday[];
}

export const nationalHolidays: CountryHolidays = {
  // España
  ES: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Año Nuevo',
      type: 'national',
      description: 'Día de Año Nuevo',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `epiphany-${year}`,
      date: `${year}-01-06`,
      name: 'Epifanía del Señor',
      type: 'national',
      description: 'Día de Reyes',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Día del Trabajador',
      type: 'national',
      description: 'Día Internacional del Trabajador',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `assumption-${year}`,
      date: `${year}-08-15`,
      name: 'Asunción de la Virgen',
      type: 'national',
      description: 'Asunción de la Virgen María',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `hispanic-day-${year}`,
      date: `${year}-10-12`,
      name: 'Fiesta Nacional de España',
      type: 'national',
      description: 'Día de la Hispanidad',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `all-saints-${year}`,
      date: `${year}-11-01`,
      name: 'Día de Todos los Santos',
      type: 'national',
      description: 'Día de Todos los Santos',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `constitution-day-${year}`,
      date: `${year}-12-06`,
      name: 'Día de la Constitución',
      type: 'national',
      description: 'Día de la Constitución Española',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `immaculate-conception-${year}`,
      date: `${year}-12-08`,
      name: 'Inmaculada Concepción',
      type: 'national',
      description: 'Inmaculada Concepción',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Navidad',
      type: 'national',
      description: 'Día de Navidad',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // Argentina
  AR: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Año Nuevo',
      type: 'national',
      description: 'Día de Año Nuevo',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `carnival-1-${year}`,
      date: `${year}-02-12`, // Fecha aproximada, varía cada año
      name: 'Carnaval',
      type: 'national',
      description: 'Día de Carnaval',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `carnival-2-${year}`,
      date: `${year}-02-13`, // Fecha aproximada, varía cada año
      name: 'Carnaval',
      type: 'national',
      description: 'Día de Carnaval',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `malvinas-${year}`,
      date: `${year}-04-02`,
      name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas',
      type: 'national',
      description: 'Día del Veterano y de los Caídos en la Guerra de Malvinas',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Día del Trabajador',
      type: 'national',
      description: 'Día Internacional del Trabajador',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `may-revolution-${year}`,
      date: `${year}-05-25`,
      name: 'Día de la Revolución de Mayo',
      type: 'national',
      description: 'Día de la Revolución de Mayo',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `flag-day-${year}`,
      date: `${year}-06-20`,
      name: 'Día de la Bandera',
      type: 'national',
      description: 'Día de la Bandera Nacional',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `independence-${year}`,
      date: `${year}-07-09`,
      name: 'Día de la Independencia',
      type: 'national',
      description: 'Día de la Independencia Argentina',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `san-martin-${year}`,
      date: `${year}-08-17`,
      name: 'Paso a la Inmortalidad del General José de San Martín',
      type: 'national',
      description: 'Paso a la Inmortalidad del General José de San Martín',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `respect-day-${year}`,
      date: `${year}-10-12`,
      name: 'Día del Respeto a la Diversidad Cultural',
      type: 'national',
      description: 'Día del Respeto a la Diversidad Cultural',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `sovereignty-${year}`,
      date: `${year}-11-20`,
      name: 'Día de la Soberanía Nacional',
      type: 'national',
      description: 'Día de la Soberanía Nacional',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `immaculate-conception-${year}`,
      date: `${year}-12-08`,
      name: 'Inmaculada Concepción de María',
      type: 'national',
      description: 'Inmaculada Concepción de María',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Navidad',
      type: 'national',
      description: 'Día de Navidad',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // Estados Unidos
  US: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'New Year\'s Day',
      type: 'national',
      description: 'New Year\'s Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `martin-luther-king-${year}`,
      date: `${year}-01-15`, // Third Monday of January
      name: 'Martin Luther King Jr. Day',
      type: 'national',
      description: 'Martin Luther King Jr. Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `presidents-day-${year}`,
      date: `${year}-02-19`, // Third Monday of February
      name: 'Presidents\' Day',
      type: 'national',
      description: 'Presidents\' Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `memorial-day-${year}`,
      date: `${year}-05-27`, // Last Monday of May
      name: 'Memorial Day',
      type: 'national',
      description: 'Memorial Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `independence-${year}`,
      date: `${year}-07-04`,
      name: 'Independence Day',
      type: 'national',
      description: 'Independence Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labor-day-${year}`,
      date: `${year}-09-02`, // First Monday of September
      name: 'Labor Day',
      type: 'national',
      description: 'Labor Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `columbus-day-${year}`,
      date: `${year}-10-14`, // Second Monday of October
      name: 'Columbus Day',
      type: 'national',
      description: 'Columbus Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `veterans-day-${year}`,
      date: `${year}-11-11`,
      name: 'Veterans Day',
      type: 'national',
      description: 'Veterans Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `thanksgiving-${year}`,
      date: `${year}-11-28`, // Fourth Thursday of November
      name: 'Thanksgiving Day',
      type: 'national',
      description: 'Thanksgiving Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Christmas Day',
      type: 'national',
      description: 'Christmas Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // México
  MX: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Año Nuevo',
      type: 'national',
      description: 'Día de Año Nuevo',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `constitution-day-${year}`,
      date: `${year}-02-05`,
      name: 'Día de la Constitución',
      type: 'national',
      description: 'Día de la Constitución Mexicana',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `benito-juarez-${year}`,
      date: `${year}-03-21`,
      name: 'Natalicio de Benito Juárez',
      type: 'national',
      description: 'Natalicio de Benito Juárez',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Día del Trabajador',
      type: 'national',
      description: 'Día Internacional del Trabajador',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `independence-${year}`,
      date: `${year}-09-16`,
      name: 'Día de la Independencia',
      type: 'national',
      description: 'Día de la Independencia de México',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `revolution-day-${year}`,
      date: `${year}-11-20`,
      name: 'Día de la Revolución',
      type: 'national',
      description: 'Día de la Revolución Mexicana',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Navidad',
      type: 'national',
      description: 'Día de Navidad',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // Chile
  CL: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Año Nuevo',
      type: 'national',
      description: 'Día de Año Nuevo',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `good-friday-${year}`,
      date: `${year}-03-29`, // Fecha aproximada, varía cada año
      name: 'Viernes Santo',
      type: 'national',
      description: 'Viernes Santo',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Día del Trabajador',
      type: 'national',
      description: 'Día Internacional del Trabajador',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `navy-day-${year}`,
      date: `${year}-05-21`,
      name: 'Día de las Glorias Navales',
      type: 'national',
      description: 'Día de las Glorias Navales',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `independence-${year}`,
      date: `${year}-09-18`,
      name: 'Fiestas Patrias',
      type: 'national',
      description: 'Fiestas Patrias de Chile',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `army-day-${year}`,
      date: `${year}-09-19`,
      name: 'Día del Ejército',
      type: 'national',
      description: 'Día del Ejército de Chile',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `discovery-${year}`,
      date: `${year}-10-12`,
      name: 'Día del Descubrimiento de América',
      type: 'national',
      description: 'Día del Descubrimiento de América',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `reformation-${year}`,
      date: `${year}-10-31`,
      name: 'Día Nacional de las Iglesias Evangélicas y Protestantes',
      type: 'national',
      description: 'Día Nacional de las Iglesias Evangélicas y Protestantes',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `all-saints-${year}`,
      date: `${year}-11-01`,
      name: 'Día de Todos los Santos',
      type: 'national',
      description: 'Día de Todos los Santos',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `immaculate-conception-${year}`,
      date: `${year}-12-08`,
      name: 'Inmaculada Concepción',
      type: 'national',
      description: 'Inmaculada Concepción',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Navidad',
      type: 'national',
      description: 'Día de Navidad',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ]
};
