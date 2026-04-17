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

const STATUS_ORDER = ['CONFIRMED', 'PAYMENT_PENDING', 'PENDING', 'COMPLETED', 'CANCELLED'] as const;

const COLORS = [
  'color-mix(in srgb, var(--mat-sys-primary) 70%, transparent)',
  'color-mix(in srgb, var(--mat-sys-tertiary) 70%, transparent)',
  'color-mix(in srgb, var(--mat-sys-secondary) 70%, transparent)',
  '#9e9e9e',
  'color-mix(in srgb, var(--mat-sys-error) 45%, transparent)',
];

@Component({
  selector: 'app-occupancy-stacked-chart',
  standalone: true,
  template: `
    @if (hint(); as h) {
      <p class="muted">{{ h }}</p>
    }
    <div class="chart-host"><canvas></canvas></div>
  `,
  styles: `
    .chart-host {
      height: 280px;
      position: relative;
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OccupancyStackedChartComponent {
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
          const byDay = new Map<string, Record<string, number>>();
          for (const row of rows) {
            const raw = row['date_start'];
            const day = typeof raw === 'string' ? raw.slice(0, 10) : '';
            if (!day) continue;
            const st = String(row['status'] ?? 'UNKNOWN');
            if (!byDay.has(day)) byDay.set(day, {});
            const rec = byDay.get(day)!;
            rec[st] = (rec[st] ?? 0) + 1;
          }
          const labels = [...byDay.keys()].sort();
          const usedStatuses = STATUS_ORDER.filter((st) =>
            labels.some((d) => (byDay.get(d)![st] ?? 0) > 0),
          );
          if (!labels.length) {
            this.hint.set('Sin reservas en el rango para apilar por estado.');
            this.renderChart([], []);
            return;
          }
          this.hint.set(null);
          const datasets = usedStatuses.map((st, i) => ({
            label: st,
            data: labels.map((d) => byDay.get(d)![st] ?? 0),
            backgroundColor: COLORS[i % COLORS.length],
            stack: 'occ',
          }));
          this.renderChart(labels, datasets);
        },
        error: () => {
          this.hint.set('No se pudo cargar ocupación por estado.');
          this.renderChart([], []);
        },
      });
    });
  }

  private renderChart(labels: string[], datasets: { label: string; data: number[]; backgroundColor: string; stack: string }[]): void {
    queueMicrotask(() => {
      const canvas = this.host.nativeElement.querySelector('canvas');
      if (!canvas) return;
      this.chart?.destroy();
      this.chart = null;
      if (!labels.length || !datasets.length) {
        return;
      }
      const cfg: ChartConfiguration = {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
          },
        },
      };
      this.chart = new Chart(canvas, cfg);
    });
  }
}
