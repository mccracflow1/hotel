import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OptionalActivitiesService } from './optional-activities.service';

@Component({
  selector: 'app-optional-activity-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content [formGroup]="form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Precio</mat-label>
          <input matInput type="number" formControlName="price" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Unidad precio</mat-label>
          <input matInput formControlName="price_unit" />
        </mat-form-field>
      </mat-card-content>
      <mat-card-actions align="end">
        <a mat-button routerLink="/admin/optional-activities">Volver</a>
        <button mat-flat-button color="primary" type="button" [disabled]="form.invalid || saving()" (click)="save()">
          @if (saving()) {
            <mat-spinner diameter="22" />
          } @else {
            Guardar
          }
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .full {
      width: 100%;
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionalActivityFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(OptionalActivitiesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly title = signal('Opcional');
  readonly saving = signal(false);
  private routeId: string | null = null;
  private isCreate = true;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    price_unit: ['per_person'],
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const oid = pm.get('id');
      this.routeId = oid;
      this.isCreate = !oid;
      this.title.set(this.isCreate ? 'Nuevo opcional' : 'Editar opcional');
      if (this.isCreate) {
        this.form.reset({ name: '', price: 0, price_unit: 'per_person' });
        return;
      }
      this.svc.list().subscribe({
        next: (res: unknown) => {
          const rows = (res as { data?: Record<string, unknown>[] }).data ?? [];
          const row = rows.find((r) => String(r['id']) === oid);
          if (row) {
            this.form.patchValue({
              name: String(row['name'] ?? ''),
              price: Number(row['price'] ?? 0),
              price_unit: String(row['price_unit'] ?? 'per_person'),
            });
          }
        },
      });
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = { name: v.name, price: v.price, price_unit: v.price_unit };
    this.saving.set(true);
    const oid = this.routeId;
    if (this.isCreate || !oid) {
      this.svc.create(body).subscribe({
        next: () => {
          this.snackBar.open('Creado', 'OK', { duration: 3000 });
          this.saving.set(false);
          void this.router.navigate(['/admin/optional-activities']);
        },
        error: (e) => {
          this.saving.set(false);
          this.snackBar.open(
            (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
            'Cerrar',
            { duration: 7000 },
          );
        },
      });
    } else {
      this.svc.patch(oid, body).subscribe({
        next: () => {
          this.snackBar.open('Guardado', 'OK', { duration: 3000 });
          this.saving.set(false);
          void this.router.navigate(['/admin/optional-activities']);
        },
        error: (e) => {
          this.saving.set(false);
          this.snackBar.open(
            (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
            'Cerrar',
            { duration: 7000 },
          );
        },
      });
    }
  }
}
