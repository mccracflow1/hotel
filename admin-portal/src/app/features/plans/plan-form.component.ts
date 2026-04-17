import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlansService } from './plans.service';
import { injectPlanMediaLinker } from './plan-media.helper';
import { PlanActivitiesComponent } from './plan-activities.component';
import { PlanOptionalsSectionComponent } from './plan-optionals-section.component';
import { PlanPricePreviewComponent } from './plan-price-preview.component';
import { MediaPickerDialogComponent } from '../../shared/media-picker/media-picker-dialog.component';

@Component({
  selector: 'app-plan-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PlanActivitiesComponent,
    PlanOptionalsSectionComponent,
    PlanPricePreviewComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content [formGroup]="form">
        <mat-tab-group>
          <mat-tab label="General">
            <div class="tab-pad">
              <mat-form-field appearance="outline" class="full">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Slug</mat-label>
                <input matInput formControlName="slug" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Descripción corta</mat-label>
                <input matInput formControlName="short_desc" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Precio base</mat-label>
                <input matInput type="number" formControlName="base_price" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Unidad precio</mat-label>
                <input matInput formControlName="price_unit" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Máx. personas</mat-label>
                <input matInput type="number" formControlName="max_persons" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Mín. noches</mat-label>
                <input matInput type="number" formControlName="min_nights" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Enlazar media (UUID)</mat-label>
                <input matInput [formControl]="mediaIdCtrl" placeholder="media_id" />
              </mat-form-field>
              <button mat-stroked-button type="button" (click)="pickMedia()">Biblioteca</button>
              <button mat-stroked-button type="button" (click)="linkMedia()" [disabled]="!planId() || !mediaIdCtrl.value">
                Asociar media
              </button>
            </div>
          </mat-tab>
          @if (planId(); as pid) {
            <mat-tab label="Actividades base">
              <div class="tab-pad">
                <app-plan-activities [planId]="pid" (changed)="reloadPlan()" />
              </div>
            </mat-tab>
            <mat-tab label="Opcionales">
              <div class="tab-pad">
                <app-plan-optionals-section [planId]="pid" (changed)="reloadPlan()" />
                <app-plan-price-preview [basePrice]="basePriceNum()" [linkedOptionals]="linkedOptionals()" />
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      </mat-card-content>
      <mat-card-actions align="end">
        <a mat-button routerLink="/admin/plans">Volver</a>
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
    .tab-pad {
      padding: 1rem 0;
    }
    .full {
      width: 100%;
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly plans = inject(PlansService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly linkMediaFn = injectPlanMediaLinker();

  readonly planId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), { initialValue: null });
  readonly isCreate = computed(() => this.route.snapshot.routeConfig?.path === 'new');
  readonly title = computed(() => (this.isCreate() ? 'Nuevo plan' : 'Editar plan'));

  readonly saving = signal(false);
  readonly detail = signal<Record<string, unknown> | null>(null);

  readonly mediaIdCtrl = this.fb.nonNullable.control('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: [''],
    short_desc: [''],
    base_price: [0, [Validators.required, Validators.min(0)]],
    price_unit: ['per_group'],
    max_persons: [4, [Validators.required, Validators.min(1)]],
    min_nights: [1, [Validators.min(1)]],
  });

  readonly basePriceNum = computed(() => Number(this.form.controls.base_price.value));

  readonly linkedOptionals = computed(() => {
    const d = this.detail();
    const opts = (d?.['optional_activities'] as { name?: string; price?: number }[]) ?? [];
    return opts.map((o) => ({ name: String(o.name ?? ''), price: Number(o.price ?? 0) }));
  });

  constructor() {
    effect(() => {
      const id = this.planId();
      if (id) this.load(id);
    });
  }

  reloadPlan(): void {
    const id = this.planId();
    if (id) this.load(id);
  }

  private load(id: string): void {
    this.plans.getPlan(id).subscribe({
      next: (res: unknown) => {
        const data = (res as { data?: Record<string, unknown> }).data ?? null;
        this.detail.set(data);
        if (data) {
          this.form.patchValue({
            name: String(data['name'] ?? ''),
            slug: String(data['slug'] ?? ''),
            short_desc: String(data['short_desc'] ?? ''),
            base_price: Number(data['base_price'] ?? 0),
            price_unit: String(data['price_unit'] ?? 'per_group'),
            max_persons: Number(data['max_persons'] ?? 4),
            min_nights: Number(data['min_nights'] ?? 1),
          });
        }
      },
    });
  }

  pickMedia(): void {
    this.dialog.open(MediaPickerDialogComponent, { width: '720px' }).afterClosed().subscribe((row) => {
      if (row?.id) this.mediaIdCtrl.setValue(row.id);
    });
  }

  linkMedia(): void {
    const id = this.planId();
    const mid = this.mediaIdCtrl.value?.trim();
    if (!id || !mid) return;
    this.linkMediaFn(id, { media_id: mid, is_cover: false }).subscribe({
      next: () => {
        this.snackBar.open('Media asociada', 'OK', { duration: 3000 });
        this.mediaIdCtrl.setValue('');
        this.reloadPlan();
      },
      error: (e) =>
        this.snackBar.open(
          (e as { error?: { error?: { message?: string } } })?.error?.error?.message ?? 'Error',
          'Cerrar',
          { duration: 6000 },
        ),
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      name: v.name,
      slug: v.slug || undefined,
      short_desc: v.short_desc || null,
      base_price: v.base_price,
      price_unit: v.price_unit,
      max_persons: v.max_persons,
      min_nights: v.min_nights,
    };
    this.saving.set(true);
    const id = this.planId();
    if (this.isCreate() || !id) {
      this.plans.createPlan(body).subscribe({
        next: (res: unknown) => {
          const nid = (res as { data?: { id?: string } }).data?.id;
          this.snackBar.open('Plan creado', 'OK', { duration: 3000 });
          this.saving.set(false);
          if (nid) void this.router.navigate(['/admin/plans', nid, 'edit']);
          else void this.router.navigate(['/admin/plans']);
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
      this.plans.patchPlan(id, body).subscribe({
        next: () => {
          this.snackBar.open('Guardado', 'OK', { duration: 3000 });
          this.saving.set(false);
          this.reloadPlan();
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
