import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HasRoleDirective } from '../../shared/auth/has-role.directive';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'app-inventory-movement-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
  ],
  template: `
    <div *appHasRole="mutatorRoles">
      <h4>Registrar movimiento</h4>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Ítem</mat-label>
          <mat-select formControlName="item_id">
            @for (it of items(); track it.id) {
              <mat-option [value]="it.id">{{ it.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type">
            <mat-option value="ENTRY">Entrada</mat-option>
            <mat-option value="EXIT">Salida</mat-option>
            <mat-option value="ADJUSTMENT">Ajuste</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" formControlName="quantity" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Notas</mat-label>
          <textarea matInput rows="2" formControlName="notes"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Reserva (UUID opcional)</mat-label>
          <input matInput formControlName="reservation_id" />
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="22" />
          } @else {
            Registrar
          }
        </button>
      </form>
    </div>
    <p *appHasRole="['VIEWER', 'AGENT']" class="muted">Tu rol no incluye registrar movimientos de inventario.</p>
  `,
  styles: `
    .full {
      width: 100%;
      margin-top: 0.35rem;
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryMovementFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(InventoryService);
  private readonly snackBar = inject(MatSnackBar);

  /** Alineado a `POST /inventory/movements` (BUSINESS, ADMIN, SUPER_ADMIN). */
  readonly mutatorRoles = ['SUPER_ADMIN', 'ADMIN', 'BUSINESS'] as const;
  readonly items = signal<{ id: string; name: string }[]>([]);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    item_id: ['', Validators.required],
    type: ['ENTRY' as 'ENTRY' | 'EXIT' | 'ADJUSTMENT', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.0001)]],
    notes: [''],
    reservation_id: [''],
  });

  ngOnInit(): void {
    this.svc.listItems(false).subscribe({
      next: (res) => {
        const data = (res as { data?: Record<string, unknown>[] }).data ?? [];
        this.items.set(
          data
            .filter((r) => r['is_active'] !== false)
            .map((r) => ({ id: String(r['id']), name: String(r['name']) })),
        );
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      item_id: v.item_id,
      type: v.type,
      quantity: v.quantity,
      notes: v.notes.trim() || null,
      reservation_id: v.reservation_id.trim() || null,
    };
    this.saving.set(true);
    this.svc.postMovement(body).subscribe({
      next: () => {
        this.snackBar.open('Movimiento registrado', 'OK', { duration: 3000 });
        this.saving.set(false);
        this.form.patchValue({ quantity: 1, notes: '', reservation_id: '' });
      },
      error: (e) => {
        this.saving.set(false);
        this.snackBar.open(
          (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
          'Cerrar',
          { duration: 7000 },
        );
      },
    });
  }
}
