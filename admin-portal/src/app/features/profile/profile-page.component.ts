import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { ProfileService } from './profile.service';
import { MediaPickerDialogComponent } from '../../shared/media-picker/media-picker-dialog.component';
import type { MediaRow } from '../media-library/media-library.service';
import { messageFromApiError } from '../../shared/http/api-error-message';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Mi perfil</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()" class="stack">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Avatar URL</mat-label>
            <input matInput formControlName="avatar_url" />
          </mat-form-field>
          <button mat-stroked-button type="button" (click)="pickAvatar()">Elegir de biblioteca</button>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Contraseña actual</mat-label>
            <input matInput type="password" formControlName="current_password" autocomplete="current-password" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Nueva contraseña</mat-label>
            <input matInput type="password" formControlName="new_password" autocomplete="new-password" />
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="saving()">Guardar</button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 520px;
    }
    .full {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profile = inject(ProfileService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: [''],
    avatar_url: [''],
    current_password: [''],
    new_password: [''],
  });

  pickAvatar(): void {
    const ref = this.dialog.open(MediaPickerDialogComponent, { width: '720px' });
    ref.afterClosed().subscribe((m: MediaRow | undefined) => {
      if (m) this.form.patchValue({ avatar_url: m.original_url });
    });
  }

  save(): void {
    this.saving.set(true);
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {};
    if (v.name?.trim()) body['name'] = v.name.trim();
    if (v.avatar_url?.trim()) body['avatar_url'] = v.avatar_url.trim();
    if (v.new_password) {
      body['new_password'] = v.new_password;
      body['current_password'] = v.current_password;
    }
    this.profile.patchMe(body).subscribe({
      next: () => {
        this.snack.open('Perfil actualizado', 'OK', { duration: 3000 });
        this.form.patchValue({ current_password: '', new_password: '' });
      },
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 6000 }),
      complete: () => this.saving.set(false),
    });
  }
}
