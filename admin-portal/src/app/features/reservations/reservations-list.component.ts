import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { HasRoleDirective } from '../../shared/auth/has-role.directive';
import { catchError, debounceTime, distinctUntilChanged, forkJoin, of } from 'rxjs';
import { downloadCsv, type CsvColumn } from '../../shared/export/csv-export';
import { downloadExcelRows } from '../../shared/export/excel-export';
import { ReservationsService, type ReservationListParams } from './reservations.service';

const EXPORT_WARN_ROWS = 200;

export type ReservationRow = Record<string, unknown> & {
  id?: string;
  reservation_number?: string;
  customer_name?: string;
  date_start?: string;
  date_end?: string | null;
  status?: string;
  total_amount?: number;
  plan_id?: string | null;
  room_id?: string | null;
};

@Component({
  selector: 'app-reservations-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
    HasRoleDirective,
  ],
  templateUrl: './reservations-list.component.html',
  styleUrl: './reservations-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsListComponent {
  private readonly reservations = inject(ReservationsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  readonly detailOpened = output<string>();

  readonly statusCtrl = new FormControl<string>('', { nonNullable: true });
  readonly dateFromCtrl = new FormControl<string>('', { nonNullable: true });
  readonly dateToCtrl = new FormControl<string>('', { nonNullable: true });
  readonly roomCtrl = new FormControl<string>('', { nonNullable: true });
  readonly planCtrl = new FormControl<string>('', { nonNullable: true });
  readonly qCtrl = new FormControl<string>('', { nonNullable: true });

  readonly rows = signal<ReservationRow[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly roomOptions = signal<{ id: string; label: string }[]>([]);
  readonly planOptions = signal<{ id: string; label: string }[]>([]);

  readonly displayedColumns = [
    'reservation_number',
    'customer_name',
    'service',
    'date_start',
    'date_end',
    'status',
    'total_amount',
    'actions',
  ];

  constructor() {
    this.loadFilterOptions();
    const reloadDebounced = () => {
      this.pageIndex.set(0);
      this.reload();
    };
    for (const c of [
      this.statusCtrl,
      this.dateFromCtrl,
      this.dateToCtrl,
      this.roomCtrl,
      this.planCtrl,
    ]) {
      c.valueChanges.pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() =>
        reloadDebounced(),
      );
    }
    this.qCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => reloadDebounced());
    this.reload();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.reload();
  }

  openRow(row: ReservationRow): void {
    const id = row.id;
    if (id) this.detailOpened.emit(id);
  }

  exportCsv(): void {
    void this.runExport('csv');
  }

  exportExcel(): void {
    void this.runExport('xlsx');
  }

  private loadFilterOptions(): void {
    forkJoin({
      rooms: this.reservations.listRoomsForFilter().pipe(catchError(() => of({ data: [] }))),
      plans: this.reservations.listPlansForFilter().pipe(catchError(() => of({ data: [] }))),
    }).subscribe({
      next: ({ rooms, plans }) => {
        const rdata = (rooms as { data?: { id: string; name: string }[] }).data ?? [];
        this.roomOptions.set(rdata.map((r) => ({ id: r.id, label: r.name })));
        const pdata = (plans as { data?: { id: string; name: string }[] }).data ?? [];
        this.planOptions.set(pdata.map((p) => ({ id: p.id, label: p.name })));
      },
    });
  }

  reload(): void {
    this.loading.set(true);
    const params = this.buildParams();
    this.reservations.listReservations(params).subscribe({
      next: (res: unknown) => {
        const body = res as { data?: ReservationRow[]; meta?: { total?: number } };
        this.rows.set(body.data ?? []);
        this.total.set(body.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildParams(): ReservationListParams {
    const p: ReservationListParams = {
      page: this.pageIndex() + 1,
      limit: this.pageSize(),
    };
    const st = this.statusCtrl.value;
    if (st) p.status = st;
    if (this.dateFromCtrl.value) p.date_from = this.dateFromCtrl.value;
    if (this.dateToCtrl.value) p.date_to = this.dateToCtrl.value;
    const rid = this.roomCtrl.value;
    if (rid) p.room_id = rid;
    const pid = this.planCtrl.value;
    if (pid) p.plan_id = pid;
    const q = this.qCtrl.value.trim();
    if (q) p.q = q;
    return p;
  }

  private async runExport(kind: 'csv' | 'xlsx'): Promise<void> {
    const params = { ...this.buildParams(), page: 1, limit: 5000 };
    const countHint = this.total();
    if (countHint > EXPORT_WARN_ROWS) {
      this.snackBar.open(
        'Exportando un conjunto grande: puede tardar unos segundos…',
        'Cerrar',
        { duration: 8000 },
      );
    }
    this.exporting.set(true);
    this.reservations.listReservations(params).subscribe({
      next: async (res: unknown) => {
        const data = ((res as { data?: ReservationRow[] }).data ?? []) as ReservationRow[];
        const columns: CsvColumn<ReservationRow>[] = [
          { key: 'reservation_number', header: 'Número' },
          { key: 'customer_name', header: 'Cliente' },
          { key: 'date_start', header: 'Inicio' },
          { key: 'date_end', header: 'Fin' },
          { key: 'status', header: 'Estado' },
          { key: 'total_amount', header: 'Monto' },
        ];
        const base = `reservas-filtradas-${new Date().toISOString().slice(0, 10)}`;
        try {
          if (kind === 'csv') {
            downloadCsv(`${base}.csv`, data, columns);
          } else {
            await downloadExcelRows(
              `${base}.xlsx`,
              'Reservas',
              columns.map((c) => ({ header: c.header, key: c.key })),
              data as Record<string, unknown>[],
            );
          }
        } finally {
          this.exporting.set(false);
        }
      },
      error: () => {
        this.exporting.set(false);
        this.snackBar.open('No se pudo exportar. Revisá la sesión y el API.', 'Cerrar', { duration: 6000 });
      },
    });
  }
}
