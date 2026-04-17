import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./availability-page.component').then((m) => m.AvailabilityPageComponent),
  },
];

export default routes;
