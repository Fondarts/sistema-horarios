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
  ],

  // Portugal
  PT: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Dia de Ano Novo',
      type: 'national',
      description: 'Dia de Ano Novo',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `carnival-${year}`,
      date: `${year}-02-13`, // Fecha aproximada, varía cada año
      name: 'Carnaval',
      type: 'national',
      description: 'Dia de Carnaval',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `good-friday-${year}`,
      date: `${year}-03-29`, // Fecha aproximada, varía cada año
      name: 'Sexta-feira Santa',
      type: 'national',
      description: 'Sexta-feira Santa',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `easter-${year}`,
      date: `${year}-03-31`, // Fecha aproximada, varía cada año
      name: 'Páscoa',
      type: 'national',
      description: 'Dia de Páscoa',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `liberty-day-${year}`,
      date: `${year}-04-25`,
      name: 'Dia da Liberdade',
      type: 'national',
      description: 'Dia da Liberdade',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Dia do Trabalhador',
      type: 'national',
      description: 'Dia Internacional do Trabalhador',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `portugal-day-${year}`,
      date: `${year}-06-10`,
      name: 'Dia de Portugal',
      type: 'national',
      description: 'Dia de Portugal, de Camões e das Comunidades Portuguesas',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `assumption-${year}`,
      date: `${year}-08-15`,
      name: 'Assunção de Nossa Senhora',
      type: 'national',
      description: 'Assunção de Nossa Senhora',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `republic-day-${year}`,
      date: `${year}-10-05`,
      name: 'Dia da República',
      type: 'national',
      description: 'Dia da Implantação da República',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `all-saints-${year}`,
      date: `${year}-11-01`,
      name: 'Dia de Todos os Santos',
      type: 'national',
      description: 'Dia de Todos os Santos',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `independence-${year}`,
      date: `${year}-12-01`,
      name: 'Dia da Restauração da Independência',
      type: 'national',
      description: 'Dia da Restauração da Independência',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `immaculate-conception-${year}`,
      date: `${year}-12-08`,
      name: 'Imaculada Conceição',
      type: 'national',
      description: 'Imaculada Conceição',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Natal',
      type: 'national',
      description: 'Dia de Natal',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // Alemania
  DE: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Neujahr',
      type: 'national',
      description: 'Neujahrstag',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `good-friday-${year}`,
      date: `${year}-03-29`, // Fecha aproximada, varía cada año
      name: 'Karfreitag',
      type: 'national',
      description: 'Karfreitag',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `easter-monday-${year}`,
      date: `${year}-04-01`, // Fecha aproximada, varía cada año
      name: 'Ostermontag',
      type: 'national',
      description: 'Ostermontag',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Tag der Arbeit',
      type: 'national',
      description: 'Tag der Arbeit',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `ascension-${year}`,
      date: `${year}-05-09`, // Fecha aproximada, varía cada año
      name: 'Christi Himmelfahrt',
      type: 'national',
      description: 'Christi Himmelfahrt',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `whit-monday-${year}`,
      date: `${year}-05-20`, // Fecha aproximada, varía cada año
      name: 'Pfingstmontag',
      type: 'national',
      description: 'Pfingstmontag',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `german-unity-${year}`,
      date: `${year}-10-03`,
      name: 'Tag der Deutschen Einheit',
      type: 'national',
      description: 'Tag der Deutschen Einheit',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Weihnachtstag',
      type: 'national',
      description: 'Erster Weihnachtstag',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `boxing-day-${year}`,
      date: `${year}-12-26`,
      name: 'Zweiter Weihnachtstag',
      type: 'national',
      description: 'Zweiter Weihnachtstag',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // Inglaterra (Reino Unido)
  GB: (year: number): Holiday[] => [
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
      id: `good-friday-${year}`,
      date: `${year}-03-29`, // Fecha aproximada, varía cada año
      name: 'Good Friday',
      type: 'national',
      description: 'Good Friday',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `easter-monday-${year}`,
      date: `${year}-04-01`, // Fecha aproximada, varía cada año
      name: 'Easter Monday',
      type: 'national',
      description: 'Easter Monday',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `early-may-${year}`,
      date: `${year}-05-06`, // Primer lunes de mayo
      name: 'Early May Bank Holiday',
      type: 'national',
      description: 'Early May Bank Holiday',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `spring-${year}`,
      date: `${year}-05-27`, // Último lunes de mayo
      name: 'Spring Bank Holiday',
      type: 'national',
      description: 'Spring Bank Holiday',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `summer-${year}`,
      date: `${year}-08-26`, // Último lunes de agosto
      name: 'Summer Bank Holiday',
      type: 'national',
      description: 'Summer Bank Holiday',
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
    },
    {
      id: `boxing-day-${year}`,
      date: `${year}-12-26`,
      name: 'Boxing Day',
      type: 'national',
      description: 'Boxing Day',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // Italia
  IT: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Capodanno',
      type: 'national',
      description: 'Capodanno',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `epiphany-${year}`,
      date: `${year}-01-06`,
      name: 'Epifania',
      type: 'national',
      description: 'Epifania del Signore',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `easter-${year}`,
      date: `${year}-03-31`, // Fecha aproximada, varía cada año
      name: 'Pasqua',
      type: 'national',
      description: 'Domenica di Pasqua',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `easter-monday-${year}`,
      date: `${year}-04-01`, // Fecha aproximada, varía cada año
      name: 'Lunedì dell\'Angelo',
      type: 'national',
      description: 'Lunedì dell\'Angelo',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `liberation-day-${year}`,
      date: `${year}-04-25`,
      name: 'Festa della Liberazione',
      type: 'national',
      description: 'Festa della Liberazione',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Festa del Lavoro',
      type: 'national',
      description: 'Festa del Lavoro',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `republic-day-${year}`,
      date: `${year}-06-02`,
      name: 'Festa della Repubblica',
      type: 'national',
      description: 'Festa della Repubblica Italiana',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `assumption-${year}`,
      date: `${year}-08-15`,
      name: 'Ferragosto',
      type: 'national',
      description: 'Assunzione di Maria',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `all-saints-${year}`,
      date: `${year}-11-01`,
      name: 'Ognissanti',
      type: 'national',
      description: 'Tutti i Santi',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `immaculate-conception-${year}`,
      date: `${year}-12-08`,
      name: 'Immacolata Concezione',
      type: 'national',
      description: 'Immacolata Concezione',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Natale',
      type: 'national',
      description: 'Natale',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `boxing-day-${year}`,
      date: `${year}-12-26`,
      name: 'Santo Stefano',
      type: 'national',
      description: 'Santo Stefano',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // Francia
  FR: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Jour de l\'An',
      type: 'national',
      description: 'Jour de l\'An',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `easter-monday-${year}`,
      date: `${year}-04-01`, // Fecha aproximada, varía cada año
      name: 'Lundi de Pâques',
      type: 'national',
      description: 'Lundi de Pâques',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Fête du Travail',
      type: 'national',
      description: 'Fête du Travail',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `victory-day-${year}`,
      date: `${year}-05-08`,
      name: 'Fête de la Victoire',
      type: 'national',
      description: 'Fête de la Victoire 1945',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `ascension-${year}`,
      date: `${year}-05-09`, // Fecha aproximada, varía cada año
      name: 'Ascension',
      type: 'national',
      description: 'Ascension',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `whit-monday-${year}`,
      date: `${year}-05-20`, // Fecha aproximada, varía cada año
      name: 'Lundi de Pentecôte',
      type: 'national',
      description: 'Lundi de Pentecôte',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `bastille-day-${year}`,
      date: `${year}-07-14`,
      name: 'Fête Nationale',
      type: 'national',
      description: 'Fête Nationale Française',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `assumption-${year}`,
      date: `${year}-08-15`,
      name: 'Assomption',
      type: 'national',
      description: 'Assomption de Marie',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `all-saints-${year}`,
      date: `${year}-11-01`,
      name: 'Toussaint',
      type: 'national',
      description: 'Toussaint',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `armistice-${year}`,
      date: `${year}-11-11`,
      name: 'Armistice',
      type: 'national',
      description: 'Armistice 1918',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Noël',
      type: 'national',
      description: 'Noël',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ],

  // Andorra
  AD: (year: number): Holiday[] => [
    {
      id: `new-year-${year}`,
      date: `${year}-01-01`,
      name: 'Any Nou',
      type: 'national',
      description: 'Any Nou',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `epiphany-${year}`,
      date: `${year}-01-06`,
      name: 'Reis',
      type: 'national',
      description: 'Dia de Reis',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `constitution-day-${year}`,
      date: `${year}-03-14`,
      name: 'Dia de la Constitució',
      type: 'national',
      description: 'Dia de la Constitució d\'Andorra',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `good-friday-${year}`,
      date: `${year}-03-29`, // Fecha aproximada, varía cada año
      name: 'Divendres Sant',
      type: 'national',
      description: 'Divendres Sant',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `easter-monday-${year}`,
      date: `${year}-04-01`, // Fecha aproximada, varía cada año
      name: 'Dilluns de Pasqua',
      type: 'national',
      description: 'Dilluns de Pasqua',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `labour-day-${year}`,
      date: `${year}-05-01`,
      name: 'Dia del Treballador',
      type: 'national',
      description: 'Dia Internacional del Treballador',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `whit-monday-${year}`,
      date: `${year}-05-20`, // Fecha aproximada, varía cada año
      name: 'Dilluns de Pentecosta',
      type: 'national',
      description: 'Dilluns de Pentecosta',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `assumption-${year}`,
      date: `${year}-08-15`,
      name: 'Assumpció',
      type: 'national',
      description: 'Assumpció de Maria',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `national-day-${year}`,
      date: `${year}-09-08`,
      name: 'Mare de Déu de Meritxell',
      type: 'national',
      description: 'Mare de Déu de Meritxell',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `all-saints-${year}`,
      date: `${year}-11-01`,
      name: 'Tots Sants',
      type: 'national',
      description: 'Tots Sants',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `immaculate-conception-${year}`,
      date: `${year}-12-08`,
      name: 'Immaculada Concepció',
      type: 'national',
      description: 'Immaculada Concepció',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `christmas-${year}`,
      date: `${year}-12-25`,
      name: 'Nadal',
      type: 'national',
      description: 'Nadal',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    },
    {
      id: `boxing-day-${year}`,
      date: `${year}-12-26`,
      name: 'Sant Esteve',
      type: 'national',
      description: 'Sant Esteve',
      isRecurring: true,
      addedToCalendar: false,
      year: year
    }
  ]
};
