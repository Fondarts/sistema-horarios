import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export class FileUploadService {
  /**
   * Sube un archivo a Firebase Storage
   * @param file - Archivo a subir
   * @param path - Ruta donde guardar el archivo (ej: 'absence-certificates/employeeId/filename')
   * @returns URL de descarga del archivo
   */
  static async uploadFile(file: File, path: string): Promise<string> {
    try {
      // Crear referencia al archivo
      const fileRef = ref(storage, path);
      
      // Subir el archivo
      const snapshot = await uploadBytes(fileRef, file);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Error al subir el archivo');
    }
  }

  /**
   * Elimina un archivo de Firebase Storage
   * @param url - URL del archivo a eliminar
   */
  static async deleteFile(url: string): Promise<void> {
    try {
      // Crear referencia al archivo desde la URL
      const fileRef = ref(storage, url);
      
      // Eliminar el archivo
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Error al eliminar el archivo');
    }
  }

  /**
   * Genera un nombre único para el archivo
   * @param originalName - Nombre original del archivo
   * @param employeeId - ID del empleado
   * @param absenceId - ID de la ausencia
   * @returns Nombre único del archivo
   */
  static generateFileName(originalName: string, employeeId: string, absenceId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    return `absence-${absenceId}-${employeeId}-${timestamp}.${extension}`;
  }

  /**
   * Genera la ruta completa para el archivo
   * @param fileName - Nombre del archivo
   * @param employeeId - ID del empleado
   * @returns Ruta completa
   */
  static generateFilePath(fileName: string, employeeId: string): string {
    return `absence-certificates/${employeeId}/${fileName}`;
  }
}
