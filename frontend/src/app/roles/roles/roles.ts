import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth';
import { Account, AccountRole, AccountsService } from '../accounts';

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
  readonly showPassword = signal(false);

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

  toggleShowPassword(): void {
    this.showPassword.update((show) => !show);
  }

  createAccount(username: string, password: string, fullName: string): void {
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
              : 'Could not create the account.',
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

  private loadAccounts(): void {
    this.accountsService.list().subscribe({
      next: (accounts) => this.accounts.set(accounts),
      error: () => this.errorMessage.set('Could not load accounts.'),
    });
  }
}
