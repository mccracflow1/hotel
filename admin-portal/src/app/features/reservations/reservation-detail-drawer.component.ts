import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { filter, switchMap } from 'rxjs';
import { ReservationsService } from './reservations.service';
import { PaymentsService } from '../payments/payments.service';
import { HasRoleDirective } from '../../shared/auth/has-role.directive';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ReservationCancelDialogComponent,
  type ReservationCancelDialogData,
} from './reservation-cancel-dialog.component';
import {
  ReservationDatesFormComponent,
  type ReservationDatesDialogData,
} from './reservation-dates-form.component';
import {
  ReservationAddOptionalComponent,
  type ReservationAddOptionalData,
} from './reservation-add-optional.component';

@Component({
  selector: 'app-reservation-detail-drawer',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    ClipboardModule,
    HasRoleDirective,
  ],
  templateUrl: './reservation-detail-drawer.component.html',
  styleUrl: './reservation-detail-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailDrawerComponent {
  private readonly reservations = inject(ReservationsService);
  private readonly payments = inject(PaymentsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);

  readonly reservationId = input.required<string>();
  readonly close = output<void>();

  readonly reloadNonce = signal(0);
  readonly loading = signal(true);
  readonly detail = signal<Record<string, unknown> | null>(null);
  readonly paymentUrl = signal<string | null>(null);

  readonly mutatorRoles = ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'AGENT'] as const;
  readonly paymentRoles = ['ADMIN', 'AGENT'] as const;
  readonly statusAdminRoles = ['SUPER_ADMIN', 'ADMIN'] as const;

  constructor() {
    effect((onCleanup) => {
      const id = this.reservationId();
      void this.reloadNonce();
      this.loading.set(true);
      this.detail.set(null);
      const sub = this.reservations.getById(id).subscribe({
        next: (res: unknown) => {
          const data = (res as { data?: Record<string, unknown> }).data ?? null;
          this.detail.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  statusCss(status: unknown): string {
    return 'st-' + String(status ?? '').toLowerCase();
  }

  onClose(): void {
    this.close.emit();
  }

  private refresh(): void {
    this.reloadNonce.update((n) => n + 1);
  }

  confirmReservation(): void {
    const id = this.reservationId();
    const d = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar reserva',
        message: '¿Marcar la reserva como CONFIRMED?',
        confirmLabel: 'Confirmar',
      } satisfies ConfirmDialogData,
    });
    d.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.reservations.patchReservationStatus(id, { status: 'CONFIRMED' }).subscribe({
        next: () => {
          this.snackBar.open('Estado actualizado', 'OK', { duration: 3000 });
          this.refresh();
        },
        error: (e) =>
          this.snackBar.open(
            (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
            'Cerrar',
            { duration: 6000 },
          ),
      });
    });
  }

  openCancel(): void {
    const id = this.reservationId();
    this.reservations.getPolicy(id).subscribe({
      next: (pol: unknown) => {
        const text = JSON.stringify((pol as { data?: unknown }).data ?? pol, null, 2);
        const ref = this.dialog.open(ReservationCancelDialogComponent, {
          data: { reservationId: id, policyText: text } satisfies ReservationCancelDialogData,
          width: '480px',
        });
        ref.afterClosed().subscribe((reason) => {
          if (!reason) return;
          this.reservations.cancelReservation(id, { cancellation_reason: reason }).subscribe({
            next: () => {
              this.snackBar.open('Reserva cancelada', 'OK', { duration: 4000 });
              this.refresh();
            },
            error: (e) =>
              this.snackBar.open(
                (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
                'Cerrar',
                { duration: 7000 },
              ),
          });
        });
      },
      error: () => {
        const ref = this.dialog.open(ReservationCancelDialogComponent, {
          data: { reservationId: id } satisfies ReservationCancelDialogData,
          width: '480px',
        });
        ref.afterClosed().subscribe((reason) => {
          if (!reason) return;
          this.reservations.cancelReservation(id, { cancellation_reason: reason }).subscribe({
            next: () => {
              this.snackBar.open('Reserva cancelada', 'OK', { duration: 4000 });
              this.refresh();
            },
            error: (e) =>
              this.snackBar.open(
                (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
                'Cerrar',
                { duration: 7000 },
              ),
          });
        });
      },
    });
  }

  openDates(): void {
    const d = this.detail();
    if (!d) return;
    const ref = this.dialog.open(ReservationDatesFormComponent, {
      data: {
        date_start: String(d['date_start'] ?? ''),
        date_end: (d['date_end'] as string | null) ?? null,
      } satisfies ReservationDatesDialogData,
      width: '400px',
    });
    ref.afterClosed().subscribe((res) => {
      if (!res) return;
      this.reservations.updateReservationDates(this.reservationId(), res).subscribe({
        next: () => {
          this.snackBar.open('Fechas actualizadas', 'OK', { duration: 3000 });
          this.refresh();
        },
        error: (e) =>
          this.snackBar.open(
            (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
            'Cerrar',
            { duration: 7000 },
          ),
      });
    });
  }

  openAddOptional(): void {
    const ref = this.dialog.open(ReservationAddOptionalComponent, {
      data: {} satisfies ReservationAddOptionalData,
      width: '420px',
    });
    ref
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((body) => this.reservations.addOptionalToReservation(this.reservationId(), body)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Opcional agregado', 'OK', { duration: 3000 });
          this.refresh();
        },
        error: (e) =>
          this.snackBar.open(
            (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
            'Cerrar',
            { duration: 7000 },
          ),
      });
  }

  requestPaymentLink(): void {
    const d = this.detail();
    const id = this.reservationId();
    const amount = Number(d?.['total_amount'] ?? 0);
    if (!amount || amount <= 0) {
      this.snackBar.open('Monto inválido para pago', 'Cerrar', { duration: 5000 });
      return;
    }
    this.payments.createCheckout(id, amount).subscribe({
      next: (res: unknown) => {
        const url =
          (res as { data?: { init_point?: string; sandbox_init_point?: string } }).data?.init_point ??
          (res as { data?: { init_point?: string; sandbox_init_point?: string } }).data
            ?.sandbox_init_point ??
          null;
        if (url) {
          this.paymentUrl.set(url);
          this.snackBar.open('Preferencia creada', 'OK', { duration: 4000 });
        } else {
          this.snackBar.open('Respuesta sin URL de checkout', 'Cerrar', { duration: 6000 });
        }
      },
      error: (e) => {
        const code = (e as { status?: number })?.status;
        if (code === 403) {
          this.snackBar.open('Sin permiso para crear pago (solo ADMIN/AGENT)', 'Cerrar', { duration: 7000 });
        } else {
          this.snackBar.open(
            (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error de pago',
            'Cerrar',
            { duration: 7000 },
          );
        }
      },
    });
  }

  copyPaymentUrl(): void {
    const u = this.paymentUrl();
    if (!u) return;
    const ok = this.clipboard.copy(u);
    this.snackBar.open(ok ? 'Copiado al portapapeles' : 'No se pudo copiar', 'OK', { duration: 3000 });
  }
}
