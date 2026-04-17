import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ReportsService, type ReportDateRange } from './reports.service';

@Component({
  selector: 'app-plan-performance-section',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Desempeño de planes</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <p>Cargando…</p>
        } @else if (message()) {
          <p class="warn">{{ message() }}</p>
        } @else if (payload()) {
          <pre class="pre">{{ payload() }}</pre>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .warn {
      color: var(--mat-sys-error);
    }
    .pre {
      white-space: pre-wrap;
      font-size: 0.85rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanPerformanceSectionComponent {
  private readonly reports = inject(ReportsService);

  readonly range = input.required<ReportDateRange>();

  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly payload = signal<string | null>(null);

  constructor() {
    effect(() => {
      const r = this.range();
      this.loading.set(true);
      this.message.set(null);
      this.payload.set(null);
      this.reports.planPerformance(r).subscribe({
        next: (body) => {
          this.loading.set(false);
          this.payload.set(JSON.stringify(body, null, 2));
        },
        error: (e: unknown) => {
          this.loading.set(false);
          const status = e instanceof HttpErrorResponse ? e.status : (e as { status?: number })?.status;
          if (status === 404 || status === 501) {
            this.message.set(
              'El backend aún no expone agregados de desempeño de planes (reservas por plan, opcionales más elegidas, ingreso promedio). Cuando exista `GET /reports/plans-performance`, esta sección mostrará datos reales (FR-020 / SC-004).',
            );
          } else {
            this.message.set('No se pudo consultar el reporte de planes. Revisá la consola de red.');
          }
        },
      });
    });
  }
}
