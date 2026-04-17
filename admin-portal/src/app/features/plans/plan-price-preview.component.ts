import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-plan-price-preview',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <p class="preview">
      <strong>Vista previa total:</strong> {{ total() | number: '1.2-2' }}
      <span class="hint">(precio base plan + opcionales vinculadas)</span>
    </p>
  `,
  styles: `
    .preview {
      margin-top: 1rem;
    }
    .hint {
      display: block;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanPricePreviewComponent {
  readonly basePrice = input(0);
  readonly linkedOptionals = input<{ name: string; price: number }[]>([]);

  readonly total = computed(() => {
    const base = Number(this.basePrice() || 0);
    const sum = (this.linkedOptionals() ?? []).reduce((a, o) => a + Number(o.price || 0), 0);
    return base + sum;
  });
}
