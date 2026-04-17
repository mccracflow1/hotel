import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CmsService, type FaqRow } from './cms.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { messageFromApiError } from '../../shared/http/api-error-message';

@Component({
  selector: 'app-cms-faqs-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>FAQs</mat-card-title>
      </mat-card-header>
      <mat-card-content class="stack">
        <form [formGroup]="faqForm" (ngSubmit)="createFaq()" class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Pregunta</mat-label>
            <input matInput formControlName="question" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Respuesta</mat-label>
            <textarea matInput rows="2" formControlName="answer"></textarea>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="faqForm.invalid">Agregar</button>
        </form>
        <mat-nav-list>
          @for (f of faqs(); track f.id) {
            <div class="faq-row">
              <span class="mono">{{ f.sort_order }}</span>
              <span class="grow">{{ f.question }}</span>
              <mat-checkbox [checked]="f.is_active" (change)="toggleActive(f, $event.checked)">Activa</mat-checkbox>
              <button mat-button type="button" (click)="move(f, -1)">↑</button>
              <button mat-button type="button" (click)="move(f, 1)">↓</button>
              <button mat-button type="button" color="warn" (click)="remove(f)">Eliminar</button>
            </div>
          }
        </mat-nav-list>
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
      gap: 0.5rem;
      align-items: flex-start;
    }
    .grow {
      flex: 1 1 200px;
    }
    .faq-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    .mono {
      font-family: monospace;
      width: 2rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsFaqsPageComponent {
  private readonly cms = inject(CmsService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly faqs = signal<FaqRow[]>([]);

  readonly faqForm = this.fb.nonNullable.group({
    question: ['', Validators.required],
    answer: ['', Validators.required],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.cms.listFaqsManage().subscribe({
      next: (r) => this.faqs.set(r.data ?? []),
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }

  createFaq(): void {
    if (this.faqForm.invalid) return;
    const v = this.faqForm.getRawValue();
    this.cms.createFaq(v).subscribe({
      next: () => {
        this.faqForm.reset({ question: '', answer: '' });
        this.reload();
      },
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }

  toggleActive(f: FaqRow, active: boolean): void {
    this.cms.patchFaq(f.id, { is_active: active }).subscribe({
      next: () => this.reload(),
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }

  move(f: FaqRow, delta: number): void {
    const list = [...this.faqs()];
    const i = list.findIndex((x) => x.id === f.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
    this.cms.reorderFaqs(list.map((x) => x.id)).subscribe({
      next: () => this.reload(),
      error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
    });
  }

  remove(f: FaqRow): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar FAQ', message: f.question, confirmLabel: 'Eliminar' },
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.cms.deleteFaq(f.id).subscribe({
        next: () => this.reload(),
        error: (e) => this.snack.open(messageFromApiError(e), 'Cerrar', { duration: 5000 }),
      });
    });
  }
}
