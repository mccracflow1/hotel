import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { PlansService } from './plans.service';
import { API_URL } from '../../core/tokens';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-plan-optionals-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  template: `
    <h4>Vincular opcional del catálogo</h4>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Opcional</mat-label>
      <mat-select [formControl]="catalogCtrl">
        @for (c of catalog(); track c.id) {
          <mat-option [value]="c.id">{{ c.name }} ({{ c.price }})</mat-option>
        }
      </mat-select>
    </mat-form-field>
    <mat-slide-toggle [formControl]="defaultCtrl">Pre-seleccionada</mat-slide-toggle>
    <button mat-flat-button color="primary" type="button" (click)="link()" [disabled]="!catalogCtrl.value">
      Vincular
    </button>

    <h4 class="mt">Vinculadas</h4>
    @for (o of linked(); track o.optional_activity_id) {
      <div class="row">
        <span>{{ o.name }} @if (o.is_default) { (pre) }</span>
        <button mat-button type="button" (click)="unlink(o.optional_activity_id)">Desvincular</button>
      </div>
    } @empty {
      <p class="muted">Ninguna.</p>
    }
  `,
  styles: `
    .full {
      width: 100%;
      margin: 0.5rem 0;
    }
    .mt {
      margin-top: 1.25rem;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanOptionalsSectionComponent {
  readonly planId = input.required<string>();
  readonly changed = output<void>();

  private readonly plans = inject(PlansService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly catalog = signal<{ id: string; name: string; price: number }[]>([]);
  readonly linked = signal<
    { optional_activity_id: string; name: string; price: number; is_default?: boolean }[]
  >([]);

  readonly catalogCtrl = new FormControl<string>('', { nonNullable: true });
  readonly defaultCtrl = new FormControl(false, { nonNullable: true });

  constructor() {
    effect(() => {
      const pid = this.planId();
      this.http.get<unknown>(`${this.apiUrl}/optional-activities`).subscribe({
        next: (res) => {
          const rows = (res as { data?: { id: string; name: string; price: number }[] }).data ?? [];
          this.catalog.set(rows.map((r) => ({ ...r, price: Number(r.price) })));
        },
      });
      this.reloadPlan(pid);
    });
  }

  private reloadPlan(pid: string): void {
    this.plans.getPlan(pid).subscribe({
      next: (res: unknown) => {
        const opts =
          (res as { data?: { optional_activities?: Record<string, unknown>[] } }).data
            ?.optional_activities ?? [];
        this.linked.set(
          opts.map((o) => ({
            optional_activity_id: String(o['optional_activity_id'] ?? o['id']),
            name: String(o['name'] ?? o['activity_name'] ?? ''),
            price: Number(o['price'] ?? 0),
            is_default: Boolean(o['is_default']),
          })),
        );
      },
    });
  }

  link(): void {
    const oid = this.catalogCtrl.value;
    if (!oid) return;
    this.plans
      .linkOptional(this.planId(), {
        optional_activity_id: oid,
        is_default: this.defaultCtrl.value,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Vinculada', 'OK', { duration: 2500 });
          this.catalogCtrl.setValue('');
          this.defaultCtrl.setValue(false);
          this.reloadPlan(this.planId());
          this.changed.emit();
        },
        error: (e) =>
          this.snackBar.open(
            (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
            'Cerrar',
            { duration: 6000 },
          ),
      });
  }

  unlink(optionalId: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desvincular opcional',
        message: '¿Quitar esta opcional del plan?',
        confirmLabel: 'Desvincular',
      } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.plans.removePlanOptionalLink(this.planId(), optionalId).subscribe({
        next: () => {
          this.snackBar.open('Desvinculada', 'OK', { duration: 2500 });
          this.reloadPlan(this.planId());
          this.changed.emit();
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
}
