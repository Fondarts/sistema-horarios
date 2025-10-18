import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, BarChart3, Users, Calendar, LogOut, Settings } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { ThemeToggle } from './ThemeToggle';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { NotificationCenter } from './NotificationCenter';
import { Logo } from './Logo';
import { TestDataGenerator } from './TestDataGenerator';
import { ConfigurationModal } from './ConfigurationModal';
import { useLanguage } from '../contexts/LanguageContext';

interface StoreSelectorProps {
  onStoreSelect: (storeId: string) => void;
}

export function StoreSelector({ onStoreSelect }: StoreSelectorProps) {
  const { stores, createStore, updateStore, deleteStore } = useStore();
  const { currentEmployee, logout } = useAuth();
  const { getAllEmployees, getEmployeesByStore } = useEmployees();
  const { getAllShifts, getShiftsByStore } = useSchedule();
  const { isMobile } = useCompactMode();
  const { t } = useLanguage();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [showTestDataGenerator, setShowTestDataGenerator] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const handleCreateStore = async () => {
    if (!formData.name.trim()) {
      alert(t('storeNameRequired'));
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
      alert(t('storeNameRequired'));
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
    if (window.confirm(t('confirmDeleteStore').replace('{storeName}', storeName))) {
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
    const storeEmployees = getEmployeesByStore(storeId);
    const storeShifts = getShiftsByStore(storeId);
    
    return {
      employees: storeEmployees.length,
      shifts: storeShifts.length
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Solo mostrar logo y título en desktop */}
              {!isMobile ? (
                <>
                  <Logo />
                  <div className="ml-4">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      🏪 {t('storeManagement')}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('welcomeSelectStore').replace('{name}', currentEmployee?.name || '')}
                    </p>
                  </div>
                </>
              ) : (
                /* En móvil solo mostrar saludo */
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    🏪 {t('storeManagement')}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('welcome')}, {currentEmployee?.name}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter 
                employees={getAllEmployees()}
                currentEmployee={currentEmployee}
                isManager={true}
              />
              
              {/* Solo mostrar en desktop */}
              {!isMobile && (
                <>
                  <KeyboardShortcuts 
                    isManager={true}
                  />
                  <button
                    onClick={() => setShowConfig(true)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100"
                    title={t('configuration')}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <ThemeToggle />
                </>
              )}
              
              {/* Botón de cerrar sesión - solo visible en desktop */}
              {!isMobile && (
                <button
                  onClick={logout}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">

        {/* Dashboard Global */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('activeStores')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Array.isArray(stores) ? stores.length : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('totalEmployees')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getAllEmployees().length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('totalShifts')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getAllShifts().length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Tiendas */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('storeList')}
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTestDataGenerator(true)}
                  className="btn-secondary flex items-center"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {t('generateTestData')}
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createStore')}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!Array.isArray(stores) || stores.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('noStoresYet')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('createFirstStore')}
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary flex items-center mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createStore')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(stores) && stores.map((store) => {
                  const stats = getStoreStats(store.id);
                  return (
                    <div
                      key={store.id}
                      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow"
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
                            title={t('editStore')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id, store.name)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title={t('deleteStore')}
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
                          <p className="text-xs text-gray-600 dark:text-gray-400">{t('employees')}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {stats.shifts}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{t('shifts')}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onStoreSelect(store.id)}
                        className="w-full btn-primary"
                      >
                        {t('manageStore')}
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
            <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {editingStore ? t('editStoreTitle') : t('createStoreTitle')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('storeName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder={t('storeNamePlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('storeAddress')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="input-field"
                    placeholder={t('storeAddressPlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('storePhone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-field"
                    placeholder={t('storePhonePlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('storeEmail')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input-field"
                    placeholder={t('storeEmailPlaceholder')}
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
                  {t('cancel')}
                </button>
                <button
                  onClick={editingStore ? () => handleEditStore(editingStore) : handleCreateStore}
                  className="btn-primary"
                >
                  {editingStore ? t('save') : t('createStore')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Generador de Datos de Prueba */}
        {showTestDataGenerator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Generador de Datos de Prueba
                </h3>
                <button
                  onClick={() => setShowTestDataGenerator(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TestDataGenerator />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Configuración */}
      <ConfigurationModal 
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </div>
  );
}
