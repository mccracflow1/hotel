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
      {
        path: 'reservations',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'] },
        loadChildren: () =>
          import('./features/reservations/reservations.routes').then((m) => m.default),
      },
      {
        path: 'plans',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadChildren: () => import('./features/plans/plans.routes').then((m) => m.default),
      },
      {
        path: 'optional-activities',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadChildren: () =>
          import('./features/optional-activities/optional-activities.routes').then((m) => m.default),
      },
      {
        path: 'inventory',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'] },
        loadChildren: () => import('./features/inventory/inventory.routes').then((m) => m.default),
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'] },
        loadChildren: () => import('./features/reports/reports.routes').then((m) => m.default),
      },
      {
        path: 'cms',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
        loadChildren: () => import('./features/cms/cms.routes').then((m) => m.default),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
        loadChildren: () => import('./features/users-admin/users-admin.routes').then((m) => m.default),
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.default),
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then((m) => m.default),
      },
    ],
  },
  { path: '**', redirectTo: 'admin/dashboard' },
];
