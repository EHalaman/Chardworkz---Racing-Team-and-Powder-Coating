import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth';
import {
  BranchInventorySummary,
  InventoryItem,
  InventoryService,
  StockReceipt,
} from '../inventory';

@Component({
  selector: 'app-inventory',
  standalone: false,
  styleUrl: './inventory.css',
  templateUrl: './inventory.html',
})
export class Inventory implements OnInit {
  readonly items = signal<InventoryItem[]>([]);
  readonly receipts = signal<StockReceipt[]>([]);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly editingThresholdFor = signal<number | null>(null);
  readonly selectedBranch = signal<string | null>(null);
  readonly branchSummaries = signal<BranchInventorySummary[]>([]);

  readonly branchOptions = [
    { value: 'MAIN', label: 'Main Branch' },
    { value: 'MASINAG', label: 'Masinag Branch' },
  ];

  constructor(
    private inventoryService: InventoryService,
    readonly auth: AuthService,
  ) {}

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  ngOnInit(): void {
    this.selectedBranch.set(this.auth.currentUser()?.branchCode ?? 'MAIN');
    this.loadInventory();
    this.loadReceipts();
    if (this.isOwner) {
      this.loadBranchSummaries();
    }
  }

  selectBranch(branchCode: string): void {
    this.selectedBranch.set(branchCode);
    this.editingThresholdFor.set(null);
    this.loadInventory();
    this.loadReceipts();
  }

  summaryFor(branchCode: string): BranchInventorySummary | undefined {
    return this.branchSummaries().find((summary) => summary.branchCode === branchCode);
  }

  startEditThreshold(item: InventoryItem): void {
    this.errorMessage.set(null);
    this.editingThresholdFor.set(item.productId);
  }

  cancelEditThreshold(): void {
    this.editingThresholdFor.set(null);
  }

  saveThreshold(item: InventoryItem, value: string): void {
    const threshold = Number(value);
    if (!Number.isFinite(threshold) || threshold < 0) {
      this.errorMessage.set('Reorder threshold must be a non-negative number.');
      return;
    }

    this.errorMessage.set(null);
    this.inventoryService
      .updateReorderThreshold(item.productId, threshold, this.selectedBranch())
      .subscribe({
        next: (updated) => {
          this.items.update((items) =>
            items.map((i) => (i.productId === updated.productId ? updated : i)),
          );
          this.editingThresholdFor.set(null);
          if (this.isOwner) {
            this.loadBranchSummaries();
          }
        },
        error: () => this.errorMessage.set('Could not update the reorder threshold.'),
      });
  }

  receiveStock(
    productId: string,
    quantity: string,
    unitCost: string,
    supplierName: string,
    referenceNo: string,
  ): void {
    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity);
    const parsedUnitCost = Number(unitCost);
    if (!parsedProductId) {
      this.errorMessage.set('Pick a product.');
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      this.errorMessage.set('Enter a quantity of at least 1.');
      return;
    }
    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) {
      this.errorMessage.set('Enter a valid unit cost.');
      return;
    }
    if (!supplierName.trim()) {
      this.errorMessage.set('Enter a supplier name.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    this.inventoryService
      .receive({
        productId: parsedProductId,
        quantity: parsedQuantity,
        unitCost: parsedUnitCost,
        supplierName: supplierName.trim(),
        referenceNo: referenceNo.trim() || null,
        branchCode: this.selectedBranch(),
      })
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.items.update((items) =>
            items.map((i) => (i.productId === updated.productId ? updated : i)),
          );
          this.successMessage.set(`Received ${parsedQuantity} × "${updated.name}".`);
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadReceipts();
          if (this.isOwner) {
            this.loadBranchSummaries();
          }
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Could not record that stock receipt.');
        },
      });
  }

  private loadInventory(): void {
    this.inventoryService.list(this.selectedBranch()).subscribe({
      next: (items) => this.items.set(items),
      error: () => this.errorMessage.set('Could not load inventory.'),
    });
  }

  private loadReceipts(): void {
    this.inventoryService.receipts(this.selectedBranch()).subscribe({
      next: (receipts) => this.receipts.set(receipts),
      error: () => this.errorMessage.set('Could not load recent receipts.'),
    });
  }

  private loadBranchSummaries(): void {
    this.inventoryService.branchSummary().subscribe({
      next: (summaries) => this.branchSummaries.set(summaries),
      error: () => {
        /* Non-critical: the branch buttons just render without count badges. */
      },
    });
  }
}
