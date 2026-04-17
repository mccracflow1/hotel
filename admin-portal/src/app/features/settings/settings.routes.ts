import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings-page.component').then((m) => m.SettingsPageComponent),
  },
];

export default routes;
