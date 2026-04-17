import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ReportsService, type ReportDateRange } from './reports.service';

Chart.register(...registerables);

@Component({
  selector: 'app-revenue-pie-chart',
  standalone: true,
  template: `
    @if (hint(); as h) {
      <p class="muted">{{ h }}</p>
    }
    <div class="chart-host"><canvas></canvas></div>
  `,
  styles: `
    .chart-host {
      height: 260px;
      position: relative;
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenuePieChartComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly reports = inject(ReportsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly range = input.required<ReportDateRange>();

  private chart: Chart | null = null;
  readonly hint = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      this.destroyRef.onDestroy(() => this.chart?.destroy());
    });

    effect(() => {
      const r = this.range();
      this.reports.reservations(r).subscribe({
        next: (res) => {
          const rows = (res as { data?: Record<string, unknown>[] }).data ?? [];
          const byPlan = new Map<string, number>();
          for (const row of rows) {
            const pid = row['plan_id'] ? String(row['plan_id']) : 'room';
            const amt = Number(row['total_amount'] ?? 0);
            byPlan.set(pid, (byPlan.get(pid) ?? 0) + amt);
          }
          const labels: string[] = [];
          const data: number[] = [];
          for (const [k, v] of byPlan) {
            labels.push(k === 'room' ? 'Solo habitación' : `Plan ${k.slice(0, 8)}…`);
            data.push(v);
          }
          if (!data.length) {
            this.hint.set('Sin montos en reservas del rango.');
            this.renderPie([], []);
            return;
          }
          this.hint.set(null);
          this.renderPie(labels, data);
        },
        error: () => {
          this.hint.set('No se pudo armar el reparto por plan.');
          this.renderPie([], []);
        },
      });
    });
  }

  private renderPie(labels: string[], data: number[]): void {
    queueMicrotask(() => {
      const canvas = this.host.nativeElement.querySelector('canvas');
      if (!canvas) return;
      this.chart?.destroy();
      if (!labels.length) {
        this.chart = null;
        return;
      }
      const cfg: ChartConfiguration = {
        type: 'pie',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: [
                'color-mix(in srgb, var(--mat-sys-primary) 65%, white)',
                'color-mix(in srgb, var(--mat-sys-secondary) 65%, white)',
                'color-mix(in srgb, var(--mat-sys-tertiary) 65%, white)',
                '#b0bec5',
                '#cfd8dc',
                '#90a4ae',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } },
        },
      };
      this.chart = new Chart(canvas, cfg);
    });
  }
}
