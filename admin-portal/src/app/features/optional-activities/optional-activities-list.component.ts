import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { OptionalActivitiesService } from './optional-activities.service';

@Component({
  selector: 'app-optional-activities-list',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    FormsModule,
  ],
  template: `
    <mat-card>
      <mat-card-header class="hdr">
        <mat-card-title>Opcionales (catálogo)</mat-card-title>
        <a mat-flat-button color="primary" routerLink="/admin/optional-activities/new">Nuevo</a>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="rows()" class="table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Precio</th>
            <td mat-cell *matCellDef="let row">{{ row.price }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Activo</th>
            <td mat-cell *matCellDef="let row">
              <mat-slide-toggle
                [ngModel]="row.is_active"
                (ngModelChange)="toggle(row, $event)"
                aria-label="Activo"
              />
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <a mat-button [routerLink]="['/admin/optional-activities', row.id, 'edit']">Editar</a>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .table {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionalActivitiesListComponent {
  private readonly svc = inject(OptionalActivitiesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly cols = ['name', 'price', 'active', 'actions'];

  constructor() {
    this.reload();
  }

  reload(): void {
    this.svc.list().subscribe({
      next: (res: unknown) => this.rows.set((res as { data?: Record<string, unknown>[] }).data ?? []),
    });
  }

  toggle(row: Record<string, unknown>, active: boolean): void {
    const id = String(row['id']);
    this.svc.patch(id, { is_active: active }).subscribe({
      next: () => this.reload(),
      error: (e) => {
        this.snackBar.open(
          (e as { error?: { error?: { message?: string } } })?.error?.error?.message ??
            'No se pudo actualizar (p. ej. reservas futuras con esta opcional).',
          'Cerrar',
          { duration: 8000 },
        );
        this.reload();
      },
    });
  }
}
