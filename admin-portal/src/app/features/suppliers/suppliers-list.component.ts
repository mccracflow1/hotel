import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HasRoleDirective } from '../../shared/auth/has-role.directive';
import { SuppliersService } from './suppliers.service';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
  ],
  template: `
    <h4>Proveedores</h4>
    @if (loading()) {
      <mat-spinner diameter="32" />
    } @else {
      <table mat-table [dataSource]="rows()" class="table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>
        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Teléfono</th>
          <td mat-cell *matCellDef="let row">{{ row.phone || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let row">{{ row.email || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="is_active">
          <th mat-header-cell *matHeaderCellDef>Activo</th>
          <td mat-cell *matCellDef="let row">{{ row.is_active ? 'Sí' : 'No' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let row">
            <button
              *appHasRole="['SUPER_ADMIN', 'ADMIN']"
              mat-button
              type="button"
              aria-label="Editar proveedor"
              (click)="startEdit(row)"
            >
              Editar
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
    }

    <div *appHasRole="['SUPER_ADMIN', 'ADMIN']" class="form-block" [formGroup]="form">
      <h5>{{ editingId() ? 'Editar' : 'Nuevo' }} proveedor</h5>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="name" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Teléfono</mat-label>
        <input matInput formControlName="phone" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Dirección</mat-label>
        <textarea matInput rows="2" formControlName="address"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Notas</mat-label>
        <textarea matInput rows="2" formControlName="notes"></textarea>
      </mat-form-field>
      <mat-slide-toggle formControlName="is_active">Activo</mat-slide-toggle>
      <div class="row-actions">
        <button mat-flat-button color="primary" type="button" [disabled]="form.invalid || saving()" (click)="save()">
          @if (saving()) {
            <mat-spinner diameter="22" />
          } @else {
            Guardar
          }
        </button>
        @if (editingId()) {
          <button mat-button type="button" (click)="cancelEdit()">Cancelar edición</button>
        }
      </div>
    </div>
  `,
  styles: `
    .table {
      width: 100%;
      margin: 0.5rem 0 1rem;
    }
    .form-block {
      margin-top: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid color-mix(in srgb, var(--mat-sys-outline) 40%, transparent);
    }
    .full {
      width: 100%;
      margin-top: 0.35rem;
    }
    .row-actions {
      margin-top: 0.75rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(SuppliersService);
  private readonly snackBar = inject(MatSnackBar);

  readonly cols = ['name', 'phone', 'email', 'is_active', 'actions'];
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    email: [''],
    address: [''],
    notes: [''],
    is_active: [true],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: (res) => {
        const data = (res as { data?: Record<string, unknown>[] }).data ?? [];
        this.rows.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudieron cargar proveedores', 'Cerrar', { duration: 5000 });
      },
    });
  }

  startEdit(row: Record<string, unknown>): void {
    this.editingId.set(String(row['id']));
    this.form.patchValue({
      name: String(row['name'] ?? ''),
      phone: String(row['phone'] ?? ''),
      email: String(row['email'] ?? ''),
      address: String(row['address'] ?? ''),
      notes: String(row['notes'] ?? ''),
      is_active: Boolean(row['is_active'] ?? true),
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', phone: '', email: '', address: '', notes: '', is_active: true });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = {
      name: v.name,
      phone: v.phone.trim() || null,
      email: v.email.trim() || null,
      address: v.address.trim() || null,
      notes: v.notes.trim() || null,
      is_active: v.is_active,
    };
    this.saving.set(true);
    const id = this.editingId();
    if (id) {
      this.svc.update(id, body).subscribe({
        next: () => {
          this.snackBar.open('Proveedor actualizado', 'OK', { duration: 2500 });
          this.saving.set(false);
          this.cancelEdit();
          this.reload();
        },
        error: (e) => {
          this.saving.set(false);
          this.snackBar.open(this.errMsg(e), 'Cerrar', { duration: 7000 });
        },
      });
    } else {
      this.svc.create(body).subscribe({
        next: () => {
          this.snackBar.open('Proveedor creado', 'OK', { duration: 2500 });
          this.saving.set(false);
          this.cancelEdit();
          this.reload();
        },
        error: (e) => {
          this.saving.set(false);
          this.snackBar.open(this.errMsg(e), 'Cerrar', { duration: 7000 });
        },
      });
    }
  }

  private errMsg(e: unknown): string {
    return (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error';
  }
}
