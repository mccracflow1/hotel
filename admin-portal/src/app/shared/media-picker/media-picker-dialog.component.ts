import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MediaLibraryService, type MediaRow } from '../../features/media-library/media-library.service';

@Component({
  selector: 'app-media-picker-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatTableModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Elegir medio</h2>
    <mat-dialog-content class="dlg">
      @if (loading()) {
        <mat-spinner diameter="36" />
      } @else {
        <table mat-table [dataSource]="rows()" class="tbl">
          <ng-container matColumnDef="thumb">
            <th mat-header-cell *matHeaderCellDef>Miniatura</th>
            <td mat-cell *matCellDef="let row">
              @if (row.thumbnail_url || row.original_url) {
                <img [src]="row.thumbnail_url || row.original_url" alt="" width="48" height="48" class="thumb" />
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="filename">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let row">{{ row.filename }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let row">{{ row.file_type }}</td>
          </ng-container>
          <ng-container matColumnDef="act">
            <th mat-header-cell *matHeaderCellDef aria-label="Acción"></th>
            <td mat-cell *matCellDef="let row">
              <button type="button" mat-flat-button color="primary" (click)="pick(row)">Usar</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .dlg {
      min-width: 420px;
      min-height: 120px;
    }
    .tbl {
      width: 100%;
    }
    .thumb {
      object-fit: cover;
      border-radius: 4px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaPickerDialogComponent {
  private readonly media = inject(MediaLibraryService);
  private readonly ref = inject(MatDialogRef<MediaPickerDialogComponent, MediaRow | undefined>);

  readonly cols = ['thumb', 'filename', 'type', 'act'];
  readonly rows = signal<MediaRow[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.media.list({ page: 1, limit: 50 }).subscribe({
      next: (res) => {
        this.rows.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  pick(row: MediaRow): void {
    this.ref.close(row);
  }
}
