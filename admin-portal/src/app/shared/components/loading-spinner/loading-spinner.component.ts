import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (overlay()) {
      <div class="overlay">
        <mat-spinner diameter="40" />
      </div>
    } @else {
      <mat-spinner diameter="32" />
    }
  `,
  styles: `
    .overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  readonly overlay = input(false);
}
