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

  const validateTime = (time: string): boolean => {
    if (!time || time.length < 5) return false;
    
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return false;
    
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatTime(input);
    
    setDisplayValue(formatted);
    
    // Solo llamar onChange si el tiempo es válido
    if (validateTime(formatted)) {
      onChange(formatted);
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
    if (displayValue && !validateTime(displayValue)) {
      const [hours, minutes] = displayValue.split(':');
      let correctedHours = hours ? Math.min(23, Math.max(0, parseInt(hours, 10))) : '00';
      let correctedMinutes = minutes ? Math.min(59, Math.max(0, parseInt(minutes, 10))) : '00';
      
      correctedHours = correctedHours.toString().padStart(2, '0');
      correctedMinutes = correctedMinutes.toString().padStart(2, '0');
      
      const corrected = `${correctedHours}:${correctedMinutes}`;
      setDisplayValue(corrected);
      onChange(corrected);
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
      title="Formato: HH:MM (24 horas, ej: 14:30, 23:59)"
    />
  );
};

export default TimeInput;
