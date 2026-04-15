import { Injectable } from '@angular/core';
import Pusher from 'pusher-js';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProgressEvent {
  completed: number;
  total: number;
  lastStatus: number;
  lastResponseTime: number;
  successCount: number;
  failCount: number;
}

export interface CompletedEvent {
  message: string;
  resultId: string;
}

export interface ErrorEvent {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private pusher: Pusher;
  private channel: any;
  
  private progressSubject = new Subject<ProgressEvent>();
  private completedSubject = new Subject<CompletedEvent>();
  private errorSubject = new Subject<ErrorEvent>();
  private stoppedSubject = new Subject<any>();

  constructor() {
    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster,
      forceTLS: true
    });
  }

  joinRoom(userId: string): void {
    if (this.channel) {
      this.pusher.unsubscribe(this.channel.name);
    }
    
    this.channel = this.pusher.subscribe(`user-${userId}`);
    
    this.channel.bind('progress', (data: ProgressEvent) => {
      this.progressSubject.next(data);
    });
    
    this.channel.bind('completed', (data: CompletedEvent) => {
      this.completedSubject.next(data);
    });
    
    this.channel.bind('error', (data: ErrorEvent) => {
      this.errorSubject.next(data);
    });
    
    this.channel.bind('stopped', (data: any) => {
      this.stoppedSubject.next(data);
    });
  }

  onProgress(): Observable<ProgressEvent> {
    return this.progressSubject.asObservable();
  }

  onCompleted(): Observable<CompletedEvent> {
    return this.completedSubject.asObservable();
  }

  onError(): Observable<ErrorEvent> {
    return this.errorSubject.asObservable();
  }

  onStopped(): Observable<any> {
    return this.stoppedSubject.asObservable();
  }

  disconnect(): void {
    if (this.channel) {
      this.pusher.unsubscribe(this.channel.name);
      this.channel = null;
    }
  }
}
