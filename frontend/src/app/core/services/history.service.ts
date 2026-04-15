import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HistoryApiService {
  private http = inject(HttpClient);
  
  getTests() {
    return this.http.get<any>(`${environment.apiUrl}/api/history`);
  }
  
  getTestById(id: string) {
    return this.http.get<any>(`${environment.apiUrl}/api/history/${id}`);
  }
  
  deleteTest(id: string) {
    return this.http.delete<any>(`${environment.apiUrl}/api/history/${id}`);
  }
  
  updateTestName(id: string, name: string) {
    return this.http.patch<any>(`${environment.apiUrl}/api/history/${id}/name`, { name });
  }
}
