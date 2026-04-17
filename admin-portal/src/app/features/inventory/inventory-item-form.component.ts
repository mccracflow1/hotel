import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from './inventory.service';

export type InventoryItemFormData = { item: Record<string, unknown> | null };

type ItemCategory = 'food' | 'beverages' | 'cleaning' | 'maintenance' | 'other';

function parseCategory(raw: unknown): ItemCategory {
  const s = String(raw ?? 'other');
  const allowed: ItemCategory[] = ['food', 'beverages', 'cleaning', 'maintenance', 'other'];
  return (allowed as string[]).includes(s) ? (s as ItemCategory) : 'other';
}

@Component({
  selector: 'app-inventory-item-form',
  standalone: true,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Editar ítem' : 'Nuevo ítem' }}</h2>
    <mat-dialog-content [formGroup]="form">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="name" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Categoría</mat-label>
        <mat-select formControlName="category">
          <mat-option value="food">Alimentos</mat-option>
          <mat-option value="beverages">Bebidas</mat-option>
          <mat-option value="cleaning">Limpieza</mat-option>
          <mat-option value="maintenance">Mantenimiento</mat-option>
          <mat-option value="other">Otro</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Unidad</mat-label>
        <input matInput formControlName="unit" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Stock inicial</mat-label>
        <input matInput type="number" formControlName="current_stock" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Stock mínimo</mat-label>
        <input matInput type="number" formControlName="min_stock" />
      </mat-form-field>
      <mat-slide-toggle formControlName="is_active">Activo</mat-slide-toggle>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" type="button" [disabled]="form.invalid || saving()" (click)="save()">
        @if (saving()) {
          <mat-spinner diameter="22" />
        } @else {
          Guardar
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full {
      width: 100%;
      margin-top: 0.35rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryItemFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<InventoryItemFormComponent, boolean>);
  private readonly data = inject<InventoryItemFormData>(MAT_DIALOG_DATA);
  private readonly svc = inject(InventoryService);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);
  readonly isEdit = signal(!!this.data.item?.['id']);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: this.fb.nonNullable.control<ItemCategory>('other', Validators.required),
    unit: ['', Validators.required],
    current_stock: [0, [Validators.required, Validators.min(0)]],
    min_stock: [0, [Validators.required, Validators.min(0)]],
    is_active: [true],
  });

  constructor() {
    const it = this.data.item;
    if (it?.['id']) {
      this.form.patchValue({
        name: String(it['name'] ?? ''),
        category: parseCategory(it['category']),
        unit: String(it['unit'] ?? ''),
        current_stock: Number(it['current_stock'] ?? 0),
        min_stock: Number(it['min_stock'] ?? 0),
        is_active: Boolean(it['is_active'] ?? true),
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = {
      name: v.name,
      category: v.category,
      unit: v.unit,
      current_stock: v.current_stock,
      min_stock: v.min_stock,
      is_active: v.is_active,
      supplier_id: null,
    };
    this.saving.set(true);
    const id = this.data.item?.['id'] ? String(this.data.item['id']) : null;
    if (id) {
      this.svc.updateItem(id, body).subscribe({
        next: () => {
          this.snackBar.open('Guardado', 'OK', { duration: 2500 });
          this.saving.set(false);
          this.ref.close(true);
        },
        error: (e) => {
          this.saving.set(false);
          this.snackBar.open(this.errMsg(e), 'Cerrar', { duration: 7000 });
        },
      });
    } else {
      this.svc.createItem(body).subscribe({
        next: () => {
          this.snackBar.open('Creado', 'OK', { duration: 2500 });
          this.saving.set(false);
          this.ref.close(true);
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
