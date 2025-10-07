import { Component, OnInit, OnDestroy } from '@angular/core';
import { VotingService, Vote, VotingStats } from '../services/voting.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-all-votes',
  templateUrl: './all-votes.page.html',
  styleUrls: ['./all-votes.page.scss'],
})
export class AllVotesPage implements OnInit, OnDestroy {
  stats$: Observable<VotingStats>;
  allVotes: Vote[] = [];
  paginatedVotes: Vote[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  private subscription = new Subscription();

  constructor(private votingService: VotingService) {
    this.stats$ = this.votingService.getStats();
  }

  ngOnInit() {
    // Suscribirse a todos los votos
    const votesSubscription = this.votingService.getVotes().subscribe(votes => {
      this.allVotes = votes.sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp.toDate().getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp.toDate().getTime();
        return bTime - aTime;
      });
      this.calculatePagination();
      this.updatePaginatedVotes();
    });
    
    this.subscription.add(votesSubscription);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.allVotes.length / this.itemsPerPage);
    
    // Si la página actual es mayor al total de páginas, ir a la última página
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    // Si no hay votos, resetear a página 1
    if (this.totalPages === 0) {
      this.currentPage = 1;
    }
  }

  updatePaginatedVotes() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedVotes = this.allVotes.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedVotes();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedVotes();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedVotes();
    }
  }

  getVoteIcon(prediction: 'niño' | 'niña'): string {
    return prediction === 'niño' ? '👶🏻💙' : '👶🏻💕';
  }

  getFormattedDate(timestamp: Date | any): string {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  getFormattedTime(timestamp: Date | any): string {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  // Exponer Math para usar en el template
  Math = Math;
}