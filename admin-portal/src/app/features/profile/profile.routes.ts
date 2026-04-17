import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-page.component').then((m) => m.ProfilePageComponent),
  },
];

export default routes;
