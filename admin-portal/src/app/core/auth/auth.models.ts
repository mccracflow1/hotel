export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'BUSINESS' | 'VIEWER' | 'AGENT';

export interface AuthUser {
  id: string | number;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
  expiresIn: number;
}
