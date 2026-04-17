import type { UserRole } from '../auth/auth.models';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  /** Si vacío, visible para cualquier rol autenticado. */
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tablero', path: '/admin/dashboard', icon: 'dashboard' },
  {
    label: 'Habitaciones',
    path: '/admin/rooms',
    icon: 'hotel',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    label: 'Disponibilidad',
    path: '/admin/availability',
    icon: 'calendar_month',
    roles: ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER'],
  },
];

export function navItemsForRole(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
