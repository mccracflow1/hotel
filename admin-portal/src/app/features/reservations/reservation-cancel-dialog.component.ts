import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ReservationCancelDialogData {
  reservationId: string;
  policyText?: string;
}

@Component({
  selector: 'app-reservation-cancel-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Cancelar reserva</h2>
    <mat-dialog-content class="content">
      @if (data.policyText) {
        <p class="policy">{{ data.policyText }}</p>
      }
      <mat-form-field appearance="outline" class="full">
        <mat-label>Motivo de cancelación</mat-label>
        <textarea matInput rows="3" [formControl]="reasonCtrl"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Volver</button>
      <button
        mat-flat-button
        color="warn"
        type="button"
        [disabled]="reasonCtrl.invalid"
        (click)="confirm()"
      >
        Cancelar reserva
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .content {
      min-width: 320px;
    }
    .policy {
      white-space: pre-wrap;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .full {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationCancelDialogComponent {
  readonly data = inject<ReservationCancelDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ReservationCancelDialogComponent, string | undefined>);

  readonly reasonCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });

  confirm(): void {
    if (this.reasonCtrl.invalid) return;
    this.ref.close(this.reasonCtrl.value.trim());
  }
}
