import { Component, OnInit, OnDestroy } from '@angular/core';
import { VotingService, Vote, VotingStats } from '../services/voting.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.page.html',
  styleUrls: ['./voting.page.scss'],
})
export class VotingPage implements OnInit, OnDestroy {
  voterName = '';
  selectedPrediction: 'niño' | 'niña' | null = null;
  stats$: Observable<VotingStats>;
  recentVotes: Vote[] = [];
  hasVoted = false;
  isSubmitting = false;
  showThankYou = false;
  votingEnabled = true;
  minutesRemaining = 0;
  deviceHasVoted = false;

  private subscription = new Subscription();

  constructor(private votingService: VotingService) {
    this.stats$ = this.votingService.getStats();
  }

  ngOnInit() {
    // Verificar estado de votación
    this.checkVotingStatus();
    
    // Verificar si este dispositivo ya votó
    this.deviceHasVoted = this.votingService.hasDeviceVoted();
    
    // Suscribirse a los votos para actualizar la lista reciente
    const votesSubscription = this.votingService.getVotes().subscribe(votes => {
      this.recentVotes = this.votingService.getRecentVotes(10);
    });
    this.subscription.add(votesSubscription);

    // Actualizar estado cada 30 segundos
    const statusInterval = setInterval(() => {
      this.checkVotingStatus();
    }, 30000);
    
    // Limpiar interval cuando se destruya el componente
    this.subscription.add({
      unsubscribe: () => clearInterval(statusInterval)
    });
  }

  private checkVotingStatus() {
    this.votingEnabled = this.votingService.isVotingEnabled();
    this.minutesRemaining = this.votingService.getMinutesUntilReveal();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  selectPrediction(prediction: 'niño' | 'niña') {
    this.selectedPrediction = prediction;
  }

  submitVote() {
    if (!this.voterName.trim() || !this.selectedPrediction || this.isSubmitting || !this.votingEnabled) {
      if (!this.votingEnabled) {
        alert('La votación se ha cerrado. Solo quedan menos de 1 minuto para la revelación.');
      }
      return;
    }

    // Verificar si este dispositivo ya votó
    if (this.deviceHasVoted) {
      alert('Este dispositivo ya ha votado anteriormente.');
      return;
    }

    this.isSubmitting = true;

    const submitSubscription = this.votingService
      .submitVote(this.voterName, this.selectedPrediction)
      .subscribe(success => {
        this.isSubmitting = false;
        
        if (success) {
          this.showThankYou = true;
          this.hasVoted = true;
          this.deviceHasVoted = true;
          
          // Resetear formulario después de 3 segundos
          setTimeout(() => {
            this.resetForm();
          }, 3000);
        } else {
          if (this.votingService.hasDeviceVoted()) {
            alert('Este dispositivo ya ha votado anteriormente.');
            this.deviceHasVoted = true;
          } else if (!this.votingService.isVotingEnabled()) {
            alert('La votación se ha cerrado. Solo quedan menos de 1 minuto para la revelación.');
          } else {
            alert('Error al enviar el voto.');
          }
        }
      });

    this.subscription.add(submitSubscription);
  }

  private resetForm() {
    this.voterName = '';
    this.selectedPrediction = null;
    this.showThankYou = false;
    this.hasVoted = false;
  }

  getVoteIcon(prediction: 'niño' | 'niña'): string {
    return prediction === 'niño' ? '👶🏻💙' : '👶🏻💕';
  }

  getRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Justo ahora';
    if (minutes < 60) return `hace ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}