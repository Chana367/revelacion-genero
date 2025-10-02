import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { db } from '../firebase/config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';

export interface AppConfiguration {
  revealDate: Date;
  gender: 'niño' | 'niña';
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private readonly CONFIG_DOC_ID = 'app-settings';
  private readonly DEFAULT_GENDER: 'niño' | 'niña' = 'niño';
  
  private configSubject = new BehaviorSubject<AppConfiguration | null>(null);
  
  public config$ = this.configSubject.asObservable();
  private currentConfig: AppConfiguration | null = null;
  private firebaseInitialized = false;

  constructor() {
    console.log('🔧 ConfigurationService iniciado - esperando datos de Firebase');
    this.initializeFirebaseConfig();
  }  /**
   * Inicializar configuración desde Firebase
   */
  private async initializeFirebaseConfig() {
    try {
      await this.loadConfigFromFirebase();
      this.setupConfigListener();
      this.firebaseInitialized = true;
      console.log('🔥 Configuración de Firebase inicializada');
    } catch (error) {
      console.error('❌ Error inicializando configuración Firebase:', error);
      console.log('⚠️ Usando configuración por defecto');
    }
  }

  /**
   * Cargar configuración desde Firebase
   */
  private async loadConfigFromFirebase() {
    try {
      const configRef = doc(db, 'configuration', this.CONFIG_DOC_ID);
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const data = configSnap.data();
        console.log('📥 Datos raw desde Firebase:', data);
        
        // Validar que los datos requeridos existan
        if (!data['revealDate']) {
          console.error('❌ revealDate no encontrado en Firebase');
          throw new Error('revealDate requerido en configuración de Firebase');
        }
        
        // Debug detallado del timestamp
        const firebaseTimestamp = data['revealDate'];
        const convertedDate = firebaseTimestamp.toDate();
        console.log('🔍 Debug timestamp:');
        console.log('   - Firebase Timestamp:', firebaseTimestamp);
        console.log('   - Timestamp seconds:', firebaseTimestamp.seconds);
        console.log('   - Timestamp nanoseconds:', firebaseTimestamp.nanoseconds);
        console.log('   - Converted Date:', convertedDate);
        console.log('   - Converted Date ISO:', convertedDate.toISOString());
        console.log('   - Converted Date Local:', convertedDate.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }));
        
