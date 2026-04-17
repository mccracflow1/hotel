import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { UsersAdminService, type PortalUserRow } from './users-admin.service';
import { UserCreateDialogComponent, type UserCreateDialogData } from './user-create-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { messageFromApiError } from '../../shared/http/api-error-message';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card>
      <mat-card-header class="hdr">
        <mat-card-title>Usuarios del portal</mat-card-title>
        <button mat-flat-button color="primary" type="button" (click)="openCreate()">Nuevo usuario</button>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="rows()" class="tbl">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let u">{{ u.name }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let u">{{ u.role }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Activo</th>
            <td mat-cell *matCellDef="let u">
              <mat-slide-toggle
                [checked]="u.is_active"
                [disabled]="!canToggle(u)"
                (change)="onActiveChange(u, $event.checked)"
              />
            </td>
          </ng-container>
          <ng-container matColumnDef="last">
            <th mat-header-cell *matHeaderCellDef>Último acceso</th>
            <td mat-cell *matCellDef="let u">{{ u.last_login_at || '—' }}</td>
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
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .tbl {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  private readonly users = inject(UsersAdminService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly cols = ['name', 'email', 'role', 'active', 'last'];
  readonly rows = signal<PortalUserRow[]>([]);
  readonly actorRole = computed(() => this.auth.user()?.role);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.users.list().subscribe({
      next: (r) => this.rows.set(r.data ?? []),
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }

  canToggle(u: PortalUserRow): boolean {
    const me = this.auth.user();
    if (!me) return false;
    if (String(u.id) === String(me.id)) return false;
    if (u.role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN') return false;
    return me.role === 'ADMIN' || me.role === 'SUPER_ADMIN';
  }

  onActiveChange(u: PortalUserRow, active: boolean): void {
    if (active === u.is_active) return;
    const go = () =>
      this.users.patchStatus(u.id, active).subscribe({
        next: () => this.reload(),
        error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 6000 }),
      });
    if (!active) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Desactivar usuario',
          message: `Se desactivará el acceso de ${u.name} (${u.email}). ¿Confirmás?`,
          confirmLabel: 'Desactivar',
        },
      });
      ref.afterClosed().subscribe((ok) => {
        if (ok) go();
        else this.reload();
      });
    } else {
      go();
    }
  }

  openCreate(): void {
    const role = this.actorRole();
    if (!role) return;
    const ref = this.dialog.open(UserCreateDialogComponent, {
      data: { actorRole: role } satisfies UserCreateDialogData,
      width: '480px',
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.reload();
    });
  }
}
