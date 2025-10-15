import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { User, Lock, AlertCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';

export default function LoginScreen() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Limpiar error al escribir
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Sistema de Horarios
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Inicia sesión con tu usuario y contraseña
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-200 dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 dark:border dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuario
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                  placeholder="Ej: ana.perez"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                  placeholder="Tu contraseña"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
              
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-200 text-gray-500">Información de prueba</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p><strong>Encargado de Distrito:</strong> admin / admin123</p>
              <p><strong>Encargado:</strong> ana.perez / 12345</p>
              <p><strong>Empleados:</strong> luis.gomez / 23456</p>
              <p className="text-gray-400">maria.rodriguez / 34567</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}