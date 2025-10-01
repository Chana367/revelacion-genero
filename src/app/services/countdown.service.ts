import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map, startWith, catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ConfigurationService } from './configuration.service';

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

  constructor(
    private http: HttpClient,
    private configService: ConfigurationService
  ) { }

  /**
   * Obtiene la fecha actual del servidor para evitar manipulación local
   */
  private getServerTime(): Observable<Date> {
    return this.http.get<any>(this.TIME_API_URL).pipe(
      map(response => new Date(response.datetime)),
      catchError(() => of(new Date())) // Si falla la API, usar fecha local como fallback
    );
  }

  /**
   * Calcula el tiempo restante hasta la fecha de revelación usando hora del servidor
   */
  getCountdown(): Observable<CountdownData> {
    return this.configService.config$.pipe(
      switchMap(config => 
        interval(1000).pipe(
          startWith(0),
          switchMap(() => this.getServerTime()),
          map(serverTime => {
            const timeDiff = config.revealDate.getTime() - serverTime.getTime();

            if (timeDiff <= 0) {
              return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isEventPassed: true
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
  getRevealDate(): Date {
    return this.configService.getRevealDate();
  }

  /**
   * Obtiene el género configurado desde Firebase
   */
  getGender(): 'niño' | 'niña' {
    return this.configService.getGender();
  }

  /**
   * Verifica la integridad de la fecha usando el servidor
   */
  verifyTimeIntegrity(): Observable<boolean> {
    return this.getServerTime().pipe(
      map(serverTime => {
        const localTime = new Date();
        const timeDifference = Math.abs(serverTime.getTime() - localTime.getTime());
        // Permite una diferencia de máximo 5 minutos
        return timeDifference < 5 * 60 * 1000;
      })
    );
  }

  /**
   * Obtiene la hora actual del servidor (método público para otros servicios)
   */
  getCurrentServerTime(): Observable<Date> {
    return this.getServerTime();
  }
}
