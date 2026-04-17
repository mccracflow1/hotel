import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-cms-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  template: `
    <nav class="nav" aria-label="Secciones CMS">
      <a mat-button routerLink="/admin/cms/hero" routerLinkActive="active">Hero</a>
      <a mat-button routerLink="/admin/cms/contact" routerLinkActive="active">Contacto</a>
      <a mat-button routerLink="/admin/cms/about" routerLinkActive="active">About</a>
      <a mat-button routerLink="/admin/cms/gallery" routerLinkActive="active">Galería</a>
      <a mat-button routerLink="/admin/cms/faqs" routerLinkActive="active">FAQs</a>
      <a mat-button routerLink="/admin/cms/media" routerLinkActive="active">Medios</a>
      <a mat-button routerLink="/admin/cms/preview" routerLinkActive="active">Vista previa</a>
    </nav>
    <router-outlet />
  `,
  styles: `
    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }
    a.active {
      background: color-mix(in srgb, var(--mat-sys-primary) 18%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsShellComponent {}
