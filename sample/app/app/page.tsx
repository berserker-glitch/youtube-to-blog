import { redirect } from 'next/navigation';
import { getAppServerSession } from '@/lib/auth-helpers';

export default async function AppIndexPage() {
  const session = await getAppServerSession();
  const role = (session?.user as any)?.role;
  if (role === 'super_admin') redirect('/app/admin');
  redirect('/app/generate');
}


