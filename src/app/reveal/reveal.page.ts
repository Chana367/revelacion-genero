import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CountdownService, CountdownData } from '../services/countdown.service';
import { VotingService } from '../services/voting.service';

interface CalendarDay {
  number: number;
  completed: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-reveal',
  templateUrl: './reveal.page.html',
  styleUrls: ['./reveal.page.scss'],
})
export class RevealPage implements OnInit {
  revealed = false;
  confettiArray: number[] = [];
  genderClass = '';
  genderEmoji = '';
  genderMessage = '';
  genderSubtitle = '';
  genderColor = '';
  countdown$: Observable<CountdownData>;
  calendarDays: CalendarDay[] = [];
  votingStats: any = null;
  
  // Configuración del género (puedes cambiar esto)
  readonly GENDER: 'niño' | 'niña' = 'niño'; // Cambiar a 'niño' o 'niña'
  private revealDate: Date;
  private startDate: Date;  

  constructor(
    private countdownService: CountdownService,
    private votingService: VotingService
  ) { 
    this.countdown$ = this.countdownService.getCountdown();
    this.revealDate = this.countdownService.getRevealDate();
    // Calcular fecha de inicio (30 días antes de la revelación para el calendario)
    this.startDate = new Date(this.revealDate.getTime() - (30 * 24 * 60 * 60 * 1000));
  }

  ngOnInit() {
    // Crear array para confetti animation
    this.confettiArray = Array.from({length: 50}, (_, i) => i);
    // Generar días del calendario
    this.generateCalendarDays();
    // Verificar si ya es momento de revelar
    this.checkIfRevealTime();
    // Suscribirse al countdown para revelar automáticamente
    this.subscribeToCountdown();
  }

  private subscribeToCountdown() {
    this.countdown$.subscribe(countdown => {
      if (countdown.isEventPassed && !this.revealed) {
        // Revelar automáticamente cuando termine el tiempo
        setTimeout(() => {
          this.revealed = true;
          this.setGenderData();
          this.startConfettiAnimation();
        }, 1000);
      }
    });
  }

  private generateCalendarDays() {
    const today = new Date();
    const totalDays = 30; // 30 días de calendario
    
    for (let i = 1; i <= totalDays; i++) {
      const dayDate = new Date(this.startDate.getTime() + ((i - 1) * 24 * 60 * 60 * 1000));
      const isToday = dayDate.toDateString() === today.toDateString();
      const completed = dayDate < today;
      
      this.calendarDays.push({
        number: i,
        completed,
        isToday
      });
    }
  }

  private checkIfRevealTime() {
    // Este método verifica inicialmente si ya es momento de revelar
    // La revelación automática se maneja en subscribeToCountdown()
    const now = new Date();
    if (now >= this.revealDate) {
      this.revealed = true;
      this.setGenderData();
      this.startConfettiAnimation();
    }
  }

  getProgressPercentage(): number {
    const now = new Date();
    const totalTime = this.revealDate.getTime() - this.startDate.getTime();
    const elapsed = now.getTime() - this.startDate.getTime();
    const percentage = Math.min((elapsed / totalTime) * 100, 100);
    return Math.max(percentage, 0);
  }

  private setGenderData() {
    // Obtener estadísticas de votación
    this.votingService.getStats().subscribe(stats => {
      this.votingStats = stats;
    });

    if (this.GENDER === 'niña') {
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
    const confettiElements = document.querySelectorAll('.confetti');
    confettiElements.forEach((confetti, index) => {
      setTimeout(() => {
        confetti.classList.add('animate');
      }, index * 50);
    });
  }

  shareNews() {
    const shareText = `🎉 ¡Acabamos de revelar que será ${this.GENDER.toUpperCase()}! 🎉`;
    
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
