import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CountdownService, CountdownData } from '../services/countdown.service';
import { VotingService } from '../services/voting.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  countdown$: Observable<CountdownData>;
  revealDate: Date;
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
  
  // Variables para mostrar resultados de votación
  votingStats: any = null;
  
  // Género obtenido desde Firebase
  currentGender: 'niño' | 'niña' = 'niño';
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private countdownService: CountdownService,
    private votingService: VotingService
  ) {
    this.countdown$ = this.countdownService.getCountdown();
    this.revealDate = this.countdownService.getRevealDate();
  }

  ngOnInit() {
    // Crear array para confetti animation
    this.confettiArray = Array.from({length: 50}, (_, i) => i);
    // Obtener género desde Firebase
    this.currentGender = this.countdownService.getGender();
    // Verificar integridad del tiempo al iniciar
    this.verifyTimeIntegrity();
    // Verificar si el dispositivo ya votó
    this.deviceHasVoted = this.votingService.hasDeviceVoted();
    // Suscribirse al countdown para revelar automáticamente
    this.subscribeToCountdown();
  }

  private subscribeToCountdown() {
    const sub = this.countdown$.subscribe(countdown => {
      // Actualizar estado de votación
      this.votingEnabled = this.votingService.isVotingEnabled();
      
      if (countdown.isEventPassed && !this.revealStarted) {
        // Revelar automáticamente cuando termine el tiempo
        this.revealStarted = true;
        setTimeout(() => {
          this.setGenderData();
          this.startConfettiAnimation();
        }, 1000);
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
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

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
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
}
