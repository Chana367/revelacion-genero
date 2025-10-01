import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CountdownService, CountdownData } from '../services/countdown.service';
import { VotingService } from '../services/voting.service';
import { ConfigurationService } from '../services/configuration.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy, AfterViewInit {
  countdown$: Observable<CountdownData>;
  revealDate: Date | null = null;
  timeIntegrityVerified = false;
  votingEnabled = true;
  deviceHasVoted = false;
  
  // Variables para la revelación
  confettiArray: number[] = [];
  genderClass = '';
  genderEmoji = '';
  genderMessage = '';
  genderSubtitle = '';
  genderColor = '';
  revealStarted = false;
  revealDataReady = false;
  isComponentReady = false;
  
  // Variables para mostrar resultados de votación
  votingStats: any = null;
  
  // Género obtenido desde Firebase
  currentGender: 'niño' | 'niña' = 'niño';
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private countdownService: CountdownService,
    private votingService: VotingService,
    private configService: ConfigurationService
  ) {
    this.countdown$ = this.countdownService.getCountdown();
    this.revealDate = this.countdownService.getRevealDate();
  }

  ngOnInit() {
    // Resetear completamente el estado al inicializar
    this.resetRevealState();
    
    // Suscribirse a cambios de configuración
    this.subscribeToConfigChanges();
    
    // Crear array para confetti animation
    this.confettiArray = Array.from({length: 50}, (_, i) => i);
    // Obtener género desde Firebase (pero no configurar datos de revelación aún)
    this.currentGender = this.countdownService.getGender();
    // Verificar integridad del tiempo al iniciar
    this.verifyTimeIntegrity();
    // Verificar si el dispositivo ya votó
    this.deviceHasVoted = this.votingService.hasDeviceVoted();
    // Suscribirse al countdown para revelar automáticamente
    this.subscribeToCountdown();
    
    // Marcar componente como listo después de que todo esté inicializado
    setTimeout(() => {
      this.isComponentReady = true;
      
      // Verificar inmediatamente si la revelación ya debería estar activa
      this.checkAndRevealIfNeeded();
      
      // Hacer el componente accesible globalmente para debugging
      (window as any).revealApp = this;
      console.log('🎯 Métodos disponibles:');
      console.log('   - revealApp.fullDiagnose() - 🏥 Diagnóstico completo de errores');
      console.log('   - revealApp.showSyncStats() - 📊 Estadísticas de sincronización');
      console.log('   - revealApp.forceSync() - 🔄 Forzar sincronización con servidor');
      console.log('   - revealApp.debugConfig() - 🔍 Ver configuración y tiempos');
      console.log('   - revealApp.fixRevealDate() - 🛠️ Corregir fecha a 1 oct 23:30');
      console.log('   - revealApp.updateRevealDate(días) - 📅 Actualizar fecha');
      console.log('   - revealApp.scrollToReveal() - 🎯 Scroll manual hacia revelación');
      console.log('   - revealApp.scrollToRevealNow() - ⚡ Scroll inmediato (testing)');
    }, 50);
  }

  private subscribeToConfigChanges() {
    const configSub = this.configService.config$.subscribe(config => {
      if (config) {
        this.revealDate = config.revealDate;
        this.currentGender = config.gender;
        console.log('🔄 Configuración actualizada en componente:', {
          revealDate: this.revealDate,
          gender: this.currentGender
        });
        
        // Verificar si la revelación ya debería estar activa después de recibir la configuración
        if (this.isComponentReady) {
          setTimeout(() => this.checkAndRevealIfNeeded(), 100);
        }
      } else {
        console.log('⚠️ Esperando configuración de Firebase...');
        this.revealDate = null;
      }
    });
    this.subscriptions.add(configSub);
  }

  private resetRevealState() {
    this.revealStarted = false;
    this.revealDataReady = false;
    this.isComponentReady = false;
    this.genderClass = '';
    this.genderEmoji = '';
    this.genderMessage = '';
    this.genderSubtitle = '';
    this.genderColor = '';
    this.votingStats = null;
    
    // Asegurar que la fecha se reinicialice correctamente
    this.revealDate = this.countdownService.getRevealDate();
  }

  private subscribeToCountdown() {
    const sub = this.countdown$.subscribe(countdown => {
      // Actualizar estado de votación
      this.votingEnabled = this.votingService.isVotingEnabled();
      
      if (countdown.isEventPassed && !this.revealStarted) {
        // Revelar automáticamente cuando termine el tiempo
        this.revealStarted = true;
        // Pequeño delay para evitar parpadeo
        setTimeout(() => {
          this.setGenderData();
          this.revealDataReady = true;
          this.startConfettiAnimation();
          // Scroll automático hacia la revelación
          this.scrollToRevealation();
        }, 1000);
      } else if (countdown.isEventPassed && this.revealStarted && !this.revealDataReady) {
        // Si ya pasó el evento pero los datos no están listos, configurarlos inmediatamente
        this.setGenderData();
        this.revealDataReady = true;
        this.startConfettiAnimation();
        // Scroll automático hacia la revelación
        this.scrollToRevealation();
      }
    });
    this.subscriptions.add(sub);
  }

  ngAfterViewInit() {
    // Protección adicional después de que la vista esté completamente cargada
    setTimeout(() => {
      if (!this.isComponentReady) {
        this.isComponentReady = true;
      }
    }, 100);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    // Resetear variables para evitar estado persistente
    this.revealStarted = false;
    this.revealDataReady = false;
    this.isComponentReady = false;
    this.genderClass = '';
    this.genderEmoji = '';
    this.genderMessage = '';
    this.genderSubtitle = '';
    this.genderColor = '';
  }

  private verifyTimeIntegrity() {
    const sub = this.countdownService.verifyTimeIntegrity().subscribe(
      isValid => {
        this.timeIntegrityVerified = isValid;
        if (!isValid) {
          console.warn('Posible manipulación de fecha detectada');
        }
      }
    );
    this.subscriptions.add(sub);
  }

  formatDate(date: Date | null): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Cargando fecha desde Firebase...';
    }

    try {
      const dateFormatted = date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
      });
      
      const timeFormatted = date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });
      
      // Capitalizar la primera letra del día de la semana
      const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
      
      // Combinar fecha y hora con "hs" de forma más compacta
      return `${capitalizedDate}, ${timeFormatted}hs`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error al mostrar la fecha';
    }
  }

  private setGenderData() {
    // Obtener estadísticas de votación
    const statsSubscription = this.votingService.getStats().subscribe(stats => {
      this.votingStats = stats;
    });
    this.subscriptions.add(statsSubscription);

    // Actualizar género desde Firebase
    this.currentGender = this.countdownService.getGender();

    if (this.currentGender === 'niña') {
      this.genderClass = 'girl-reveal';
      this.genderEmoji = '👧🏻';
      this.genderMessage = '¡Es una NIÑA!';
      this.genderSubtitle = '💕 Una princesita está en camino 💕';
      this.genderColor = 'tertiary';
    } else {
      this.genderClass = 'boy-reveal';
      this.genderEmoji = '👦🏻';
      this.genderMessage = '¡Es un NIÑO!';
      this.genderSubtitle = '💙 Un pequeño príncipe está en camino 💙';
      this.genderColor = 'primary';
    }
  }

  private startConfettiAnimation() {
    // Animar el confetti (esto se maneja principalmente con CSS)
    setTimeout(() => {
      const confettiElements = document.querySelectorAll('.confetti');
      confettiElements.forEach((confetti, index) => {
        setTimeout(() => {
          confetti.classList.add('animate');
        }, index * 50);
      });
    }, 100);
  }

  shareNews() {
    const shareText = `🎉 ¡Acabamos de revelar que será ${this.currentGender.toUpperCase()}! 🎉`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Revelación de Género',
        text: shareText,
      }).catch(console.error);
    } else {
      // Fallback para navegadores que no soportan Web Share API
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
          alert('¡Texto copiado al portapapeles!');
        });
      } else {
        alert(shareText);
      }
    }
  }

  // Método para actualizar fecha manualmente (útil para desarrollo/testing)
  async updateRevealDate(days: number = 14) {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    newDate.setHours(19, 20, 0, 0);
    
    try {
      await this.configService.updateConfiguration(newDate, this.currentGender);
      this.revealDate = newDate;
      console.log('✅ Fecha actualizada manualmente a:', newDate.toLocaleDateString('es-AR'));
    } catch (error) {
      console.error('❌ Error actualizando fecha manualmente:', error);
    }
  }

  // Método para corregir la fecha específica (1 octubre 23:30)
  async fixRevealDate() {
    try {
      await this.configService.setSpecificRevealDate(2025, 10, 1, 23, 30);
      console.log('✅ Fecha corregida a: 1 de octubre 2025, 23:30');
      // Recargar la fecha
      this.revealDate = this.countdownService.getRevealDate();
    } catch (error) {
      console.error('❌ Error corrigiendo fecha:', error);
    }
  }

  // Método para debug
  debugConfig() {
    console.log('🔍 === DEBUG CONFIGURACIÓN ===');
    this.configService.debugConfiguration();
    console.log('🔍 Fecha actual en componente:', this.revealDate);
    console.log('🔍 Hora actual ajustada:', this.countdownService.getCurrentServerTime());
    console.log('🔍 Hora local:', new Date());
    console.log('🔍 ============================');
  }

  // Método para forzar sincronización
  async forceSync() {
    try {
      await this.countdownService.forceSyncWithServer();
      console.log('✅ Sincronización forzada completada');
    } catch (error) {
      console.error('❌ Error en sincronización forzada:', error);
    }
  }

  // Método para ver estadísticas de sincronización
  showSyncStats() {
    const stats = this.countdownService.getSyncStats();
    console.log('📊 === ESTADÍSTICAS DE SINCRONIZACIÓN ===');
    console.log('   - Offset de tiempo:', stats.timeOffset, 'ms');
    console.log('   - Última sincronización:', Math.round(stats.lastSyncAgo / 1000), 'segundos atrás');
    console.log('   - Próxima sincronización:', Math.round(stats.nextSyncIn / 1000), 'segundos');
    console.log('   - Necesita sincronización:', stats.isSyncNeeded ? '🔴 Sí' : '🟢 No');
    console.log('   - Hora local:', stats.localTime.toLocaleString('es-AR'));
    console.log('   - Hora ajustada:', stats.currentAdjustedTime.toLocaleString('es-AR'));
    console.log('=========================================');
    return stats;
  }

  // Método para diagnóstico completo
  fullDiagnose() {
    console.log('🏥 === DIAGNÓSTICO COMPLETO ===');
    this.countdownService.diagnose();
    this.configService.debugConfiguration();
    console.log('Estado del componente:');
    console.log('   - isComponentReady:', this.isComponentReady);
    console.log('   - revealDataReady:', this.revealDataReady);
    console.log('   - revealStarted:', this.revealStarted);
    console.log('   - genderMessage:', this.genderMessage);
    console.log('   - revealDate:', this.revealDate);
    
    // Diagnóstico específico del scroll
    console.log('Estado del DOM para scroll:');
    const element = document.getElementById('revelation-section');
    console.log('   - Elemento revelation-section:', element ? '✅ Encontrado' : '❌ No encontrado');
    if (element) {
      const rect = element.getBoundingClientRect();
      console.log(`   - Posición: top=${rect.top}, left=${rect.left}`);
      console.log(`   - Tamaño: width=${rect.width}, height=${rect.height}`);
      console.log(`   - Visible: ${rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth}`);
    }
    console.log('==============================');
  }

  /**
   * Verificar si la revelación ya debería estar activa y activarla inmediatamente
   */
  private checkAndRevealIfNeeded() {
    if (!this.revealDate) {
      console.log('⏳ Esperando fecha de revelación...');
      return;
    }

    const now = new Date();
    const isEventPassed = now >= this.revealDate;
    
    console.log('🔍 Verificación inicial de revelación:');
    console.log(`   - Fecha actual: ${now.toISOString()}`);
    console.log(`   - Fecha revelación: ${this.revealDate.toISOString()}`);
    console.log(`   - ¿Ya pasó el evento?: ${isEventPassed}`);
    
    if (isEventPassed && !this.revealStarted) {
      console.log('🚀 Activando revelación inmediatamente...');
      this.revealStarted = true;
      
      setTimeout(() => {
        this.setGenderData();
        this.revealDataReady = true;
        this.startConfettiAnimation();
        // Scroll automático después de que esté lista
        setTimeout(() => this.scrollToRevealation(), 1000);
      }, 500);
    } else if (isEventPassed && this.revealDataReady) {
      // Si ya está todo listo, solo hacer scroll
      setTimeout(() => this.scrollToRevealation(), 1000);
    }
  }

  /**
   * Scroll suave hacia la sección de revelación (público para testing)
   */
  scrollToReveal() {
    this.scrollToRevealation();
  }

  /**
   * Scroll inmediato para testing (sin delays)
   */
  scrollToRevealNow() {
    const element = document.getElementById('revelation-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      console.log('✅ Scroll inmediato ejecutado');
    } else {
      console.error('❌ Elemento revelation-section no encontrado');
      // Mostrar todos los elementos con ID para debugging
      const allElements = document.querySelectorAll('[id]');
      console.log('🔍 Elementos con ID disponibles:', Array.from(allElements).map(el => el.id));
    }
  }

  /**
   * Scroll suave hacia la sección de revelación con verificaciones mejoradas
   */
  private scrollToRevealation() {
    console.log('🎯 Iniciando scroll hacia revelación...');
    
    // Función para intentar el scroll
    const attemptScroll = (attempt: number = 1) => {
      const revelationElement = document.getElementById('revelation-section');
      
      console.log(`🔍 Intento ${attempt} de scroll:`);
      console.log(`   - Elemento encontrado: ${revelationElement ? '✅' : '❌'}`);
      console.log(`   - revealDataReady: ${this.revealDataReady}`);
      console.log(`   - genderMessage: ${this.genderMessage}`);
      console.log(`   - isComponentReady: ${this.isComponentReady}`);
      
      if (revelationElement) {
        try {
          // Método 1: scrollIntoView (más confiable)
          revelationElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
          
          console.log('✅ Scroll realizado con scrollIntoView');
          return true;
        } catch (error) {
          console.warn('⚠️ scrollIntoView falló, intentando window.scrollTo:', error);
          
          try {
            // Método 2: window.scrollTo como fallback
            const elementRect = revelationElement.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            
            window.scrollTo({
              top: Math.max(0, absoluteElementTop - 80),
              behavior: 'smooth'
            });
            
            console.log('✅ Scroll realizado con window.scrollTo');
            return true;
          } catch (error2) {
            console.error('❌ Ambos métodos de scroll fallaron:', error2);
            return false;
          }
        }
      } else {
        console.warn(`⚠️ Elemento no encontrado en intento ${attempt}`);
        
        // Reintentar hasta 5 veces con delay incremental
        if (attempt < 5) {
          setTimeout(() => attemptScroll(attempt + 1), attempt * 500);
        } else {
          console.error('❌ No se pudo encontrar el elemento después de 5 intentos');
        }
        return false;
      }
    };
    
    // Delay inicial y luego intentar scroll
    setTimeout(() => attemptScroll(), 500);
  }
}
