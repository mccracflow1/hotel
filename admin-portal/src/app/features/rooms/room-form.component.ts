import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RoomsService } from './rooms.service';
import { ToastService } from '../../shared/ui/toast.service';
import { MediaPickerDialogComponent } from '../../shared/media-picker/media-picker-dialog.component';

const ROOM_TYPES = ['cabin', 'room', 'pasadia', 'additional'] as const;

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ id() ? 'Editar habitación' : 'Nueva habitación' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Slug (opcional)</mat-label>
            <input matInput formControlName="slug" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="type">
              @for (t of roomTypes; track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Capacidad</mat-label>
            <input matInput type="number" formControlName="capacity" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Precio base</mat-label>
            <input matInput type="number" formControlName="base_price" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Descripción</mat-label>
            <textarea matInput rows="3" formControlName="description"></textarea>
          </mat-form-field>
          @if (id()) {
            <mat-form-field appearance="outline" class="full">
              <mat-label>Portada (media UUID)</mat-label>
              <input matInput formControlName="cover_media_id" />
            </mat-form-field>
            <button mat-stroked-button type="button" (click)="pickCover()">Elegir portada de biblioteca</button>
          }
          <button mat-flat-button color="primary" type="submit" [disabled]="saving() || form.invalid">
            Guardar
          </button>
          <button mat-button type="button" (click)="back()">Cancelar</button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .full {
      width: 100%;
      display: block;
      margin-bottom: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rooms = inject(RoomsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly roomTypes = ROOM_TYPES;
  readonly id = signal<string | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: [''],
    type: ['room', Validators.required],
    capacity: [2, [Validators.required, Validators.min(1)]],
    base_price: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    cover_media_id: [''],
  });

  constructor() {
    const rid = this.route.snapshot.paramMap.get('id');
    this.id.set(rid);
    if (rid) {
      this.rooms.getRoom(rid).subscribe({
        next: (res) => {
          const d = (res as { data?: Record<string, unknown> }).data;
          if (!d) return;
          this.form.patchValue({
            name: String(d['name'] ?? ''),
            slug: String(d['slug'] ?? ''),
            type: String(d['type'] ?? 'room'),
            capacity: Number(d['capacity'] ?? 2),
            base_price: Number(d['base_price'] ?? 0),
            description: String(d['description'] ?? ''),
            cover_media_id: String(d['cover_media_id'] ?? ''),
          });
        },
        error: () => this.toast.error('No se pudo cargar la habitación'),
      });
    }
  }

  pickCover(): void {
    this.dialog.open(MediaPickerDialogComponent, { width: '720px' }).afterClosed().subscribe((row) => {
      if (row?.id) this.form.patchValue({ cover_media_id: row.id });
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const body: Record<string, unknown> = {
      name: raw.name,
      type: raw.type,
      capacity: raw.capacity,
      base_price: raw.base_price,
      description: raw.description || null,
    };
    if (raw.slug?.trim()) body['slug'] = raw.slug.trim();
    const cover = raw.cover_media_id?.trim();
    if (this.id() && cover) {
      body['media_ids'] = [cover];
      body['cover_media_id'] = cover;
    }
    const obs = this.id() ? this.rooms.patchRoom(this.id()!, body) : this.rooms.createRoom(body);
    obs.subscribe({
      next: () => {
        this.toast.success('Guardado');
        void this.router.navigateByUrl('/admin/rooms');
      },
      error: () => this.toast.error('No se pudo guardar'),
      complete: () => this.saving.set(false),
    });
  }

  back(): void {
    void this.router.navigateByUrl('/admin/rooms');
  }
}
