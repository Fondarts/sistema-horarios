/**
 * Servicio para almacenamiento local de archivos
 * Almacena archivos en localStorage del navegador como base64
 */

export class LocalFileStorage {
  private static readonly STORAGE_PREFIX = 'absence_files_';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

  /**
   * Guarda un archivo en localStorage
   * @param file - Archivo a guardar
   * @param absenceId - ID de la ausencia
   * @param employeeId - ID del empleado
   * @returns ID único del archivo guardado
   */
  static async saveFile(file: File, absenceId: string, employeeId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validar archivo
      if (file.size > this.MAX_FILE_SIZE) {
        reject(new Error(`El archivo es demasiado grande. Máximo ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`));
        return;
      }

      if (!this.ALLOWED_TYPES.includes(file.type)) {
        reject(new Error('Tipo de archivo no permitido. Solo se permiten: PDF, JPG, PNG'));
        return;
      }

      // Convertir a base64
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileId = `${employeeId}_${absenceId}_${Date.now()}`;
          const fileData = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result as string,
            uploadedAt: new Date().toISOString(),
            employeeId,
            absenceId
          };

          // Guardar en localStorage
          localStorage.setItem(`${this.STORAGE_PREFIX}${fileId}`, JSON.stringify(fileData));
          
          resolve(fileId);
        } catch (error) {
          reject(new Error('Error al guardar el archivo'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Obtiene un archivo guardado
   * @param fileId - ID del archivo
   * @returns Datos del archivo o null si no existe
   */
  static getFile(fileId: string): FileData | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${fileId}`);
      if (!stored) return null;

      return JSON.parse(stored) as FileData;
    } catch (error) {
      console.error('Error al obtener archivo:', error);
      return null;
    }
  }

  /**
   * Elimina un archivo
   * @param fileId - ID del archivo
   */
  static deleteFile(fileId: string): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}${fileId}`);
  }

  /**
   * Obtiene todos los archivos de un empleado
   * @param employeeId - ID del empleado
   * @returns Lista de archivos
   */
  static getEmployeeFiles(employeeId: string): FileData[] {
    const files: FileData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const fileData = JSON.parse(localStorage.getItem(key) || '{}') as FileData;
          if (fileData.employeeId === employeeId) {
            files.push(fileData);
          }
        } catch (error) {
          console.error('Error al parsear archivo:', error);
        }
      }
    }
    
    return files;
  }

  /**
   * Obtiene el tamaño total de archivos almacenados
   * @returns Tamaño en bytes
   */
  static getTotalStorageSize(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const fileData = JSON.parse(localStorage.getItem(key) || '{}') as FileData;
          totalSize += fileData.size || 0;
        } catch (error) {
          console.error('Error al calcular tamaño:', error);
        }
      }
    }
    
    return totalSize;
  }

  /**
   * Limpia archivos antiguos (más de 30 días)
   */
  static cleanupOldFiles(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const fileData = JSON.parse(localStorage.getItem(key) || '{}') as FileData;
          const uploadedDate = new Date(fileData.uploadedAt);
          
          if (uploadedDate < thirtyDaysAgo) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Error al limpiar archivo:', error);
        }
      }
    }
  }
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64
  uploadedAt: string;
  employeeId: string;
  absenceId: string;
}
