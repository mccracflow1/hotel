import { HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { MediaLibraryService, type MediaRow } from './media-library.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { messageFromApiError } from '../../shared/http/api-error-message';

@Component({
  selector: 'app-media-library-page',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    ClipboardModule,
    MatIconModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Biblioteca de medios</mat-card-title>
      </mat-card-header>
      <mat-card-content class="stack">
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Buscar por nombre</mat-label>
            <input matInput [(ngModel)]="q" (ngModelChange)="onQChange()" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-type">
            <mat-label>Tipo</mat-label>
            <input matInput [(ngModel)]="fileType" placeholder="image | video" (ngModelChange)="reload()" />
          </mat-form-field>
          <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="uploadPct() !== null">
            Subir archivo
          </button>
          <input #fileInput type="file" hidden (change)="onFile($event)" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime" />
        </div>
        @if (uploadPct() !== null) {
          <mat-progress-bar mode="determinate" [value]="uploadPct() ?? 0" />
        }
        <table mat-table [dataSource]="rows()" class="tbl">
          <ng-container matColumnDef="preview">
            <th mat-header-cell *matHeaderCellDef>Vista</th>
            <td mat-cell *matCellDef="let row">
              @if (row.file_type === 'video') {
                <video [src]="row.original_url" width="72" height="48" controls preload="metadata"></video>
              } @else {
                <img [src]="row.thumbnail_url || row.original_url" alt="" width="72" height="48" class="thumb" />
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="filename">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let row">{{ row.filename }}</td>
          </ng-container>
          <ng-container matColumnDef="mime">
            <th mat-header-cell *matHeaderCellDef>MIME</th>
            <td mat-cell *matCellDef="let row">{{ row.mime_type }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef aria-label="Acciones"></th>
            <td mat-cell *matCellDef="let row">
              <button
                mat-icon-button
                type="button"
                aria-label="Copiar URL pública"
                matTooltip="Copiar URL"
                (click)="copyUrl(row)"
              >
                <mat-icon>content_copy</mat-icon>
              </button>
              <button
                mat-icon-button
                type="button"
                aria-label="Renombrar archivo"
                matTooltip="Renombrar"
                (click)="rename(row)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                type="button"
                aria-label="Eliminar archivo"
                matTooltip="Eliminar"
                (click)="confirmDelete(row)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <mat-paginator
          [length]="total()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex()"
          (page)="onPage($event)"
          showFirstLastButtons
        />
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }
    .grow {
      flex: 1 1 200px;
    }
    .w-type {
      width: 140px;
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
export class MediaLibraryPageComponent {
  private readonly svc = inject(MediaLibraryService);
  private readonly snack = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  private readonly dialog = inject(MatDialog);

  readonly cols = ['preview', 'filename', 'mime', 'actions'];
  readonly rows = signal<MediaRow[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = 20;
  readonly uploadPct = signal<number | null>(null);

  q = '';
  fileType = '';

  constructor() {
    this.reload();
  }

  onQChange(): void {
    this.pageIndex.set(0);
    this.reload();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.reload();
  }

  reload(): void {
    this.svc
      .list({
        q: this.q.trim() || undefined,
        file_type: this.fileType.trim() || undefined,
        page: this.pageIndex() + 1,
        limit: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data ?? []);
          this.total.set(res.meta?.total ?? 0);
        },
        error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
      });
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    this.uploadPct.set(0);
    this.svc.uploadWithProgress(f).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadPct.set(Math.round((100 * event.loaded) / event.total));
        }
        if (event.type === HttpEventType.Response) {
          this.uploadPct.set(null);
          this.snack.open('Archivo subido', 'OK', { duration: 3000 });
          this.reload();
        }
      },
      error: (e) => {
        this.uploadPct.set(null);
        this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 6000 });
      },
    });
  }

  copyUrl(row: MediaRow): void {
    this.clipboard.copy(row.original_url);
    this.snack.open('URL copiada', 'OK', { duration: 2500 });
  }

  rename(row: MediaRow): void {
    const name = window.prompt('Nuevo nombre de archivo', row.filename);
    if (!name || name === row.filename) return;
    this.svc.patchRename(row.id, name).subscribe({
      next: () => {
        this.snack.open('Renombrado', 'OK', { duration: 2500 });
        this.reload();
      },
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }

  confirmDelete(row: MediaRow): void {
    this.svc.getUsage(row.id).subscribe({
      next: (usage) => {
        const u = usage.data as { total?: number };
        const extra = u?.total ? ` Referencias: ${u.total}.` : '';
        const ref = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: 'Eliminar medio',
            message: `¿Eliminar ${row.filename}?${extra}`,
            confirmLabel: 'Eliminar',
          },
        });
        ref.afterClosed().subscribe((ok) => {
          if (!ok) return;
          this.svc.delete(row.id).subscribe({
            next: () => {
              this.snack.open('Eliminado', 'OK', { duration: 2500 });
              this.reload();
            },
            error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 6000 }),
          });
        });
      },
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }
}
