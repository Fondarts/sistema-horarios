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
      
      console.log('Iniciando subida de archivo:', { path, size: file.size, type: file.type });
      
      // Subir el archivo con metadata
      const metadata = {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      };
      
      const snapshot = await uploadBytes(fileRef, file, metadata);
      console.log('Archivo subido exitosamente:', snapshot.metadata.fullPath);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('URL de descarga obtenida:', downloadURL);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        serverResponse: error?.serverResponse
      });
      
      // Re-lanzar el error con más información
      if (error?.code === 'storage/unauthorized') {
        throw new Error('No tienes permisos para subir archivos. Verifica tu autenticación.');
      } else if (error?.code === 'storage/canceled') {
        throw new Error('La subida fue cancelada.');
      } else if (error?.code === 'storage/unknown') {
        throw new Error('Error desconocido al subir el archivo. Verifica tu conexión.');
      }
      
      throw error;
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
