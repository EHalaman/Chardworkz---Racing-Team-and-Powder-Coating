import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from '../core/auth';
import { ProductCategory } from './products';

export type NewFormMode = 'PRODUCT' | 'PACKAGE';

/**
 * In-memory drafts for the Products page's "New" panel (single product and service package).
 * Root-scoped so a half-typed form survives switching tabs and navigating away and back -
 * the page component is destroyed on navigation, this service is not. Deliberately not
 * localStorage: nothing here should outlive the tab, and it is cleared on sign-out so a
 * different user on the same tab never inherits a draft.
 */
@Injectable({ providedIn: 'root' })
export class ProductDrafts {
  readonly formMode = signal<NewFormMode>('PRODUCT');

  readonly productName = signal('');
  readonly productBrandTag = signal('');
  readonly productOemPartNo = signal('');
  readonly productUnitPrice = signal('');
  readonly productCategory = signal<ProductCategory>('OTHERS');

  readonly packageName = signal('');
  readonly packageDescription = signal('');
  readonly packageBasePrice = signal('');
  readonly packageLaborProductId = signal<number | null>(null);
  readonly packageSelectedParts = signal<Set<number>>(new Set());
  readonly partsSearchTerm = signal('');

  constructor() {
    const auth = inject(AuthService);
    effect(() => {
      if (!auth.currentUser()) {
        this.clearAll();
      }
    });
  }

  clearProduct(): void {
    this.productName.set('');
    this.productBrandTag.set('');
    this.productOemPartNo.set('');
    this.productUnitPrice.set('');
    this.productCategory.set('OTHERS');
  }

  clearPackage(): void {
    this.packageName.set('');
    this.packageDescription.set('');
    this.packageBasePrice.set('');
    this.packageLaborProductId.set(null);
    this.packageSelectedParts.set(new Set());
    this.partsSearchTerm.set('');
  }

  clearAll(): void {
    this.formMode.set('PRODUCT');
    this.clearProduct();
    this.clearPackage();
  }
}
