import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { API_URL } from '../../core/tokens';

export interface ReservationAddOptionalData {
  /** Si viene vacío, se carga el catálogo desde el API. */
  options?: { id: string; name: string; price: number }[];
}

export interface ReservationAddOptionalResult {
  optional_activity_id: string;
  quantity: number;
}

@Component({
  selector: 'app-reservation-add-optional',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Agregar opcional</h2>
    <mat-dialog-content class="content">
      @if (loading()) {
        <mat-spinner diameter="36" />
      } @else {
        <mat-form-field appearance="outline" class="full">
          <mat-label>Actividad opcional</mat-label>
          <mat-select [formControl]="optCtrl">
            @for (o of options(); track o.id) {
              <mat-option [value]="o.id">{{ o.name }} — {{ o.price }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" min="1" [formControl]="qtyCtrl" />
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cerrar</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="optCtrl.invalid || qtyCtrl.invalid || !options().length"
        (click)="confirm()"
      >
        Agregar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .content {
      min-width: 320px;
    }
    .full {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationAddOptionalComponent {
  private readonly data = inject<ReservationAddOptionalData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ReservationAddOptionalComponent, ReservationAddOptionalResult | undefined>);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  readonly loading = signal(!this.data.options?.length);
  readonly options = signal<{ id: string; name: string; price: number }[]>(this.data.options ?? []);

  readonly optCtrl = new FormControl<string>('', { validators: [Validators.required] });
  readonly qtyCtrl = new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] });

  constructor() {
    if (!this.data.options?.length) {
      this.http.get<unknown>(`${this.apiUrl}/optional-activities`).subscribe({
        next: (res) => {
          const rows = (res as { data?: { id: string; name: string; price: number }[] }).data ?? [];
          this.options.set(
            rows.map((r) => ({ id: r.id, name: r.name, price: Number(r.price) })),
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  confirm(): void {
    const id = this.optCtrl.value;
    if (!id || this.qtyCtrl.invalid) return;
    this.ref.close({ optional_activity_id: id, quantity: this.qtyCtrl.value });
  }
}
