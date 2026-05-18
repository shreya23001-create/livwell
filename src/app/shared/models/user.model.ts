export type UserRole = 'super_admin' | 'admin' | 'agent' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
}
