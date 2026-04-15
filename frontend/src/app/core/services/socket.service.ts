import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent } from 'rxjs';
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
  private socket!: Socket;

  constructor() {
    this.connect();
  }

  private connect() {
    const token = localStorage.getItem('auth_token');
    this.socket = io(`${environment.socketUrl}/test-progress`, {
      autoConnect: false,
      auth: { token },
      withCredentials: true
    });
  }

  joinRoom(userId: string): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
    this.socket.emit('join', userId);
  }

  onProgress(): Observable<ProgressEvent> {
    return fromEvent<ProgressEvent>(this.socket, 'progress');
  }

  onCompleted(): Observable<CompletedEvent> {
    return fromEvent<CompletedEvent>(this.socket, 'completed');
  }

  onError(): Observable<ErrorEvent> {
    return fromEvent<ErrorEvent>(this.socket, 'error');
  }

  onStopped(): Observable<any> {
    return fromEvent<any>(this.socket, 'stopped');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
