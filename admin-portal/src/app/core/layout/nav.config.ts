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
  {
    label: 'Reservas',
    path: '/admin/reservations',
    icon: 'event_note',
    roles: ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'],
  },
  {
    label: 'Planes',
    path: '/admin/plans',
    icon: 'loyalty',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    label: 'Opcionales',
    path: '/admin/optional-activities',
    icon: 'add_task',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    label: 'Inventario',
    path: '/admin/inventory',
    icon: 'inventory_2',
    roles: ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'],
  },
  {
    label: 'Reportes',
    path: '/admin/reports',
    icon: 'bar_chart',
    roles: ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'],
  },
];

export function navItemsForRole(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
