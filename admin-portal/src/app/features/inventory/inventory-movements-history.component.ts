import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'app-inventory-movements-history',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h4>Historial por ítem</h4>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Ítem</mat-label>
      <mat-select [formControl]="itemCtrl">
        <mat-option value="">— Elegí un ítem —</mat-option>
        @for (it of items(); track it.id) {
          <mat-option [value]="it.id">{{ it.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
    @if (loading()) {
      <mat-spinner diameter="32" />
    } @else if (itemCtrl.value) {
      <table mat-table [dataSource]="movements()" class="table">
        <ng-container matColumnDef="created_at">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let row">{{ row.created_at }}</td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Tipo</th>
          <td mat-cell *matCellDef="let row">{{ row.type }}</td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Cantidad</th>
          <td mat-cell *matCellDef="let row">{{ row.quantity }}</td>
        </ng-container>
        <ng-container matColumnDef="notes">
          <th mat-header-cell *matHeaderCellDef>Notas</th>
          <td mat-cell *matCellDef="let row">{{ row.notes || '—' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
    }
  `,
  styles: `
    .full {
      width: 100%;
      margin-bottom: 0.75rem;
    }
    .table {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryMovementsHistoryComponent {
  private readonly svc = inject(InventoryService);
  private readonly snackBar = inject(MatSnackBar);

  readonly itemCtrl = new FormControl<string>('', { nonNullable: true });
  readonly items = signal<{ id: string; name: string }[]>([]);
  readonly movements = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly cols = ['created_at', 'type', 'quantity', 'notes'];

  constructor() {
    this.svc.listItems(true).subscribe({
      next: (res) => {
        const data = (res as { data?: Record<string, unknown>[] }).data ?? [];
        this.items.set(data.map((r) => ({ id: String(r['id']), name: String(r['name']) })));
      },
    });
    this.itemCtrl.valueChanges.subscribe((id) => {
      if (!id) {
        this.movements.set([]);
        return;
      }
      this.loading.set(true);
      this.svc.getMovements(id, { limit: 100 }).subscribe({
        next: (res) => {
          const data = (res as { data?: Record<string, unknown>[] }).data ?? [];
          this.movements.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('No se pudo cargar el historial', 'Cerrar', { duration: 5000 });
        },
      });
    });
  }
}
