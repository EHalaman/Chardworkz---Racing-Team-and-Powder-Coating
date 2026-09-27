import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { AccountsService } from '../../roles/accounts';
import { AuthService } from '../../core/auth';
import { backendErrorMessage } from '../../core/utils/http-error.util';
import { PermissionFlag, PermissionKey, PermissionsService } from '../../core/permissions';
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

  readonly permissions = signal<PermissionFlag[]>([]);
  readonly permissionError = signal<string | null>(null);

  constructor(
    private accountsService: AccountsService,
    readonly auth: AuthService,
    readonly theme: ThemeService,
    private branchesService: BranchesService,
    private permissionsService: PermissionsService,
  ) {}

  /** Business branches and Manager permissions are Owner-only workspace admin, not part of any role's personal profile - see security-qa-audit-2026-09-25.md's Feature A follow-up. */
  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  ngOnInit(): void {
    // BranchController and the permission-toggle PATCH are Owner-only on the
    // backend (PermissionController's GET is Owner+Manager, but this page
    // hides that card from Manager too - see settings.html - so there's no
    // reason to fetch it for anyone but the Owner). Skipping the call for a
    // non-Owner avoids a guaranteed 403 for a card they'll never see.
    if (!this.isOwner) {
      return;
    }
    this.branchesService.list().subscribe({
      next: (branches) => this.branches.set(branches),
      error: () => this.branchError.set('Could not load branches.'),
    });
    this.permissionsService.list().subscribe({
      next: (permissions) => this.permissions.set(permissions),
      error: () => this.permissionError.set('Could not load permission settings.'),
    });
  }

  isPermissionEnabled(key: PermissionKey): boolean {
    return this.permissionsService.hasPermission(this.permissions(), key);
  }

  togglePermission(key: PermissionKey): void {
    this.permissionError.set(null);
    const nextEnabled = !this.isPermissionEnabled(key);
    this.permissionsService.update(key, nextEnabled).subscribe({
      next: (updated) => {
        this.permissions.update((flags) =>
          flags.map((f) => (f.permissionKey === updated.permissionKey ? updated : f)),
        );
      },
      error: () => this.permissionError.set('Could not update that permission.'),
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
      error: (error: HttpErrorResponse) => {
        this.savingProfile.set(false);
        this.profileError.set(backendErrorMessage(error, 'Could not update your profile.'));
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
    if (newPassword.length < 8) {
      this.passwordError.set('New password must be at least 8 characters.');
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
        this.passwordError.set(backendErrorMessage(error, 'Could not change your password.'));
      },
    });
  }

  startEditBranch(branch: Branch): void {
    this.branchError.set(null);
    this.editingBranchId.set(branch.id);
  }

  cancelEditBranch(): void {
    this.editingBranchId.set(null);
  }

  saveBranch(
    branch: Branch,
    name: string,
    monthlySalesGoal: string,
    openingTime: string,
    closingTime: string,
  ): void {
    const goal = Number(monthlySalesGoal);
    if (!name.trim() || !Number.isFinite(goal) || goal < 0) {
      this.branchError.set('Enter a name and a valid monthly sales goal.');
      return;
    }
    if (!openingTime || !closingTime || openingTime >= closingTime) {
      this.branchError.set('Opening time must be before closing time.');
      return;
    }
    this.branchError.set(null);
    this.branchesService.update(branch.id, name.trim(), goal, openingTime, closingTime).subscribe({
      next: (updated) => {
        this.branches.update((branches) =>
          branches.map((b) => (b.id === updated.id ? updated : b)),
        );
        this.editingBranchId.set(null);
      },
      error: () => this.branchError.set('Could not update that branch.'),
    });
  }

  timeInputValue(time: string): string {
    return time.slice(0, 5);
  }
}
