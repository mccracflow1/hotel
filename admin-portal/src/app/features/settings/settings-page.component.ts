import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/auth/auth.service';
import { SettingsService, type CancellationRule } from './settings.service';
import { messageFromApiError } from '../../shared/http/api-error-message';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Configuración del negocio</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()">
          <mat-tab-group>
            <mat-tab label="General">
              <div class="pad stack">
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Nombre del hotel</mat-label>
                  <input matInput formControlName="hotel_name" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>NIT</mat-label>
                  <input matInput formControlName="nit" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Dirección</mat-label>
                  <textarea matInput rows="2" formControlName="address"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="half">
                  <mat-label>Check-in</mat-label>
                  <input matInput formControlName="checkin_time" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="half">
                  <mat-label>Check-out</mat-label>
                  <input matInput formControlName="checkout_time" />
                </mat-form-field>
              </div>
            </mat-tab>
            <mat-tab label="Marca">
              <div class="pad stack">
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Logo URL</mat-label>
                  <input matInput formControlName="logo_url" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Color primario (#RRGGBB)</mat-label>
                  <input matInput formControlName="primary_color" />
                </mat-form-field>
              </div>
            </mat-tab>
            <mat-tab label="Políticas de cancelación">
              <div class="pad stack" formArrayName="cancellation_policy">
                @for (g of policyRows.controls; track $index; let i = $index) {
                  <div [formGroupName]="i" class="policy-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Horas antes</mat-label>
                      <input matInput type="number" formControlName="hours_before" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>% penalidad</mat-label>
                      <input matInput type="number" formControlName="penalty_pct" />
                    </mat-form-field>
                    <button mat-button type="button" (click)="removeRule(i)">Quitar</button>
                  </div>
                }
                <button mat-stroked-button type="button" (click)="addRule()">Agregar franja</button>
              </div>
            </mat-tab>
            @if (isSuper()) {
              <mat-tab label="Pagos (MercadoPago)">
                <div class="pad stack">
                  <mat-form-field appearance="outline" class="full">
                    <mat-label>Public key</mat-label>
                    <input matInput formControlName="mp_public_key" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full">
                    <mat-label>Access token</mat-label>
                    <input matInput formControlName="mp_access_token" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full">
                    <mat-label>Webhook secret</mat-label>
                    <input matInput formControlName="mp_webhook_secret" />
                  </mat-form-field>
                </div>
              </mat-tab>
            }
          </mat-tab-group>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">Guardar</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .pad {
      padding: 1rem 0;
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .full {
      width: 100%;
    }
    .half {
      width: calc(50% - 0.5rem);
    }
    .policy-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .actions {
      margin-top: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settings = inject(SettingsService);
  private readonly snack = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly saving = signal(false);
  readonly isSuper = computed(() => this.auth.user()?.role === 'SUPER_ADMIN');

  readonly form = this.fb.nonNullable.group({
    hotel_name: [''],
    nit: [''],
    address: [''],
    checkin_time: ['15:00'],
    checkout_time: ['12:00'],
    logo_url: [''],
    primary_color: [''],
    mp_public_key: [''],
    mp_access_token: [''],
    mp_webhook_secret: [''],
    cancellation_policy: this.fb.array<FormGroup>([]),
  });

  get policyRows(): FormArray<FormGroup> {
    return this.form.get('cancellation_policy') as FormArray<FormGroup>;
  }

  constructor() {
    this.settings.get().subscribe({
      next: (res) => {
        const d = res.data;
        if (!d) return;
        this.form.patchValue({
          hotel_name: String(d['hotel_name'] ?? ''),
          nit: String(d['nit'] ?? ''),
          address: String(d['address'] ?? ''),
          checkin_time: String(d['checkin_time'] ?? '15:00').slice(0, 5),
          checkout_time: String(d['checkout_time'] ?? '12:00').slice(0, 5),
          logo_url: String(d['logo_url'] ?? ''),
          primary_color: String(d['primary_color'] ?? ''),
          mp_public_key: String(d['mp_public_key'] ?? ''),
          mp_access_token: String(d['mp_access_token'] ?? ''),
          mp_webhook_secret: String(d['mp_webhook_secret'] ?? ''),
        });
        const pol = (d['cancellation_policy'] as CancellationRule[] | null) ?? [];
        this.policyRows.clear();
        for (const r of pol.length ? pol : [{ hours_before: 72, penalty_pct: 0 }]) {
          this.policyRows.push(
            this.fb.group({
              hours_before: [r.hours_before, [Validators.required, Validators.min(0)]],
              penalty_pct: [r.penalty_pct, [Validators.required, Validators.min(0), Validators.max(100)]],
            }),
          );
        }
      },
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }

  addRule(): void {
    this.policyRows.push(
      this.fb.group({
        hours_before: [24, [Validators.required, Validators.min(0)]],
        penalty_pct: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      }),
    );
  }

  removeRule(i: number): void {
    this.policyRows.removeAt(i);
    if (!this.policyRows.length) this.addRule();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      hotel_name: v.hotel_name,
      nit: v.nit || null,
      address: v.address || null,
      checkin_time: v.checkin_time,
      checkout_time: v.checkout_time,
      logo_url: v.logo_url || null,
      primary_color: v.primary_color || null,
      cancellation_policy: v.cancellation_policy as CancellationRule[],
    };
    if (this.isSuper()) {
      if (v.mp_public_key && v.mp_public_key !== '***') body['mp_public_key'] = v.mp_public_key;
      if (v.mp_access_token && v.mp_access_token !== '***') body['mp_access_token'] = v.mp_access_token;
      if (v.mp_webhook_secret && v.mp_webhook_secret !== '***') body['mp_webhook_secret'] = v.mp_webhook_secret;
    }
    this.settings.put(body).subscribe({
      next: () => this.snack.open('Configuración guardada', 'OK', { duration: 3000 }),
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 7000 }),
      complete: () => this.saving.set(false),
    });
  }
}
