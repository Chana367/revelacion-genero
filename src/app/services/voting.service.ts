import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { CountdownService } from './countdown.service';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export interface Vote {
  id?: string;
  voterName: string;
  prediction: 'niño' | 'niña';
  timestamp: Date | Timestamp;
}

export interface VotingStats {
  totalVotes: number;
  boyVotes: number;
  girlVotes: number;
  boyPercentage: number;
  girlPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class VotingService {
  private votes: Vote[] = [];
  private votesSubject = new BehaviorSubject<Vote[]>([]);
  private statsSubject = new BehaviorSubject<VotingStats>(this.calculateStats());
  private readonly DEVICE_VOTED_KEY = 'revelacion_device_voted';
  private readonly VOTES_COLLECTION = 'votes';
  private readonly CONFIG_COLLECTION = 'configuration';
  private firebaseInitialized = false;

  constructor(
    private http: HttpClient,
    private countdownService: CountdownService
  ) {
    // Cargar votos existentes del localStorage como respaldo
    this.loadVotesFromStorage();
    // Inicializar Firebase
    this.initializeFirebase();
  }

  /**
   * Verificar si la votación está habilitada usando hora del servidor
   */
  isVotingEnabled(): boolean {
    const revealDate = this.countdownService.getRevealDate();
    // Usar hora local como aproximación, pero la validación real se hace en el servidor
    const now = new Date();
    const timeDiff = revealDate.getTime() - now.getTime();
    const minutesRemaining = timeDiff / (1000 * 60);
    
    // Deshabilitar votación si queda menos de 1 minuto o ya pasó la fecha
    return minutesRemaining > 1;
  }

  /**
   * Verificar si la votación está habilitada usando hora del servidor (método asíncrono)
   */
  isVotingEnabledAsync(): Observable<boolean> {
    const revealDate = this.countdownService.getRevealDate();
    if (!revealDate) {
      return of(false); // No hay fecha configurada
    }
    
    const serverTime = this.countdownService.getCurrentServerTime();
    const timeDiff = revealDate.getTime() - serverTime.getTime();
    const minutesRemaining = timeDiff / (1000 * 60);
    return of(minutesRemaining > 1);
  }

  /**
   * Obtener tiempo restante en minutos para la revelación
   */
  getMinutesUntilReveal(): number {
    const revealDate = this.countdownService.getRevealDate();
    const now = new Date();
    const timeDiff = revealDate.getTime() - now.getTime();
    return Math.max(0, timeDiff / (1000 * 60));
  }

  /**
   * Verificar si este dispositivo ya votó
   */
  hasDeviceVoted(): boolean {
    return localStorage.getItem(this.DEVICE_VOTED_KEY) === 'true';
  }

  /**
   * Marcar este dispositivo como que ya votó
   */
  private markDeviceAsVoted() {
    localStorage.setItem(this.DEVICE_VOTED_KEY, 'true');
  }

  /**
   * Enviar un voto con verificación de hora del servidor
   */
  submitVote(voterName: string, prediction: 'niño' | 'niña'): Observable<boolean> {
    // Verificar si este dispositivo ya votó (verificación local rápida)
    if (this.hasDeviceVoted()) {
      return from([false]);
    }

    // Verificar si la votación está habilitada usando hora del servidor
    return this.isVotingEnabledAsync().pipe(
      map(votingEnabled => {
        if (!votingEnabled) {
          return false;
        }

        const voteData = {
          voterName: voterName.trim(),
          prediction,
          timestamp: new Date()
        };

        // Procesar el voto de forma síncrona para el map
        try {
          if (this.firebaseInitialized) {
            // Enviar a Firebase (promesa que se ejecuta en background)
            this.sendToFirebase(voteData).then((docId) => {
              console.log('Voto enviado a Firebase:', docId);
            }).catch((error) => {
              console.error('Error enviando a Firebase, guardando localmente:', error);
              this.submitVoteLocally(voteData);
            });
          } else {
            // Usar localStorage como respaldo
            this.submitVoteLocally(voteData);
          }
          
          // Marcar dispositivo como que ya votó
          this.markDeviceAsVoted();
          return true;
        } catch (error) {
          console.error('Error procesando voto:', error);
          return false;
        }
      })
    );
  }

  /**
   * Enviar voto solo a localStorage (método de respaldo)
   */
  private submitVoteLocally(voteData: Omit<Vote, 'id'>) {
    const newVote: Vote = {
      id: this.generateId(),
      ...voteData
    };

    this.votes.push(newVote);
    this.markDeviceAsVoted();
    this.saveVotesToStorage();
    this.updateSubjects();
  }

  /**
   * Obtener todos los votos
   */
  getVotes(): Observable<Vote[]> {
    return this.votesSubject.asObservable();
  }

  /**
   * Obtener estadísticas de votación
   */
  getStats(): Observable<VotingStats> {
    return this.statsSubject.asObservable();
  }

  /**
   * Verificar si un nombre ya votó
   */
  hasAlreadyVoted(voterName: string): boolean {
    return this.votes.some(vote => 
      vote.voterName.toLowerCase() === voterName.toLowerCase().trim()
    );
  }

  /**
   * Obtener los últimos votos (para mostrar en tiempo real)
   */
  getRecentVotes(limit: number = 5): Vote[] {
    return this.votes
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp.toMillis();
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp.toMillis();
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private calculateStats(): VotingStats {
    const total = this.votes.length;
    const boyVotes = this.votes.filter(vote => vote.prediction === 'niño').length;
    const girlVotes = this.votes.filter(vote => vote.prediction === 'niña').length;

    return {
      totalVotes: total,
      boyVotes,
      girlVotes,
      boyPercentage: total > 0 ? (boyVotes / total) * 100 : 0,
      girlPercentage: total > 0 ? (girlVotes / total) * 100 : 0
    };
  }

  private updateSubjects() {
    this.votesSubject.next([...this.votes]);
    this.statsSubject.next(this.calculateStats());
  }

  private saveVotesToStorage() {
    localStorage.setItem('revelacion_votes', JSON.stringify(this.votes));
  }

  private loadVotesFromStorage() {
    const stored = localStorage.getItem('revelacion_votes');
    if (stored) {
      try {
        this.votes = JSON.parse(stored).map((vote: any) => ({
          ...vote,
          timestamp: new Date(vote.timestamp)
        }));
        this.updateSubjects();
      } catch (error) {
        console.error('Error loading votes from storage:', error);
      }
    }
  }

  /**
   * Inicializar conexión con Firebase
   */
  private async initializeFirebase() {
    try {
      // Cargar votos desde Firebase
      await this.loadFromFirebase();
      
      // Configurar listener en tiempo real
      this.setupFirebaseListener();
      
      this.firebaseInitialized = true;
      console.log('Firebase inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando Firebase:', error);
      console.log('Continuando con localStorage como respaldo');
    }
  }

  /**
   * Configurar listener en tiempo real para Firebase
   */
  private setupFirebaseListener() {
    const votesRef = collection(db, this.VOTES_COLLECTION);
    const q = query(votesRef, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
      this.votes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data()['timestamp']?.toDate() || new Date()
      } as Vote));
      
      this.updateSubjects();
      this.saveVotesToStorage(); // Mantener sincronizado localStorage
    }, (error) => {
      console.error('Error en listener de Firebase:', error);
    });
  }

  /**
   * Cargar votos desde Firebase
   */
  private async loadFromFirebase() {
    try {
      const votesRef = collection(db, this.VOTES_COLLECTION);
      const q = query(votesRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      this.votes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data()['timestamp']?.toDate() || new Date()
      } as Vote));
      
      this.updateSubjects();
      this.saveVotesToStorage();
    } catch (error) {
      console.error('Error cargando desde Firebase:', error);
      throw error;
    }
  }

  /**
   * Enviar voto a Firebase
   */
  private async sendToFirebase(vote: Omit<Vote, 'id'>): Promise<string> {
    try {
      const votesRef = collection(db, this.VOTES_COLLECTION);
      const docRef = await addDoc(votesRef, {
        voterName: vote.voterName,
        prediction: vote.prediction,
        timestamp: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error enviando a Firebase:', error);
      throw error;
    }
  }
}