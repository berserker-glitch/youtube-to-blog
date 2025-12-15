import { getAppServerSession } from '@/lib/auth-helpers';

export async function requireSuperAdmin() {
  const session = await getAppServerSession();
  const user = session?.user as any;
  const role = (user?.role || 'user') as string;
  if (role !== 'super_admin') {
    throw new Error('Forbidden');
  }
  return session;
}
