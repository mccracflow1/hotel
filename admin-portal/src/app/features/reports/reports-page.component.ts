import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { downloadExcelRows } from '../../shared/export/excel-export';
import { downloadPdfTable } from '../../shared/export/pdf-export';
import { ReportsService, type ReportDateRange } from './reports.service';
import { OccupancyStackedChartComponent } from './occupancy-stacked-chart.component';
import { RevenuePieChartComponent } from './revenue-pie-chart.component';
import { PlanPerformanceSectionComponent } from './plan-performance-section.component';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): ReportDateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { from: isoDate(start), to: isoDate(end) };
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    OccupancyStackedChartComponent,
    RevenuePieChartComponent,
    PlanPerformanceSectionComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Reportes</mat-card-title>
      </mat-card-header>
      <mat-card-content class="filters">
        <mat-form-field appearance="outline" class="f">
          <mat-label>Desde</mat-label>
          <input matInput type="date" [value]="from()" (change)="onFrom($event)" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="f">
          <mat-label>Hasta</mat-label>
          <input matInput type="date" [value]="to()" (change)="onTo($event)" />
        </mat-form-field>
        <button mat-flat-button color="primary" type="button" (click)="apply()">Aplicar rango</button>
        <button mat-stroked-button type="button" [disabled]="exporting()" (click)="exportExcel()">
          Excel (reservas)
        </button>
        <button mat-stroked-button type="button" [disabled]="exporting()" (click)="exportPdf()">
          PDF (reservas)
        </button>
        @if (exporting()) {
          <mat-spinner diameter="26" />
        }
      </mat-card-content>
    </mat-card>

    <mat-card class="mt">
      <mat-card-header>
        <mat-card-title>Totales del rango</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>
          Ingresos (reservas en estados reportados):
          <strong>{{ revenueTotal() }}</strong>
        </p>
        <p class="muted">Los gráficos usan el mismo rango aplicado.</p>
      </mat-card-content>
    </mat-card>

    @if (appliedRange(); as ar) {
      <div class="grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Ocupación apilada por estado</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-occupancy-stacked-chart [range]="ar" />
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header>
            <mat-card-title>Ingresos por plan (pie)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-revenue-pie-chart [range]="ar" />
          </mat-card-content>
        </mat-card>
      </div>
      <app-plan-performance-section class="mt" [range]="ar" />
    }
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }
    .f {
      width: 160px;
    }
    .mt {
      margin-top: 1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPageComponent {
  private readonly reports = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly from = signal(defaultRange().from);
  readonly to = signal(defaultRange().to);
  readonly appliedRange = signal<ReportDateRange>(defaultRange());
  readonly revenueTotal = signal('—');
  readonly exporting = signal(false);

  constructor() {
    this.loadRevenue();
  }

  onFrom(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) this.from.set(v);
  }

  onTo(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) this.to.set(v);
  }

  apply(): void {
    this.appliedRange.set({ from: this.from(), to: this.to() });
    this.loadRevenue();
  }

  private loadRevenue(): void {
    const r = this.appliedRange();
    this.reports.revenue(r).subscribe({
      next: (res) => {
        const amt = (res as { data?: { total_amount?: number } })?.data?.total_amount;
        this.revenueTotal.set(amt != null ? String(amt) : '—');
      },
      error: () => this.revenueTotal.set('—'),
    });
  }

  exportExcel(): void {
    const r = this.appliedRange();
    this.exporting.set(true);
    this.reports.reservations(r).subscribe({
      next: async (res) => {
        const rows = (res as { data?: Record<string, unknown>[] }).data ?? [];
        const cols = [
          { header: 'Número', key: 'reservation_number' },
          { header: 'Cliente', key: 'customer_name' },
          { header: 'Inicio', key: 'date_start' },
          { header: 'Estado', key: 'status' },
          { header: 'Monto', key: 'total_amount' },
        ];
        try {
          await downloadExcelRows(`reporte-reservas-${r.from}_${r.to}`, 'Reservas', cols, rows);
        } catch {
          this.snackBar.open('Error al generar Excel', 'Cerrar', { duration: 5000 });
        }
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
        this.snackBar.open('No se pudieron leer reservas para exportar', 'Cerrar', { duration: 5000 });
      },
    });
  }

  exportPdf(): void {
    const r = this.appliedRange();
    this.exporting.set(true);
    this.reports.reservations(r).subscribe({
      next: (res) => {
        const rows = (res as { data?: Record<string, unknown>[] }).data ?? [];
        const cols = [
          { header: 'Número', key: 'reservation_number' },
          { header: 'Cliente', key: 'customer_name' },
          { header: 'Inicio', key: 'date_start' },
          { header: 'Estado', key: 'status' },
          { header: 'Monto', key: 'total_amount' },
        ];
        try {
          downloadPdfTable(
            `reporte-reservas-${r.from}_${r.to}.pdf`,
            `Reservas ${r.from} — ${r.to}`,
            cols,
            rows.slice(0, 80),
          );
        } catch {
          this.snackBar.open('Error al generar PDF', 'Cerrar', { duration: 5000 });
        }
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
        this.snackBar.open('No se pudieron leer reservas para exportar', 'Cerrar', { duration: 5000 });
      },
    });
  }
}