        this.currentConfig = {
          revealDate: convertedDate,
          gender: data['gender'] || this.DEFAULT_GENDER
        };
        this.configSubject.next(this.currentConfig);
        console.log('✅ Configuración cargada desde Firebase:', this.currentConfig);
      } else {
        console.error('❌ Documento de configuración no encontrado en Firebase');
        console.log('📝 Necesitas crear el documento "app-settings" en la colección "configuration" con:');
        console.log('   - revealDate: Timestamp');
        console.log('   - gender: "niño" | "niña"');
        throw new Error('Configuración de Firebase requerida pero no encontrada');
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      console.error('🚨 La aplicación requiere configuración válida en Firebase');
      // No establecer configuración si Firebase falla
      this.currentConfig = null;
      this.configSubject.next(null);
      throw error;
    }
  }



  /**
   * Configurar listener en tiempo real para la configuración
   */
  private setupConfigListener() {
    const configRef = doc(db, 'configuration', this.CONFIG_DOC_ID);
    
    onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('📥 Datos actualizados desde Firebase (listener):', data);
        
        // Validar que los datos requeridos existan
        if (!data['revealDate']) {
          console.error('❌ revealDate no encontrado en Firebase (listener)');
          return;
        }
        
        // Debug detallado del timestamp en el listener
        const firebaseTimestamp = data['revealDate'];
        const convertedDate = firebaseTimestamp.toDate();
        console.log('🔍 Debug timestamp (listener):');
        console.log('   - Firebase Timestamp:', firebaseTimestamp);
        console.log('   - Converted Date:', convertedDate);
        console.log('   - Converted Date Local:', convertedDate.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }));
        
        this.currentConfig = {
          revealDate: convertedDate,
          gender: data['gender'] || this.DEFAULT_GENDER
        };
        this.configSubject.next(this.currentConfig);
        console.log('🔄 Configuración actualizada desde Firebase:', this.currentConfig);
      } else {
        console.error('❌ Documento de configuración eliminado de Firebase');
        this.currentConfig = null;
        this.configSubject.next(null);
      }
    }, (error) => {
      console.error('❌ Error en listener de configuración:', error);
      this.currentConfig = null;
      this.configSubject.next(null);
    });
  }

  /**
   * Actualizar configuración en Firebase
   */
  async updateConfiguration(revealDate: Date, gender: 'niño' | 'niña'): Promise<void> {
    try {
      const configRef = doc(db, 'configuration', this.CONFIG_DOC_ID);
      await setDoc(configRef, {
        revealDate: Timestamp.fromDate(revealDate),
        gender: gender,
        lastUpdated: Timestamp.fromDate(new Date())
      });
      console.log('✅ Configuración actualizada en Firebase');
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      throw error;
    }
  }

  /**
   * Obtener fecha de revelación actual
   */
  getRevealDate(): Date | null {
    return this.currentConfig?.revealDate || null;
  }

  /**
   * Obtener género configurado
   */
  getGender(): 'niño' | 'niña' {
    return this.currentConfig?.gender || this.DEFAULT_GENDER;
  }

  /**
   * Verificar si la configuración está cargada
   */
  isConfigurationLoaded(): boolean {
    return this.currentConfig !== null;
  }

  /**
   * Método para debug - verificar configuración actual
   */
  debugConfiguration() {
    console.log('🔍 DEBUG - Configuración actual:');
    if (this.currentConfig) {
      console.log('   - Configuración cargada: ✅');
      console.log('   - Fecha de revelación:', this.currentConfig.revealDate);
      console.log('   - Fecha ISO:', this.currentConfig.revealDate.toISOString());
      console.log('   - Fecha local (AR):', this.currentConfig.revealDate.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }));
      console.log('   - Género:', this.currentConfig.gender);
    } else {
      console.log('   - Configuración cargada: ❌');
      console.log('   - Estado: Esperando datos de Firebase');
    }
    console.log('   - Timestamp actual:', new Date().toISOString());
    return this.currentConfig;
  }

  /**
   * Actualizar fecha específica (útil para corregir problemas)
   */
  async setSpecificRevealDate(year: number, month: number, day: number, hour: number, minute: number): Promise<void> {
    // Crear fecha en timezone de Argentina
    const revealDate = new Date();
    revealDate.setFullYear(year, month - 1, day); // month es 0-indexed
    revealDate.setHours(hour, minute, 0, 0);
    
    console.log('🕐 Configurando fecha específica:');
    console.log('   - Fecha creada:', revealDate);
    console.log('   - Fecha ISO:', revealDate.toISOString());
    console.log('   - Fecha local (AR):', revealDate.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }));
    
    try {
      const currentGender = this.currentConfig?.gender || this.DEFAULT_GENDER;
      await this.updateConfiguration(revealDate, currentGender);
      console.log('✅ Fecha específica actualizada correctamente');
    } catch (error) {
      console.error('❌ Error actualizando fecha específica:', error);
      throw error;
    }
  }

  /**
   * Verificar si Firebase está inicializado
   */
  isFirebaseInitialized(): boolean {
    return this.firebaseInitialized;
  }

  /**
   * Obtener configuración actual completa
   */
  getCurrentConfig(): AppConfiguration {
    return this.currentConfig;
  }

  /**
   * Método para recargar manualmente la configuración desde Firebase
   */
  async reloadConfiguration() {
    console.log('🔄 Recargando configuración desde Firebase...');
    await this.loadConfigFromFirebase();
  }
}