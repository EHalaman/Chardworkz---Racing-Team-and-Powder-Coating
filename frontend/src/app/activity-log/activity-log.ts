import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface ActivityLogEntry {
  id: number;
  actorId: number;
  actorName: string;
  actionType: ActionType;
  entityType: string;
  entityId: string | null;
  branchCode: string | null;
  summary: string;
  occurredAt: string;
}

export interface ActivityLogFilter {
  from?: string;
  to?: string;
  actionType?: ActionType;
  actorId?: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  constructor(private http: HttpClient) {}

  list(filter: ActivityLogFilter): Observable<ActivityLogEntry[]> {
    let params = new HttpParams();
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);
    if (filter.actionType) params = params.set('actionType', filter.actionType);
    if (filter.actorId) params = params.set('actorId', filter.actorId);
    return this.http.get<ActivityLogEntry[]>(`${environment.apiBaseUrl}/api/activity-log`, {
      params,
    });
  }
}
