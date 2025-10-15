import React, { useState, useEffect } from 'react';
import { LocalFileStorage, FileData } from '../services/localFileStorage';
import { Trash2, Download, FileText, Image, AlertTriangle } from 'lucide-react';

export const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    // Obtener todos los archivos (esto es una aproximación)
    const allFiles: FileData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('absence_files_')) {
        try {
          const fileData = JSON.parse(localStorage.getItem(key) || '{}') as FileData;
          if (fileData.id) {
            allFiles.push(fileData);
          }
        } catch (error) {
          console.error('Error al cargar archivo:', error);
        }
      }
    }
    
    setFiles(allFiles);
    setTotalSize(LocalFileStorage.getTotalStorageSize());
  };

  const deleteFile = (fileId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      LocalFileStorage.deleteFile(fileId);
      loadFiles();
    }
  };

  const downloadFile = (fileData: FileData) => {
    const link = document.createElement('a');
    link.href = fileData.data;
    link.download = fileData.name;
    link.click();
  };

  const cleanupOldFiles = () => {
    if (confirm('¿Eliminar archivos antiguos (más de 30 días)?')) {
      LocalFileStorage.cleanupOldFiles();
      loadFiles();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <Image className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Gestión de Archivos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total: {files.length} archivos • {formatFileSize(totalSize)}
          </p>
        </div>
        <button
          onClick={cleanupOldFiles}
          className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Limpiar Archivos Antiguos
        </button>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay archivos almacenados
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Archivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(file.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            {file.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {file.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                      {file.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                      {new Date(file.uploadedAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadFile(file)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Almacenamiento Local
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Los archivos se almacenan en el navegador. Se eliminarán si limpias el almacenamiento local.
              Para producción, considera usar un servicio de almacenamiento en la nube.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
