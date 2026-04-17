import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { HasRoleDirective } from '../../shared/auth/has-role.directive';
import { InventoryService } from './inventory.service';
import { InventoryItemFormComponent, type InventoryItemFormData } from './inventory-item-form.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    HasRoleDirective,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          <span
            [matBadge]="alertCount()"
            [matBadgeHidden]="alertCount() === 0"
            matBadgeOverlap="false"
            matBadgeColor="warn"
            >Ítems de inventario</span>
        </mat-card-title>
        <button
          *appHasRole="['SUPER_ADMIN', 'ADMIN']"
          mat-flat-button
          color="primary"
          type="button"
          aria-label="Crear ítem de inventario"
          (click)="openForm(null)"
        >
          Nuevo ítem
        </button>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <mat-spinner diameter="36" />
        } @else {
          <table mat-table [dataSource]="rows()" class="table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Categoría</th>
              <td mat-cell *matCellDef="let row">{{ row.category }}</td>
            </ng-container>
            <ng-container matColumnDef="unit">
              <th mat-header-cell *matHeaderCellDef>Unidad</th>
              <td mat-cell *matCellDef="let row">{{ row.unit }}</td>
            </ng-container>
            <ng-container matColumnDef="current_stock">
              <th mat-header-cell *matHeaderCellDef>Stock</th>
              <td mat-cell *matCellDef="let row">{{ row.current_stock }}</td>
            </ng-container>
            <ng-container matColumnDef="min_stock">
              <th mat-header-cell *matHeaderCellDef>Mínimo</th>
              <td mat-cell *matCellDef="let row">{{ row.min_stock }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button
                  *appHasRole="['SUPER_ADMIN', 'ADMIN']"
                  mat-button
                  type="button"
                  aria-label="Editar ítem de inventario"
                  (click)="openForm(row); $event.stopPropagation()"
                >
                  Editar
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .table {
      width: 100%;
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  private readonly svc = inject(InventoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly cols = ['name', 'category', 'unit', 'current_stock', 'min_stock', 'actions'];
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly alertCount = signal(0);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.svc.listItems(true).subscribe({
      next: (res) => {
        const data = (res as { data?: Record<string, unknown>[] }).data ?? [];
        this.rows.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudo cargar inventario', 'Cerrar', { duration: 5000 });
      },
    });
    this.svc.getAlerts().subscribe({
      next: (res) => {
        const data = (res as { data?: unknown[] }).data ?? [];
        this.alertCount.set(data.length);
      },
      error: () => this.alertCount.set(0),
    });
  }

  openForm(row: Record<string, unknown> | null): void {
    const ref = this.dialog.open(InventoryItemFormComponent, {
      width: '480px',
      data: { item: row } satisfies InventoryItemFormData,
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (ok) this.reload();
      });
  }
}
