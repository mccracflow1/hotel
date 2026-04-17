import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlansService } from './plans.service';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-plan-activities',
  standalone: true,
  imports: [DragDropModule, MatListModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div cdkDropList (cdkDropListDropped)="drop($event)">
      @for (a of activities(); track a.id) {
        <div cdkDrag class="row">
          <span class="handle" cdkDragHandle>≡</span>
          <span class="name">{{ a.name }}</span>
          <button mat-button type="button" (click)="remove(a.id)">Eliminar</button>
        </div>
      } @empty {
        <p>Sin actividades.</p>
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      cursor: move;
    }
    .handle {
      cursor: grab;
      user-select: none;
    }
    .name {
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanActivitiesComponent {
  readonly planId = input.required<string>();
  readonly changed = output<void>();

  private readonly plans = inject(PlansService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly activities = signal<{ id: string; name: string; sort_order?: number }[]>([]);

  constructor() {
    effect(() => {
      const id = this.planId();
      this.plans.getPlan(id).subscribe({
        next: (res: unknown) => {
          const acts = (res as { data?: { base_activities?: { id: string; name: string; sort_order?: number }[] } })
            .data?.base_activities ?? [];
          this.activities.set([...acts].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        },
      });
    });
  }

  drop(ev: CdkDragDrop<unknown>): void {
    const list = [...this.activities()];
    moveItemInArray(list, ev.previousIndex, ev.currentIndex);
    this.activities.set(list);
    const ordered = list.map((x) => x.id);
    this.plans.reorderActivities(this.planId(), ordered).subscribe({
      next: () => {
        this.snackBar.open('Orden actualizado', 'OK', { duration: 2500 });
        this.changed.emit();
      },
      error: (e) =>
        this.snackBar.open(
          (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
          'Cerrar',
          { duration: 6000 },
        ),
    });
  }

  remove(activityId: string): void {
    this.plans.getDeleteImpact(this.planId(), activityId).subscribe({
      next: (res: unknown) => {
        const cnt = (res as { data?: { count?: number } }).data?.count ?? 0;
        const ref = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: 'Eliminar actividad',
            message: `Reservas futuras afectadas (estimado): ${cnt}. ¿Eliminar? Tras confirmar se enviará cabecera de impacto.`,
            confirmLabel: 'Eliminar',
          } satisfies ConfirmDialogData,
        });
        ref.afterClosed().subscribe((ok) => {
          if (!ok) return;
          this.plans.deleteActivity(this.planId(), activityId, 'true').subscribe({
            next: () => {
              this.snackBar.open('Actividad eliminada', 'OK', { duration: 3000 });
              this.changed.emit();
            },
            error: (e) =>
              this.snackBar.open(
                (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
                'Cerrar',
                { duration: 7000 },
              ),
          });
        });
      },
      error: () => {
        this.snackBar.open('No se pudo calcular impacto', 'Cerrar', { duration: 5000 });
      },
    });
  }
}
