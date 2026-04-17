import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  {
    path: 'admin/login',
    loadChildren: () => import('./features/auth-login/login.routes').then((m) => m.default),
  },
  {
    path: 'admin/forbidden',
    loadComponent: () => import('./shared/pages/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./core/layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.default),
      },
      {
        path: 'rooms',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
        loadChildren: () => import('./features/rooms/rooms.routes').then((m) => m.default),
      },
      {
        path: 'availability',
        loadChildren: () =>
          import('./features/availability/availability.routes').then((m) => m.default),
      },
    ],
  },
  { path: '**', redirectTo: 'admin/dashboard' },
];
