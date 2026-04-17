import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, interval, map, of, startWith, switchMap } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService } from './dashboard.service';

Chart.register(...registerables);

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function last7Range(): { from: string; to: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { from: isoDate(start), to: isoDate(end) };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly svc = inject(DashboardService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly kpiToday = signal<{ ok: boolean; value: string; hint?: string }>({
    ok: false,
    value: '—',
  });
  readonly kpiOccupancy = signal<{ ok: boolean; value: string; hint?: string }>({
    ok: false,
    value: '—',
  });
  readonly kpiRevenue = signal<{ ok: boolean; value: string; hint?: string }>({
    ok: false,
    value: '—',
  });
  readonly kpiInventory = signal<{ ok: boolean; value: string; hint?: string }>({
    ok: false,
    value: '—',
  });
  readonly chartLabels = signal<string[]>([]);
  readonly chartValues = signal<number[]>([]);
  readonly upcoming = signal<Record<string, unknown>[]>([]);
  readonly upcomingColumns = ['reservation_number', 'date_start', 'status', 'total_amount'];

  private chart: Chart | null = null;

  constructor() {
    interval(30_000)
      .pipe(startWith(0), takeUntilDestroyed(), switchMap(() => this.loadSnapshot()))
      .subscribe();

    afterNextRender(() => {
      this.destroyRef.onDestroy(() => this.chart?.destroy());
    });
  }

  private loadSnapshot() {
    const today = isoDate(new Date());
    const range7 = last7Range();
    const revRange = { from: monthStart(), to: today };

    return forkJoin({
      todayRes: this.svc
        .fetchReservationsPage({
          date_from: today,
          date_to: today,
          page: 1,
          limit: 1,
        })
        .pipe(
          map((r: unknown) => r as { meta?: { total?: number } }),
          map((r) => ({ ok: true as const, value: String(r.meta?.total ?? 0) })),
          catchError((e) => of({ ok: false as const, value: '—', hint: String(e?.message ?? 'Error') })),
        ),
      occ: this.svc.fetchOccupancyReport(range7).pipe(
        map((r: unknown) => r as { data?: { period?: string; cnt?: number }[] }),
        map((r) => {
          const rows = r.data ?? [];
          const labels = rows.map((x) => String(x.period ?? '').slice(0, 10));
          const values = rows.map((x) => Number(x.cnt ?? 0));
          const sum = values.reduce((a, b) => a + b, 0);
          return { ok: true as const, value: String(sum), labels, values };
        }),
        catchError((e) =>
          of({
            ok: false as const,
            value: '—',
            hint: String(e?.message ?? 'Error'),
            labels: [] as string[],
            values: [] as number[],
          }),
        ),
      ),
      rev: this.svc.fetchRevenueReport(revRange).pipe(
        map((r: unknown) => r as { data?: { total_amount?: number } }),
        map((r) => ({
          ok: true as const,
          value: String(r.data?.total_amount ?? 0),
        })),
        catchError((e) => of({ ok: false as const, value: '—', hint: String(e?.message ?? 'Error') })),
      ),
      inv: this.svc.fetchInventoryReport(range7).pipe(
        map((r: unknown) => r as { data?: unknown[]; meta?: { balances?: unknown } }),
        map((r) => ({
          ok: true as const,
          value: String((r.data as unknown[])?.length ?? 0),
        })),
        catchError((e) => of({ ok: false as const, value: '—', hint: String(e?.message ?? 'Error') })),
      ),
      upcoming: this.svc
        .fetchReservationsPage({ page: 1, limit: 8, date_from: today })
        .pipe(
          map((r: unknown) => r as { data?: Record<string, unknown>[] }),
          map((r) => r.data ?? []),
          catchError(() => of([] as Record<string, unknown>[])),
        ),
    }).pipe(
      map((res) => {
        this.kpiToday.set(
          res.todayRes.ok
            ? { ok: true, value: res.todayRes.value }
            : { ok: false, value: res.todayRes.value, hint: res.todayRes.hint },
        );
        this.kpiOccupancy.set(
          res.occ.ok
            ? { ok: true, value: res.occ.value }
            : { ok: false, value: res.occ.value, hint: res.occ.hint },
        );
        if (res.occ.ok && 'labels' in res.occ) {
          this.chartLabels.set(res.occ.labels);
          this.chartValues.set(res.occ.values);
        }
        this.kpiRevenue.set(
          res.rev.ok
            ? { ok: true, value: res.rev.value }
            : { ok: false, value: res.rev.value, hint: res.rev.hint },
        );
        this.kpiInventory.set(
          res.inv.ok
            ? { ok: true, value: res.inv.value }
            : { ok: false, value: res.inv.value, hint: res.inv.hint },
        );
        this.upcoming.set(res.upcoming);
        this.loading.set(false);
        queueMicrotask(() => this.drawChart());
        return res;
      }),
      catchError(() => {
        this.loading.set(false);
        return of(null);
      }),
    );
  }

  private drawChart(): void {
    const canvas = this.host.nativeElement.querySelector('canvas');
    if (!canvas) return;
    const labels = this.chartLabels();
    const values = this.chartValues();
    if (!labels.length) {
      this.chart?.destroy();
      this.chart = null;
      return;
    }
    this.chart?.destroy();
    const cfg: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Reservas por día',
            data: values,
            backgroundColor: 'color-mix(in srgb, var(--mat-sys-primary) 50%, transparent)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    };
    this.chart = new Chart(canvas, cfg);
  }
}
