import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { HasRoleDirective } from '../../shared/auth/has-role.directive';
import { RoomsService } from './rooms.service';

@Component({
  selector: 'app-rooms-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    HasRoleDirective,
  ],
  templateUrl: './rooms-list.component.html',
  styleUrl: './rooms-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomsListComponent {
  private readonly rooms = inject(RoomsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(true);
  readonly displayedColumns = ['name', 'type', 'base_price', 'is_active'];

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.reload();
      });
    this.reload();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.rooms.listRooms({ q: this.search.value || undefined }).subscribe({
      next: (res: unknown) => {
        const data = (res as { data?: Record<string, unknown>[] }).data ?? [];
        this.total.set(data.length);
        const start = this.pageIndex() * this.pageSize();
        this.rows.set(data.slice(start, start + this.pageSize()));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
