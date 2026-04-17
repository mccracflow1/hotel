import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth/auth.service';
import { AvailabilityService } from './availability.service';

@Component({
  selector: 'app-availability-page',
  standalone: true,
  imports: [
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
  ],
  templateUrl: './availability-page.component.html',
  styleUrl: './availability-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityPageComponent {
  private readonly svc = inject(AvailabilityService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly now = new Date();
  readonly year = signal(this.now.getFullYear());
  readonly month = signal(this.now.getMonth() + 1);
  readonly dias = signal<Record<string, unknown>[]>([]);
  readonly seasons = signal<Record<string, unknown>[]>([]);
  readonly loadingCal = signal(false);
  readonly loadingSeasons = signal(false);

  readonly canBlock = computed(() => {
    const r = this.auth.user()?.role;
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  });

  readonly blockForm = this.fb.nonNullable.group({
    room_id: [''],
    plan_id: [''],
    fecha_inicio: ['', Validators.required],
    fecha_fin: ['', Validators.required],
    slots_a_bloquear: [1, [Validators.required, Validators.min(1)]],
    motivo: ['', [Validators.required, Validators.minLength(3)]],
  });

  readonly seasonCols = ['name', 'date_start', 'date_end', 'price_multiplier'];

  constructor() {
    this.reloadCalendar();
    this.reloadSeasons();
  }

  prevMonth(): void {
    const m = this.month() - 1;
    if (m < 1) {
      this.month.set(12);
      this.year.update((y) => y - 1);
    } else {
      this.month.set(m);
    }
    this.reloadCalendar();
  }

  nextMonth(): void {
    const m = this.month() + 1;
    if (m > 12) {
      this.month.set(1);
      this.year.update((y) => y + 1);
    } else {
      this.month.set(m);
    }
    this.reloadCalendar();
  }

  reloadCalendar(): void {
    this.loadingCal.set(true);
    this.svc.getCalendar(this.year(), this.month()).subscribe({
      next: (res: unknown) => {
        const d = (res as { dias?: Record<string, unknown>[] }).dias ?? [];
        this.dias.set(d);
        this.loadingCal.set(false);
      },
      error: () => this.loadingCal.set(false),
    });
  }

  reloadSeasons(): void {
    this.loadingSeasons.set(true);
    this.svc.listSeasons().subscribe({
      next: (res: unknown) => {
        const rows = (res as { temporadas?: Record<string, unknown>[] }).temporadas ?? [];
        this.seasons.set(rows);
        this.loadingSeasons.set(false);
      },
      error: () => this.loadingSeasons.set(false),
    });
  }

  pct(d: Record<string, unknown>): number {
    return Number(d['porcentaje_ocupacion'] ?? 0);
  }

  submitBlock(): void {
    if (this.blockForm.invalid || !this.canBlock()) return;
    const raw = this.blockForm.getRawValue();
    const body = {
      fecha_inicio: raw.fecha_inicio,
      fecha_fin: raw.fecha_fin,
      slots_a_bloquear: raw.slots_a_bloquear,
      motivo: raw.motivo,
      room_id: raw.room_id || null,
      plan_id: raw.plan_id || null,
    };
    if (!body.room_id && !body.plan_id) {
      return;
    }
    this.svc.blockDates(body).subscribe({
      next: () => {
        this.blockForm.reset({ slots_a_bloquear: 1, room_id: '', plan_id: '' });
        this.reloadCalendar();
      },
    });
  }
}
