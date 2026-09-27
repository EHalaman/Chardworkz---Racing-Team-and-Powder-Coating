import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth';
import { backendErrorMessage } from '../../core/utils/http-error.util';
import { Account, AccountRole, AccountsService } from '../accounts';

const PAGE_SIZE = 10;

/** Edit is scoped to EMPLOYEE/MANAGER only (see AccountController.update) - Owner is never an editable target or an assignable role here. */
const EDITABLE_ROLE_OPTIONS: { value: AccountRole; label: string }[] = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

@Component({
  selector: 'app-roles',
  standalone: false,
  styleUrl: './roles.css',
  templateUrl: './roles.html',
})
export class Roles implements OnInit {
  readonly accounts = signal<Account[]>([]);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly selectedRole = signal<AccountRole>('EMPLOYEE');
  readonly selectedBranch = signal('MAIN');
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);

  readonly editingId = signal<number | null>(null);
  readonly editingRole = signal<AccountRole>('EMPLOYEE');
  readonly editingBranch = signal('MAIN');
  readonly editSubmitting = signal(false);
  readonly editableRoleOptions = EDITABLE_ROLE_OPTIONS;

  readonly resetPasswordAccount = signal<Account | null>(null);
  readonly resetPasswordSubmitting = signal(false);
  readonly resetPasswordError = signal<string | null>(null);

  readonly roleOptions: { value: AccountRole; label: string }[] = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'EMPLOYEE', label: 'Employee' },
  ];

  readonly branchOptions = [
    { value: 'MAIN', label: 'Main Branch' },
    { value: 'MASINAG', label: 'Masinag Branch' },
  ];

  constructor(
    private accountsService: AccountsService,
    readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  createAccount(username: string, password: string, fullName: string): void {
    if (password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters.');
      return;
    }
    this.errorMessage.set(null);
    this.submitting.set(true);
    this.accountsService
      .create({
        username,
        password,
        fullName,
        role: this.selectedRole(),
        branchCode: this.selectedBranch(),
      })
      .subscribe({
        next: (account) => {
          this.submitting.set(false);
          this.accounts.update((accounts) => [account, ...accounts]);
          this.successMessage.set(`Account "${account.username}" created.`);
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          this.errorMessage.set(
            error.status === 409
              ? 'That username is already taken.'
              : backendErrorMessage(error, 'Could not create the account.'),
          );
        },
      });
  }

  toggleActive(account: Account): void {
    this.errorMessage.set(null);
    this.accountsService.setActive(account.id, !account.active).subscribe({
      next: (updated) => {
        this.accounts.update((accounts) =>
          accounts.map((a) => (a.id === updated.id ? updated : a)),
        );
      },
      error: () => this.errorMessage.set('Could not update that account.'),
    });
  }

  isSelf(account: Account): boolean {
    return account.username === this.auth.currentUser()?.username;
  }

  /** Owner is never an editable target here (see AccountController.update's own restriction). */
  canEdit(account: Account): boolean {
    return account.role !== 'OWNER' && !this.isSelf(account);
  }

  get filteredAccounts(): Account[] {
    const term = this.searchTerm().trim().toLowerCase();
    const list = !term
      ? this.accounts()
      : this.accounts().filter(
          (a) => a.fullName.toLowerCase().includes(term) || a.username.toLowerCase().includes(term),
        );
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAccounts.length / PAGE_SIZE));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedAccounts(): Account[] {
    const page = Math.min(this.currentPage(), this.totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredAccounts.slice(start, start + PAGE_SIZE);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  startEdit(account: Account): void {
    this.errorMessage.set(null);
    this.editingRole.set(account.role);
    this.editingBranch.set(account.branchCode);
    this.editingId.set(account.id);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(account: Account, fullName: string): void {
    if (!fullName.trim()) {
      this.errorMessage.set('Full name cannot be blank.');
      return;
    }
    this.errorMessage.set(null);
    this.editSubmitting.set(true);
    this.accountsService
      .update(account.id, {
        fullName: fullName.trim(),
        role: this.editingRole(),
        branchCode: this.editingBranch(),
      })
      .subscribe({
        next: (updated) => {
          this.editSubmitting.set(false);
          this.accounts.update((accounts) =>
            accounts.map((a) => (a.id === updated.id ? updated : a)),
          );
          this.editingId.set(null);
        },
        error: () => {
          this.editSubmitting.set(false);
          this.errorMessage.set('Could not update that account.');
        },
      });
  }

  openResetPassword(account: Account): void {
    this.resetPasswordError.set(null);
    this.resetPasswordAccount.set(account);
  }

  closeResetPassword(): void {
    this.resetPasswordAccount.set(null);
    this.resetPasswordError.set(null);
  }

  submitResetPassword(newPassword: string, confirmPassword: string): void {
    const account = this.resetPasswordAccount();
    if (!account) {
      return;
    }
    if (newPassword.length < 8) {
      this.resetPasswordError.set('Temporary password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.resetPasswordError.set('Passwords do not match.');
      return;
    }
    this.resetPasswordError.set(null);
    this.resetPasswordSubmitting.set(true);
    this.accountsService.resetPassword(account.id, newPassword).subscribe({
      next: () => {
        this.resetPasswordSubmitting.set(false);
        this.successMessage.set(`Password reset for "${account.username}".`);
        setTimeout(() => this.successMessage.set(null), 3000);
        this.closeResetPassword();
      },
      error: (error: HttpErrorResponse) => {
        this.resetPasswordSubmitting.set(false);
        this.resetPasswordError.set(backendErrorMessage(error, 'Could not reset that password.'));
      },
    });
  }

  private loadAccounts(): void {
    this.accountsService.list().subscribe({
      next: (accounts) => this.accounts.set(accounts),
      error: () => this.errorMessage.set('Could not load accounts.'),
    });
  }
}
