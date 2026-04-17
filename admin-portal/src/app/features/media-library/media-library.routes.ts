import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./media-library-page.component').then((m) => m.MediaLibraryPageComponent),
  },
];

export default routes;
