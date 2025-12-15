import { notFound } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { ensureDefaultModelRoutingRows, getAllModelRoutings } from '@/lib/model-routing';
import { AdminDashboardClient } from './_components/AdminDashboardClient';

export default async function AdminPage() {
  try {
    await requireSuperAdmin();
  } catch {
    notFound();
  }

  await ensureDefaultModelRoutingRows();

  const [users, routings] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        plan: true,
        subscriptionStatus: true,
        role: true,
      },
      take: 500,
    }),
    getAllModelRoutings(),
  ]);

  return (
    <div>
      <div className='mb-8'>
        <h1 className='text-3xl md:text-4xl font-light tracking-tight'>
          Super Admin
        </h1>
        <p className='mt-2 text-zinc-700 dark:text-zinc-300 max-w-3xl'>
          Manage users, subscriptions, and plan-to-model routing.
        </p>
      </div>

      <AdminDashboardClient initialUsers={users as any} initialRoutings={routings as any} />
    </div>
  );
}
