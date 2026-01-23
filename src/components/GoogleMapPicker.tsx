import React, { useEffect, useRef, useState } from 'react';

interface GoogleMapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}

declare global {
  interface Window {
    google: any;
    googleMapsLoaded?: boolean;
    googleMapsLoadCallbacks?: Array<() => void>;
  }
}

// Variable global para rastrear si el script ya está cargando
let scriptLoading = false;

export function GoogleMapPicker({ latitude, longitude, onLocationChange, address }: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el script de Google Maps
  useEffect(() => {
    // Si ya está cargado, establecer el estado
    if (window.google && window.googleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    // Si ya está cargando, esperar a que termine
    if (scriptLoading) {
      // Agregar callback a la lista de espera
      if (!window.googleMapsLoadCallbacks) {
        window.googleMapsLoadCallbacks = [];
      }
      window.googleMapsLoadCallbacks.push(() => {
        setIsLoaded(true);
      });
      return;
    }

    // Verificar si el script ya existe en el DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // El script ya existe, esperar a que cargue
      scriptLoading = true;
      const checkInterval = setInterval(() => {
        if (window.google && window.googleMapsLoaded) {
          clearInterval(checkInterval);
          scriptLoading = false;
          setIsLoaded(true);
        }
      }, 100);

      // Timeout después de 10 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google) {
          setError('Error al cargar Google Maps. Verifica tu API key.');
        }
      }, 10000);

      return () => clearInterval(checkInterval);
    }

    // Cargar el script
    scriptLoading = true;
    const script = document.createElement('script');
    // API key de Google Maps - configurada en .env
    const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCpB7O3pBbbcA4qOJpZsHXUdOBRZkRrc2g';
    
    // Usar un callback único
    const callbackName = `initGoogleMaps_${Date.now()}`;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    // Definir el callback global
    (window as any)[callbackName] = () => {
      window.googleMapsLoaded = true;
      scriptLoading = false;
      setIsLoaded(true);
      
      // Ejecutar todos los callbacks en espera
      if (window.googleMapsLoadCallbacks) {
        window.googleMapsLoadCallbacks.forEach(cb => cb());
        window.googleMapsLoadCallbacks = [];
      }
      
      // Limpiar el callback
      delete (window as any)[callbackName];
    };

    script.onerror = () => {
      scriptLoading = false;
      setError('Error al cargar Google Maps. Verifica tu API key y conexión a internet.');
    };

    document.head.appendChild(script);

    return () => {
      // No limpiar el script ya que puede ser usado por otros componentes
    };
  }, []);

  // Inicializar el mapa cuando Google Maps esté cargado
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google || map) return;

    const defaultLat = latitude || -34.6037;
    const defaultLng = longitude || -58.3816;

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: defaultLat, lng: defaultLng },
        zoom: latitude && longitude ? 15 : 10,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      setMap(mapInstance);

      const geocoderInstance = new window.google.maps.Geocoder();
      setGeocoder(geocoderInstance);

      // Crear marcador inicial
      const markerInstance = new window.google.maps.Marker({
        position: { lat: defaultLat, lng: defaultLng },
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      setMarker(markerInstance);

      // Listener para cuando se arrastra el marcador
      markerInstance.addListener('dragend', () => {
        const position = markerInstance.getPosition();
        if (position) {
          const lat = position.lat();
          const lng = position.lng();
          onLocationChange(lat, lng);
        }
      });

      // Listener para cuando se hace clic en el mapa
      mapInstance.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        markerInstance.setPosition({ lat, lng });
        onLocationChange(lat, lng);
      });

      // Si hay coordenadas iniciales, centrar el mapa
      if (latitude && longitude) {
        mapInstance.setCenter({ lat: latitude, lng: longitude });
        markerInstance.setPosition({ lat: latitude, lng: longitude });
      }

      // Si hay dirección pero no coordenadas, geocodificar la dirección
      if (address && !latitude && !longitude) {
        geocoderInstance.geocode({ address }, (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            mapInstance.setCenter({ lat, lng });
            markerInstance.setPosition({ lat, lng });
            onLocationChange(lat, lng);
          }
        });
      }
    } catch (err) {
      console.error('Error inicializando mapa:', err);
      setError('Error al inicializar el mapa. Verifica tu API key de Google Maps.');
    }
  }, [isLoaded, latitude, longitude, address, onLocationChange, map]);

  // Actualizar marcador cuando cambien las coordenadas externamente
  useEffect(() => {
    if (marker && latitude && longitude) {
      marker.setPosition({ lat: latitude, lng: longitude });
      if (map) {
        map.setCenter({ lat: latitude, lng: longitude });
      }
    }
  }, [latitude, longitude, marker, map]);

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 relative">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <div className="text-center p-4">
            <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configura REACT_APP_GOOGLE_MAPS_API_KEY en tu archivo .env
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
