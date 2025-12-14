import { redirect } from 'next/navigation';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { WordPressIntegrationClient } from './wordpress-client';

export default async function WordPressIntegrationPage() {
  const session = await getAppServerSession();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const integrations = await prisma.wordpressIntegration.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, siteUrl: true, username: true, lastVerifiedAt: true, wpUserId: true },
  });

  return (
    <div className='max-w-3xl'>
      <h1 className='text-3xl md:text-4xl font-light tracking-tight'>
        WordPress
      </h1>
      <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300'>
        Connect your WordPress site using an Application Password, then publish articles directly from your library.
      </p>

      <div className='mt-6'>
        <WordPressIntegrationClient integrations={integrations} />
      </div>
    </div>
  );
}



