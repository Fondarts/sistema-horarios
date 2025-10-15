import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { FILE_UPLOAD_CONFIG } from '../types/absence';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onFileUpload: (file: File) => Promise<string>; // Retorna URL del archivo
  currentFile?: string; // URL del archivo actual
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

interface UploadState {
  isUploading: boolean;
  error: string | null;
  success: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileUpload,
  currentFile,
  disabled = false,
  required = false,
  label = "Subir archivo"
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    error: null,
    success: false
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
      return `El archivo es demasiado grande. Máximo ${FILE_UPLOAD_CONFIG.maxSize / (1024 * 1024)}MB`;
    }

    // Validar tipo
    if (!FILE_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Solo se permiten: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({
        isUploading: false,
        error: validationError,
        success: false
      });
      onFileSelect(null);
      return;
    }

    setUploadState({
      isUploading: true,
      error: null,
      success: false
    });

    try {
      // Simular subida (el archivo se guardará en el contexto)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadState({
        isUploading: false,
        error: null,
        success: true
      });
      onFileSelect(file);
    } catch (error) {
      setUploadState({
        isUploading: false,
        error: error instanceof Error ? error.message : 'Error al procesar el archivo',
        success: false
      });
      onFileSelect(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    setUploadState({
      isUploading: false,
      error: null,
      success: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <Image className="w-8 h-8 text-blue-500" />;
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Archivo';
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Zona de drop */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={FILE_UPLOAD_CONFIG.allowedExtensions.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        {uploadState.isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-sm text-gray-600">Subiendo archivo...</p>
          </div>
        ) : currentFile ? (
          <div className="flex flex-col items-center">
            {getFileIcon(getFileName(currentFile))}
            <p className="text-sm text-gray-600 mt-2">{getFileName(currentFile)}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="mt-2 text-red-500 hover:text-red-700"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Arrastra un archivo aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')} (máx. {FILE_UPLOAD_CONFIG.maxSize / (1024 * 1024)}MB)
            </p>
          </div>
        )}
      </div>

      {/* Estados de error y éxito */}
      {uploadState.error && (
        <div className="mt-2 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          {uploadState.error}
        </div>
      )}

      {uploadState.success && (
        <div className="mt-2 flex items-center text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          Archivo subido correctamente
        </div>
      )}
    </div>
  );
};
