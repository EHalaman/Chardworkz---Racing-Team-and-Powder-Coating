import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../core/auth';

export type AccountRole = 'OWNER' | 'MANAGER' | 'EMPLOYEE';

export interface Account {
  id: number;
  username: string;
  fullName: string;
  role: AccountRole;
  branchCode: string;
  active: boolean;
  createdAt: string;
}

export interface CreateAccountRequest {
  username: string;
  password: string;
  fullName: string;
  role: AccountRole;
  branchCode: string;
}

export interface UpdateAccountRequest {
  role: AccountRole;
  branchCode: string;
}

@Injectable({ providedIn: 'root' })
export class AccountsService {
  constructor(private http: HttpClient) {}

  list(): Observable<Account[]> {
    return this.http.get<Account[]>(`${environment.apiBaseUrl}/api/accounts`);
  }

  create(request: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(`${environment.apiBaseUrl}/api/accounts`, request);
  }

  setActive(id: number, active: boolean): Observable<Account> {
    return this.http.patch<Account>(`${environment.apiBaseUrl}/api/accounts/${id}/status`, {
      active,
    });
  }

  update(id: number, request: UpdateAccountRequest): Observable<Account> {
    return this.http.patch<Account>(`${environment.apiBaseUrl}/api/accounts/${id}`, request);
  }

  updateProfile(fullName: string): Observable<LoginResponse> {
    return this.http.patch<LoginResponse>(`${environment.apiBaseUrl}/api/accounts/me`, {
      fullName,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiBaseUrl}/api/accounts/me/password`, {
      currentPassword,
      newPassword,
    });
  }
}
