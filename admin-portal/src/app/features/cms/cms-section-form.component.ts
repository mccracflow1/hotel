import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CmsService, type SiteContentEntry } from './cms.service';
import { messageFromApiError } from '../../shared/http/api-error-message';

@Component({
  selector: 'app-cms-section-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div formArrayName="entries" class="stack">
            @for (g of entries.controls; track $index; let i = $index) {
              <div [formGroupName]="i" class="row">
                <mat-form-field appearance="outline" class="key">
                  <mat-label>Clave</mat-label>
                  <input matInput formControlName="key" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="type">
                  <mat-label>Tipo</mat-label>
                  <input matInput formControlName="type" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="val">
                  <mat-label>Valor</mat-label>
                  <textarea matInput rows="2" formControlName="value"></textarea>
                </mat-form-field>
              </div>
            }
          </div>
          <button mat-flat-button color="primary" type="submit" [disabled]="saving() || form.invalid">
            Guardar sección
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 120px 2fr;
      gap: 0.5rem;
    }
    @media (max-width: 900px) {
      .row {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsSectionFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly cms = inject(CmsService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  readonly title = signal('Sección');
  readonly saving = signal(false);
  section = '';

  readonly form = this.fb.group({ entries: this.fb.array<FormGroup>([]) });

  get entries(): FormArray<FormGroup> {
    return this.form.get('entries') as FormArray<FormGroup>;
  }

  constructor() {
    const d = this.route.snapshot.data as { section?: string; title?: string };
    this.section = d.section ?? 'hero';
    this.title.set(d.title ?? this.section);
    this.cms.getSection(this.section).subscribe({
      next: (res) => this.patchFromServer(res.data ?? []),
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }

  private patchFromServer(rows: SiteContentEntry[]): void {
    this.entries.clear();
    const list = rows.length ? rows : [{ key: 'title', value: '', type: 'text' }];
    for (const r of list) {
      this.entries.push(
        this.fb.group({
          key: [r.key, Validators.required],
          value: [r.value ?? ''],
          type: [r.type ?? 'text', Validators.required],
        }),
      );
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload: SiteContentEntry[] = this.entries.getRawValue().map((e) => ({
      key: e.key,
      value: e.value,
      type: e.type,
    }));
    this.cms.putSection(this.section, payload).subscribe({
      next: (res) => {
        this.patchFromServer(res.data ?? []);
        this.snack.open('Guardado', 'OK', { duration: 3000 });
      },
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 6000 }),
      complete: () => this.saving.set(false),
    });
  }
}
