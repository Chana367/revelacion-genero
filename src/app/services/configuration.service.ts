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
  private readonly DEFAULT_REVEAL_DATE = new Date('2025-09-25T19:20:00-03:00');
  private readonly DEFAULT_GENDER: 'niño' | 'niña' = 'niño';
  
  private configSubject = new BehaviorSubject<AppConfiguration>({
    revealDate: this.DEFAULT_REVEAL_DATE,
    gender: this.DEFAULT_GENDER
  });
  
  public config$ = this.configSubject.asObservable();
  private currentConfig: AppConfiguration;
  private firebaseInitialized = false;

  constructor() {
    this.currentConfig = this.configSubject.value;
    console.log('🔧 ConfigurationService iniciado con:', this.currentConfig);
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
        this.currentConfig = {
          revealDate: data['revealDate']?.toDate() || this.DEFAULT_REVEAL_DATE,
          gender: data['gender'] || this.DEFAULT_GENDER
        };
        this.configSubject.next(this.currentConfig);
        console.log('✅ Configuración cargada desde Firebase:', this.currentConfig);
      } else {
        console.warn('⚠️ Documento de configuración no encontrado en Firebase');
        console.log('📝 Por favor, crea manualmente el documento "app-settings" en la colección "configuration"');
        // Usar configuración por defecto
        this.currentConfig = {
          revealDate: this.DEFAULT_REVEAL_DATE,
          gender: this.DEFAULT_GENDER
        };
        this.configSubject.next(this.currentConfig);
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      console.warn('⚠️ Usando configuración por defecto');
      // Usar configuración por defecto si Firebase falla
      this.currentConfig = {
        revealDate: this.DEFAULT_REVEAL_DATE,
        gender: this.DEFAULT_GENDER
      };
      this.configSubject.next(this.currentConfig);
    }
  }

  /**
   * Crear configuración inicial en Firebase
   */
  private async createInitialConfig() {
    try {
      const configRef = doc(db, 'configuration', this.CONFIG_DOC_ID);
      await setDoc(configRef, {
        revealDate: Timestamp.fromDate(this.DEFAULT_REVEAL_DATE),
        gender: this.DEFAULT_GENDER,
        lastUpdated: Timestamp.fromDate(new Date())
      });
      console.log('🆕 Configuración inicial creada en Firebase');
    } catch (error) {
      console.error('❌ Error creando configuración inicial:', error);
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
        console.log('📥 Datos actualizados desde Firebase:', data);
        this.currentConfig = {
          revealDate: data['revealDate']?.toDate() || this.DEFAULT_REVEAL_DATE,
          gender: data['gender'] || this.DEFAULT_GENDER
        };
        this.configSubject.next(this.currentConfig);
        console.log('🔄 Configuración actualizada desde Firebase:', this.currentConfig);
      }
    }, (error) => {
      console.error('❌ Error en listener de configuración:', error);
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
  getRevealDate(): Date {
    return this.currentConfig.revealDate;
  }

  /**
   * Obtener género configurado
   */
  getGender(): 'niño' | 'niña' {
    return this.currentConfig.gender;
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