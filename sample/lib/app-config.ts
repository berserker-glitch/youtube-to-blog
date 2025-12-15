import { prisma } from '@/lib/db';

export type AppConfigKey = 'ui';

export type UiConfig = {
  showArticleCost: boolean;
};

export type AppConfig = {
  ui: UiConfig;
};

const DEFAULTS: AppConfig = {
  ui: {
    showArticleCost: true,
  },
};

export async function getUiConfig(): Promise<UiConfig> {
  const row = await prisma.appConfig.findUnique({
    where: { key: 'ui' },
    select: { valueJson: true },
  });

  const v = row?.valueJson as any;
  const showArticleCost = typeof v?.showArticleCost === 'boolean'
    ? v.showArticleCost
    : DEFAULTS.ui.showArticleCost;

  return { showArticleCost };
}

export async function setUiConfig(next: Partial<UiConfig>): Promise<UiConfig> {
  const current = await getUiConfig();
  const merged: UiConfig = {
    ...current,
    ...Object.fromEntries(
      Object.entries(next).filter(([, v]) => typeof v === 'boolean')
    ),
  } as UiConfig;

  const row = await prisma.appConfig.upsert({
    where: { key: 'ui' },
    create: { key: 'ui', valueJson: merged },
    update: { valueJson: merged },
    select: { valueJson: true },
  });

  const v = row.valueJson as any;
  return {
    showArticleCost:
      typeof v?.showArticleCost === 'boolean'
        ? v.showArticleCost
        : DEFAULTS.ui.showArticleCost,
  };
}
