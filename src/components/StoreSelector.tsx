import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, BarChart3, Users, Calendar } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useSchedule } from '../contexts/ScheduleContext';

interface StoreSelectorProps {
  onStoreSelect: (storeId: string) => void;
}

export function StoreSelector({ onStoreSelect }: StoreSelectorProps) {
  const { stores, createStore, updateStore, deleteStore } = useStore();
  const { currentEmployee } = useAuth();
  const { employees } = useEmployees();
  const { shifts } = useSchedule();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const handleCreateStore = async () => {
    if (!formData.name.trim()) {
      alert('El nombre de la tienda es obligatorio');
      return;
    }

    try {
      const storeData: any = {
        name: formData.name.trim(),
        isActive: true
      };

      // Solo agregar campos que no estén vacíos
      if (formData.address.trim()) {
        storeData.address = formData.address.trim();
      }
      if (formData.phone.trim()) {
        storeData.phone = formData.phone.trim();
      }
      if (formData.email.trim()) {
        storeData.email = formData.email.trim();
      }

      const storeId = await createStore(storeData);

      setFormData({ name: '', address: '', phone: '', email: '' });
      setShowCreateForm(false);
      alert('Tienda creada exitosamente');
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Error al crear la tienda');
    }
  };

  const handleEditStore = async (storeId: string) => {
    if (!formData.name.trim()) {
      alert('El nombre de la tienda es obligatorio');
      return;
    }

    try {
      const updateData: any = {
        name: formData.name.trim()
      };

      // Solo agregar campos que no estén vacíos
      if (formData.address.trim()) {
        updateData.address = formData.address.trim();
      }
      if (formData.phone.trim()) {
        updateData.phone = formData.phone.trim();
      }
      if (formData.email.trim()) {
        updateData.email = formData.email.trim();
      }

      await updateStore(storeId, updateData);

      setEditingStore(null);
      setFormData({ name: '', address: '', phone: '', email: '' });
      alert('Tienda actualizada exitosamente');
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Error al actualizar la tienda');
    }
  };

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la tienda "${storeName}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteStore(storeId);
        alert('Tienda eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting store:', error);
        alert('Error al eliminar la tienda');
      }
    }
  };

  const openEditForm = (store: any) => {
    setEditingStore(store.id);
    setFormData({
      name: store.name,
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || ''
    });
  };

  const getStoreStats = (storeId: string) => {
    // En una implementación real, estos datos vendrían de la base de datos
    // Por ahora, simulamos algunos datos
    const storeEmployees = employees.filter(emp => emp.storeId === storeId);
    const storeShifts = shifts.filter(shift => shift.storeId === storeId);
    
    return {
      employees: storeEmployees.length,
      shifts: storeShifts.length
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🏪 Gestión de Tiendas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido/a, {currentEmployee?.name}. Selecciona una tienda para gestionar o crea una nueva.
          </p>
        </div>

        {/* Dashboard Global */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiendas Activas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Array.isArray(stores) ? stores.length : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Empleados Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{employees.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Turnos Esta Semana</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{shifts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Tiendas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Tiendas Disponibles
              </h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tienda
              </button>
            </div>
          </div>

          <div className="p-6">
            {!Array.isArray(stores) || stores.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No hay tiendas disponibles
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Crea tu primera tienda para comenzar a gestionar horarios.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary flex items-center mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Tienda
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(stores) && stores.map((store) => {
                  const stats = getStoreStats(store.id);
                  return (
                    <div
                      key={store.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {store.name}
                            </h3>
                            {store.address && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {store.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditForm(store)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Editar tienda"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id, store.name)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Eliminar tienda"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {stats.employees}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Empleados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {stats.shifts}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Turnos</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onStoreSelect(store.id)}
                        className="w-full btn-primary"
                      >
                        Entrar a la Tienda
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Crear/Editar Tienda */}
        {(showCreateForm || editingStore) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {editingStore ? 'Editar Tienda' : 'Nueva Tienda'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de la Tienda *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="Ej: Tienda Centro"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="input-field"
                    placeholder="Ej: Calle Principal 123"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-field"
                    placeholder="Ej: +34 123 456 789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input-field"
                    placeholder="Ej: tienda@empresa.com"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingStore(null);
                    setFormData({ name: '', address: '', phone: '', email: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingStore ? () => handleEditStore(editingStore) : handleCreateStore}
                  className="btn-primary"
                >
                  {editingStore ? 'Guardar Cambios' : 'Crear Tienda'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
