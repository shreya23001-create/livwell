export type UserRole = 'super_admin' | 'admin' | 'agent' | 'customer';
export type UserStatus = 'active' | 'pending_verification' | 'suspended' | 'locked';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  token?: string;
  firstLogin?: boolean;
}
