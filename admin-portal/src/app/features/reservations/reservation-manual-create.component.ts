import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReservationsService } from './reservations.service';

@Component({
  selector: 'app-reservation-manual-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Nueva reserva manual</mat-card-title>
      </mat-card-header>
      <mat-card-content [formGroup]="form">
        <mat-radio-group formControlName="kind" class="row">
          <mat-radio-button value="plan">Plan</mat-radio-button>
          <mat-radio-button value="room">Habitación</mat-radio-button>
        </mat-radio-group>
        @if (form.value.kind === 'plan') {
          <mat-form-field appearance="outline" class="full">
            <mat-label>ID plan (UUID)</mat-label>
            <input matInput formControlName="plan_id" />
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline" class="full">
            <mat-label>ID habitación (UUID)</mat-label>
            <input matInput formControlName="room_id" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre cliente</mat-label>
          <input matInput formControlName="customer_name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Documento</mat-label>
          <input matInput formControlName="customer_document" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="customer_email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="customer_phone" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Fecha inicio</mat-label>
          <input matInput type="date" formControlName="date_start" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Fecha fin</mat-label>
          <input matInput type="date" formControlName="date_end" />
        </mat-form-field>
        <div class="row2">
          <mat-form-field appearance="outline">
            <mat-label>Adultos</mat-label>
            <input matInput type="number" min="1" formControlName="adults" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Niños</mat-label>
            <input matInput type="number" min="0" formControlName="children" />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Notas</mat-label>
          <textarea matInput rows="2" formControlName="notes"></textarea>
        </mat-form-field>
      </mat-card-content>
      <mat-card-actions align="end">
        <a mat-button routerLink="/admin/reservations">Volver al listado</a>
        <button mat-flat-button color="primary" type="button" [disabled]="form.invalid || saving()" (click)="submit()">
          @if (saving()) {
            <mat-spinner diameter="22" />
          } @else {
            Crear
          }
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .full {
      width: 100%;
      margin-top: 0.5rem;
    }
    .row {
      display: flex;
      gap: 1rem;
      margin: 0.5rem 0 1rem;
    }
    .row2 {
      display: flex;
      gap: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationManualCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reservations = inject(ReservationsService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    kind: this.fb.nonNullable.control<'plan' | 'room'>('plan'),
    plan_id: [''],
    room_id: [''],
    customer_name: ['', Validators.required],
    customer_document: ['', Validators.required],
    customer_email: [''],
    customer_phone: ['', Validators.required],
    date_start: ['', Validators.required],
    date_end: [''],
    adults: [2, [Validators.required, Validators.min(1)]],
    children: [0, [Validators.min(0)]],
    notes: [''],
  });

  constructor() {
    this.form.controls.kind.valueChanges.subscribe((k) => {
      if (k === 'plan') {
        this.form.patchValue({ room_id: '' });
        this.form.controls.plan_id.setValidators([Validators.required]);
        this.form.controls.room_id.clearValidators();
      } else {
        this.form.patchValue({ plan_id: '' });
        this.form.controls.room_id.setValidators([Validators.required]);
        this.form.controls.plan_id.clearValidators();
      }
      this.form.controls.plan_id.updateValueAndValidity();
      this.form.controls.room_id.updateValueAndValidity();
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      customer_name: v.customer_name,
      customer_document: v.customer_document,
      customer_email: v.customer_email || null,
      customer_phone: v.customer_phone,
      date_start: v.date_start,
      date_end: v.date_end || null,
      adults: v.adults,
      children: v.children,
      notes: v.notes || null,
      optional_activity_ids: [],
    };
    if (v.kind === 'plan') body['plan_id'] = v.plan_id.trim();
    else body['room_id'] = v.room_id.trim();

    this.saving.set(true);
    this.reservations.createReservation(body).subscribe({
      next: (res: unknown) => {
        const id = (res as { data?: { id?: string } }).data?.id;
        this.snackBar.open('Reserva creada', 'OK', { duration: 4000 });
        this.saving.set(false);
        if (id) void this.router.navigate(['/admin/reservations'], { queryParams: { focus: id } });
        else void this.router.navigate(['/admin/reservations']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg =
          (err as { error?: { error?: { message?: string } } })?.error?.error?.message ??
          'Error al crear';
        this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
      },
    });
  }
}
