import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsersAdminService } from './users-admin.service';
import { messageFromApiError } from '../../shared/http/api-error-message';
import type { UserRole } from '../../core/auth/auth.models';

export interface UserCreateDialogData {
  actorRole: UserRole;
}

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Nuevo usuario</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="stack">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Contraseña</mat-label>
          <input matInput type="password" formControlName="password" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role">
            @for (r of roles(); track r) {
              <mat-option [value]="r">{{ r }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || form.invalid">Crear</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .stack {
      display: flex;
      flex-direction: column;
      min-width: 320px;
    }
    .full {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreateDialogComponent {
  private readonly ref = inject(MatDialogRef<UserCreateDialogComponent, boolean>);
  private readonly data = inject<UserCreateDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly users = inject(UsersAdminService);
  private readonly snack = inject(MatSnackBar);

  readonly saving = signal(false);

  readonly roles = signal<UserRole[]>(['ADMIN', 'BUSINESS', 'VIEWER', 'AGENT']);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['VIEWER' as UserRole, Validators.required],
  });

  constructor() {
    const all: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'];
    if (this.data.actorRole === 'SUPER_ADMIN') {
      this.roles.set(all);
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.users
      .create(v)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.ref.close(true),
        error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 6000 }),
      });
  }
}
