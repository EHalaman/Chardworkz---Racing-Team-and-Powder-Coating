import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { AccountsService } from '../../roles/accounts';
import { AuthService } from '../../core/auth';
import { ThemeService } from '../../core/theme';
import { Branch, BranchesService } from '../branches';

@Component({
  selector: 'app-settings',
  standalone: false,
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  readonly branches = signal<Branch[]>([]);
  readonly editingBranchId = signal<number | null>(null);
  readonly branchError = signal<string | null>(null);

  readonly profileMessage = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly savingProfile = signal(false);

  readonly passwordMessage = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly savingPassword = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);

  constructor(
    private accountsService: AccountsService,
    readonly auth: AuthService,
    readonly theme: ThemeService,
    private branchesService: BranchesService,
  ) {}

  ngOnInit(): void {
    this.branchesService.list().subscribe({
      next: (branches) => this.branches.set(branches),
      error: () => this.branchError.set('Could not load branches.'),
    });
  }

  saveProfile(fullName: string): void {
    if (!fullName.trim()) {
      return;
    }
    this.profileError.set(null);
    this.savingProfile.set(true);
    this.accountsService.updateProfile(fullName.trim()).subscribe({
      next: (session) => {
        this.savingProfile.set(false);
        this.auth.updateSession(session);
        this.profileMessage.set('Profile updated.');
        setTimeout(() => this.profileMessage.set(null), 3000);
      },
      error: () => {
        this.savingProfile.set(false);
        this.profileError.set('Could not update your profile.');
      },
    });
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): void {
    this.passwordError.set(null);
    if (!currentPassword || !newPassword) {
      this.passwordError.set('Enter your current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.passwordError.set('New passwords do not match.');
      return;
    }
    this.savingPassword.set(true);
    this.accountsService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordMessage.set('Password changed.');
        setTimeout(() => this.passwordMessage.set(null), 3000);
      },
      error: (error: HttpErrorResponse) => {
        this.savingPassword.set(false);
        this.passwordError.set(
          error.status === 400
            ? 'Current password is incorrect.'
            : 'Could not change your password.',
        );
      },
    });
  }

  toggleShowCurrentPassword(): void {
    this.showCurrentPassword.update((show) => !show);
  }

  toggleShowNewPassword(): void {
    this.showNewPassword.update((show) => !show);
  }

  startEditBranch(branch: Branch): void {
    this.branchError.set(null);
    this.editingBranchId.set(branch.id);
  }

  cancelEditBranch(): void {
    this.editingBranchId.set(null);
  }

  saveBranch(branch: Branch, name: string, monthlySalesGoal: string): void {
    const goal = Number(monthlySalesGoal);
    if (!name.trim() || !Number.isFinite(goal) || goal < 0) {
      this.branchError.set('Enter a name and a valid monthly sales goal.');
      return;
    }
    this.branchError.set(null);
    this.branchesService.update(branch.id, name.trim(), goal).subscribe({
      next: (updated) => {
        this.branches.update((branches) =>
          branches.map((b) => (b.id === updated.id ? updated : b)),
        );
        this.editingBranchId.set(null);
      },
      error: () => this.branchError.set('Could not update that branch.'),
    });
  }
}
