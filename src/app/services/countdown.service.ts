import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map, startWith, catchError, switchMap, filter, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ConfigurationService, AppConfiguration } from './configuration.service';

export interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEventPassed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CountdownService {
  // URL para obtener tiempo del servidor (World Time API para Buenos Aires)
  private readonly TIME_API_URL = 'https://worldtimeapi.org/api/timezone/America/Argentina/Buenos_Aires';
  
  // Cache para la diferencia entre hora del servidor y hora local
  private timeOffset: number = 0;
  private lastServerSync: number = 0;
  private readonly SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutos
  private readonly MAX_TIME_DIFF_THRESHOLD = 5 * 60 * 1000; // 5 minutos
  
  // Control de seguridad: solo permite revelación después de sincronización exitosa
  private hasValidServerSync: boolean = false;

  constructor(
    private http: HttpClient,
    private configService: ConfigurationService
  ) { 
    // CRÍTICO: Sincronizar con servidor al inicializar (BLOQUEAR hasta completar)
    console.log('🔐 INICIANDO SINCRONIZACIÓN CRÍTICA DE SEGURIDAD...');
    this.syncWithServer().then(() => {
      console.log('✅ Sincronización de seguridad completada');
    }).catch(error => {
      console.error('❌ FALLO CRÍTICO: No se pudo sincronizar con servidor:', error);
      console.warn('⚠️ SEGURIDAD COMPROMETIDA: Usando modo de solo lectura');
    });
  }

  /**
   * Sincroniza con el servidor para obtener la diferencia de tiempo
   */
  private syncWithServer(): Promise<void> {
    return new Promise((resolve) => {
      const localTimeBeforeRequest = Date.now();
      
      this.http.get<any>(this.TIME_API_URL).pipe(
        take(1),
        catchError((error) => {
          console.error('❌ FALLO CRÍTICO DE SEGURIDAD: No se pudo sincronizar con servidor:', error);
          console.warn('⚠️ MODO INSEGURO: Usando hora local (vulnerable a manipulación)');
          this.timeOffset = 0;
          this.lastServerSync = Date.now();
          this.hasValidServerSync = false; // CRÍTICO: Sin sincronización válida
          resolve();
          return of(null);
        })
      ).subscribe(response => {
        if (response && response.datetime) {
          try {
            const localTimeAfterRequest = Date.now();
            const networkDelay = (localTimeAfterRequest - localTimeBeforeRequest) / 2;
            
            const serverTime = new Date(response.datetime).getTime();
            
            // Validar que el tiempo del servidor sea válido
            if (isNaN(serverTime)) {
              console.error('❌ Tiempo del servidor inválido:', response.datetime);
              this.timeOffset = 0;
              this.lastServerSync = Date.now();
              resolve();
              return;
            }
            
            const adjustedLocalTime = localTimeBeforeRequest + networkDelay;
            this.timeOffset = serverTime - adjustedLocalTime;
            this.lastServerSync = Date.now();
            this.hasValidServerSync = true; // CRÍTICO: Marcar sincronización exitosa
            
            console.log('🌐 Sincronización con servidor completada:');
            console.log(`   - Diferencia de tiempo: ${this.timeOffset}ms`);
            console.log(`   - Delay de red: ${networkDelay}ms`);
            console.log(`   - Hora servidor: ${new Date(serverTime).toISOString()}`);
            console.log(`   - Hora local ajustada: ${new Date(adjustedLocalTime).toISOString()}`);
            console.log('🔐 SEGURIDAD: Sincronización válida establecida');
            
            // Verificar si hay una diferencia significativa
            if (Math.abs(this.timeOffset) > this.MAX_TIME_DIFF_THRESHOLD) {
              console.warn('⚠️ Diferencia de tiempo significativa detectada:', Math.abs(this.timeOffset) / 1000, 'segundos');
            }
          } catch (error) {
            console.error('❌ Error procesando respuesta del servidor:', error);
            this.timeOffset = 0;
            this.lastServerSync = Date.now();
          }
        }
        resolve();
      });
    });
  }

  /**
   * Obtiene la hora actual ajustada con el offset del servidor
   */
  private getCurrentTime(): Date {
    try {
      const now = Date.now();
      
      // Re-sincronizar si ha pasado mucho tiempo (sin bloquear)
      if (now - this.lastServerSync > this.SYNC_INTERVAL) {
        console.log('🔄 Iniciando re-sincronización automática...');
        this.syncWithServer().catch(error => {
          console.warn('⚠️ Re-sincronización fallida:', error);
        });
      }
      
      const adjustedTime = new Date(now + this.timeOffset);
      
      // Validar que la fecha resultante sea válida
      if (isNaN(adjustedTime.getTime())) {
        console.error('❌ Fecha ajustada inválida, usando hora local');
        return new Date();
      }
      
      return adjustedTime;
    } catch (error) {
      console.error('❌ Error en getCurrentTime, usando hora local:', error);
      return new Date();
    }
  }

  /**
   * Calcula el tiempo restante hasta la fecha de revelación con verificación de seguridad
   */
  getCountdown(): Observable<CountdownData> {
    return this.configService.config$.pipe(
      filter((config): config is AppConfiguration => config !== null), // Solo proceder si hay configuración válida
      switchMap(config => 
        interval(1000).pipe(
          startWith(0),
          map(() => {
            const currentTime = this.getCurrentTime();
            const timeDiff = config.revealDate.getTime() - currentTime.getTime();

            // SEGURIDAD CRÍTICA: Solo permitir revelación si hay sincronización válida del servidor
            if (timeDiff <= 0 && this.hasValidServerSync) {
              console.log('🔐 REVELACIÓN AUTORIZADA: Tiempo pasado con sincronización válida del servidor');
              return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isEventPassed: true
              };
            } else if (timeDiff <= 0 && !this.hasValidServerSync) {
              console.warn('🚨 BLOQUEO DE SEGURIDAD: Tiempo pasado pero sin sincronización válida del servidor');
              console.warn('⚠️ Posible manipulación de tiempo local detectada');
              // Mostrar 1 segundo restante para evitar revelación prematura
              return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 1,
                isEventPassed: false
              };
            }

            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            return {
              days,
              hours,
              minutes,
              seconds,
              isEventPassed: false
            };
          })
        )
      )
    );
  }

  /**
   * Obtiene la fecha de revelación desde Firebase
   */
  getRevealDate(): Date | null {
    return this.configService.getRevealDate();
  }

  /**
   * Obtiene el género configurado desde Firebase
   */
  getGender(): 'niño' | 'niña' {
    return this.configService.getGender();
  }

  /**
   * Verifica si hay sincronización válida con el servidor (para seguridad)
   */
  hasValidSync(): boolean {
    return this.hasValidServerSync;
  }

  /**
   * Verifica la integridad de la fecha usando el offset calculado
   */
  verifyTimeIntegrity(): Observable<boolean> {
    return of(true).pipe(
      map(() => {
        const currentTime = this.getCurrentTime();
        const localTime = new Date();
        const timeDifference = Math.abs(currentTime.getTime() - localTime.getTime());
        
        // Si la diferencia es muy grande, posible manipulación
        const isIntegrityValid = timeDifference < this.MAX_TIME_DIFF_THRESHOLD;
        
        if (!isIntegrityValid) {
          console.warn('⚠️ Posible manipulación de fecha detectada:', {
            diferencia: timeDifference / 1000,
            horaLocal: localTime.toISOString(),
            horaAjustada: currentTime.toISOString()
          });
        }
        
        return isIntegrityValid;
      })
    );
  }

  /**
   * Obtiene la hora actual ajustada (método público para otros servicios)
   */
  getCurrentServerTime(): Date {
    return this.getCurrentTime();
  }

  /**
   * Fuerza una nueva sincronización con el servidor
   */
  async forceSyncWithServer(): Promise<void> {
    console.log('🔄 Forzando sincronización con servidor...');
    await this.syncWithServer();
  }

  /**
   * Obtiene estadísticas de sincronización
   */
  getSyncStats() {
    const now = Date.now();
    const timeSinceLastSync = now - this.lastServerSync;
    
    return {
      timeOffset: this.timeOffset,
      lastSyncAgo: timeSinceLastSync,
      nextSyncIn: Math.max(0, this.SYNC_INTERVAL - timeSinceLastSync),
      isSyncNeeded: timeSinceLastSync > this.SYNC_INTERVAL,
      currentAdjustedTime: this.getCurrentTime(),
      localTime: new Date(),
      isWorking: this.lastServerSync > 0,
      hasValidOffset: !isNaN(this.timeOffset)
    };
  }

  /**
   * Diagnóstico completo del servicio
   */
  diagnose() {
    console.log('🔍 === DIAGNÓSTICO COUNTDOWN SERVICE ===');
    const stats = this.getSyncStats();
    
    console.log('Estado de sincronización:');
    console.log(`   - Funcionando: ${stats.isWorking ? '✅' : '❌'}`);
    console.log(`   - Offset válido: ${stats.hasValidOffset ? '✅' : '❌'}`);
    console.log(`   - Última sync: ${Math.round(stats.lastSyncAgo / 1000)}s atrás`);
    console.log(`   - Offset: ${stats.timeOffset}ms`);
    
    console.log('Tiempos:');
    console.log(`   - Local: ${stats.localTime.toISOString()}`);
    console.log(`   - Ajustado: ${stats.currentAdjustedTime.toISOString()}`);
    
    // Verificar configuración
    const config = this.configService.isConfigurationLoaded();
    console.log(`Configuration loaded: ${config ? '✅' : '❌'}`);
    
    if (config) {
      const revealDate = this.getRevealDate();
      console.log(`   - Fecha revelación: ${revealDate?.toISOString() || 'null'}`);
    }
    
    console.log('=====================================');
    return stats;
  }
}
