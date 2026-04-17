import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PlansService } from './plans.service';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <mat-card>
      <mat-card-header class="hdr">
        <mat-card-title>Planes</mat-card-title>
        <a mat-flat-button color="primary" routerLink="/admin/plans/new">Nuevo plan</a>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <mat-spinner />
        } @else {
          <table mat-table [dataSource]="rows()" class="table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>
            <ng-container matColumnDef="base_price">
              <th mat-header-cell *matHeaderCellDef>Precio</th>
              <td mat-cell *matCellDef="let row">{{ row.base_price }}</td>
            </ng-container>
            <ng-container matColumnDef="is_active">
              <th mat-header-cell *matHeaderCellDef>Activo</th>
              <td mat-cell *matCellDef="let row">{{ row.is_active ? 'Sí' : 'No' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <a mat-button [routerLink]="['/admin/plans', row.id, 'edit']">Editar</a>
                <button mat-button type="button" (click)="clone(row.id)">Duplicar</button>
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
export class PlansListComponent {
  private readonly plans = inject(PlansService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly cols = ['name', 'base_price', 'is_active', 'actions'];

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.plans.listPlans(true).subscribe({
      next: (res: unknown) => {
        this.rows.set((res as { data?: Record<string, unknown>[] }).data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clone(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Duplicar plan',
        message: 'Se creará una copia del plan. ¿Continuar?',
        confirmLabel: 'Duplicar',
      } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      const name = `Copia ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
      this.plans.postClone(id, name).subscribe({
        next: (res: unknown) => {
          const nid = (res as { data?: { id?: string } }).data?.id;
          this.snackBar.open('Plan duplicado', 'OK', { duration: 4000 });
          if (nid) void this.router.navigate(['/admin/plans', nid, 'edit']);
          else this.reload();
        },
        error: (e) =>
          this.snackBar.open(
            (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
            'Cerrar',
            { duration: 6000 },
          ),
      });
    });
  }
}
