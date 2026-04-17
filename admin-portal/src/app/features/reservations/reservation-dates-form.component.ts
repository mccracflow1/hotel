import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ReservationDatesDialogData {
  date_start: string;
  date_end: string | null;
}

export interface ReservationDatesDialogResult {
  date_start: string;
  date_end: string | null;
  version?: number;
}

@Component({
  selector: 'app-reservation-dates-form',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Cambiar fechas</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Inicio</mat-label>
        <input matInput type="date" [formControl]="startCtrl" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Fin (opcional)</mat-label>
        <input matInput type="date" [formControl]="endCtrl" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cerrar</button>
      <button mat-flat-button color="primary" type="button" [disabled]="startCtrl.invalid" (click)="save()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .content {
      min-width: 300px;
    }
    .full {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDatesFormComponent {
  readonly data = inject<ReservationDatesDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ReservationDatesFormComponent, ReservationDatesDialogResult | undefined>);

  readonly startCtrl = new FormControl(this.data.date_start, {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly endCtrl = new FormControl(this.data.date_end ?? '', { nonNullable: true });

  save(): void {
    if (this.startCtrl.invalid) return;
    const end = this.endCtrl.value?.trim();
    this.ref.close({
      date_start: this.startCtrl.value,
      date_end: end || null,
    });
  }
}
