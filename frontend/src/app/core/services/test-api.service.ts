import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TestApiService {
  private http = inject(HttpClient);
  
  runTest(config: any) {
    return this.http.post<any>(`${environment.apiUrl}/api/test/run`, config);
  }
  
  stopTest() {
    return this.http.post<any>(`${environment.apiUrl}/api/test/stop`, {});
  }
  
  getLimits() {
    return this.http.get<any>(`${environment.apiUrl}/api/test/limits`);
  }
}
