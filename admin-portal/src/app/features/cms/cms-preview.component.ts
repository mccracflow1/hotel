import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../../environments/environment';

function previewUrl(): string {
  const u = (environment as { previewLandingUrl?: string }).previewLandingUrl;
  return u && u.length > 0 ? u : 'http://127.0.0.1:5500/landing-page/preview.html';
}

@Component({
  selector: 'app-cms-preview',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Vista previa</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>
          Abrí la landing estática en modo previsualización. Ajustá <code>API_BASE_URL</code> en
          <code>landing-page/preview.html</code> si el API no está en el mismo origen.
        </p>
        <button mat-flat-button color="primary" type="button" (click)="open()">Abrir preview en nueva pestaña</button>
      </mat-card-content>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsPreviewComponent {
  open(): void {
    window.open(previewUrl(), '_blank', 'noopener');
  }
}
