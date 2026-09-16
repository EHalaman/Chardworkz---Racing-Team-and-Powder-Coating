import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BranchShiftBreakdown {
  branchCode: string;
  transactionsCount: number;
  revenueTotal: number;
  estimatedCostTotal: number;
  estimatedMarginTotal: number;
}

export interface ShiftSummary {
  transactionsCount: number;
  cashTotal: number;
  ewalletTotal: number;
  revenueTotal: number | null;
  estimatedCostTotal: number | null;
  estimatedMarginTotal: number | null;
  estimatedMarginPercent: number | null;
  lineCountWithKnownCost: number;
  lineCountTotal: number;
  byBranch: BranchShiftBreakdown[];
}

@Injectable({ providedIn: 'root' })
export class ShiftSummaryService {
  constructor(private http: HttpClient) {}

  today(): Observable<ShiftSummary> {
    return this.http.get<ShiftSummary>(`${environment.apiBaseUrl}/api/sales/shift-summary`);
  }
}
