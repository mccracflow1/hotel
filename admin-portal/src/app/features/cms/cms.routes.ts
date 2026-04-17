import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./cms-shell.component').then((m) => m.CmsShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'hero' },
      {
        path: 'hero',
        loadComponent: () => import('./cms-section-form.component').then((m) => m.CmsSectionFormComponent),
        data: { section: 'hero', title: 'Hero' },
      },
      {
        path: 'contact',
        loadComponent: () => import('./cms-section-form.component').then((m) => m.CmsSectionFormComponent),
        data: { section: 'contact', title: 'Contacto' },
      },
      {
        path: 'about',
        loadComponent: () => import('./cms-section-form.component').then((m) => m.CmsSectionFormComponent),
        data: { section: 'about', title: 'Quiénes somos' },
      },
      {
        path: 'gallery',
        loadComponent: () => import('./cms-section-form.component').then((m) => m.CmsSectionFormComponent),
        data: { section: 'gallery', title: 'Galería' },
      },
      {
        path: 'faqs',
        loadComponent: () => import('./cms-faqs-page.component').then((m) => m.CmsFaqsPageComponent),
      },
      {
        path: 'preview',
        loadComponent: () => import('./cms-preview.component').then((m) => m.CmsPreviewComponent),
      },
      {
        path: 'media',
        loadChildren: () => import('../media-library/media-library.routes').then((m) => m.default),
      },
    ],
  },
];

export default routes;
