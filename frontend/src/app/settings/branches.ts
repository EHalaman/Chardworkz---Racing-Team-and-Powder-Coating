import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Branch {
  id: number;
  code: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class BranchesService {
  constructor(private http: HttpClient) {}

  list(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${environment.apiBaseUrl}/api/branches`);
  }

  updateName(id: number, name: string): Observable<Branch> {
    return this.http.patch<Branch>(`${environment.apiBaseUrl}/api/branches/${id}`, { name });
  }
}
