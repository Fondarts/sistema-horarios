import React, { useState, useEffect } from 'react';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'HH:MM',
  required = false,
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatTime = (input: string): string => {
    // Remover caracteres no numéricos excepto ':'
    const cleaned = input.replace(/[^\d:]/g, '');
    
    // Si no hay ':', agregar automáticamente después de 2 dígitos
    if (!cleaned.includes(':') && cleaned.length >= 2) {
      return cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4);
    }
    
    return cleaned;
  };

  // Redondear minutos al múltiplo de 5 más cercano
  const roundToNearest5Minutes = (minutes: number): number => {
    return Math.round(minutes / 5) * 5;
  };

  const validateTime = (time: string): boolean => {
    if (!time || time.length < 5) return false;
    
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return false;
    
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    // Validar horas y minutos básicos
    if (h < 0 || h > 23 || m < 0 || m > 59) return false;
    
    // Validar que los minutos sean múltiplos de 5
    return m % 5 === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatTime(input);
    
    setDisplayValue(formatted);
    
    // Validar formato básico y redondear minutos a múltiplos de 5
    if (formatted && formatted.length >= 5) {
      const [hours, minutes] = formatted.split(':');
      if (hours && minutes) {
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          // Redondear minutos al múltiplo de 5 más cercano
          const roundedMinutes = roundToNearest5Minutes(m);
          const roundedTime = `${h.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
          
          // Solo actualizar si cambió
          if (roundedTime !== formatted) {
            setDisplayValue(roundedTime);
            onChange(roundedTime);
          } else if (validateTime(formatted)) {
            onChange(formatted);
          }
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de navegación
    if ([8, 9, 13, 27, 46, 37, 38, 39, 40].includes(e.keyCode) ||
        (e.keyCode === 65 && e.ctrlKey) || // Ctrl+A
        (e.keyCode >= 35 && e.keyCode <= 40)) { // End, Home, arrows
      return;
    }
    
    // Permitir solo números y ':'
    if ((e.keyCode < 48 || e.keyCode > 57) && 
        (e.keyCode < 96 || e.keyCode > 105) && 
        e.keyCode !== 186) { // ':'
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    // Validar y corregir al perder el foco
    if (displayValue) {
      const [hours, minutes] = displayValue.split(':');
      if (hours && minutes) {
        let correctedHours = Math.min(23, Math.max(0, parseInt(hours, 10) || 0));
        let correctedMinutes = Math.min(59, Math.max(0, parseInt(minutes, 10) || 0));
        
        // Redondear minutos al múltiplo de 5 más cercano
        correctedMinutes = roundToNearest5Minutes(correctedMinutes);
        
        const corrected = `${correctedHours.toString().padStart(2, '0')}:${correctedMinutes.toString().padStart(2, '0')}`;
        
        // Actualizar si cambió
        if (corrected !== displayValue) {
          setDisplayValue(corrected);
          onChange(corrected);
        } else if (!validateTime(displayValue)) {
          // Si no es válido, forzar corrección
          setDisplayValue(corrected);
          onChange(corrected);
        }
      } else {
        // Si no tiene formato válido, establecer un valor por defecto
        const corrected = '00:00';
        setDisplayValue(corrected);
        onChange(corrected);
      }
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      maxLength={5}
      pattern="[0-9]{2}:[0-9]{2}"
      title="Formato: HH:MM (24 horas, solo múltiplos de 5 minutos: 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)"
    />
  );
};

export default TimeInput;
