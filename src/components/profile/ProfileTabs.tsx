import clsx from 'clsx';
import { MARKETPLACE_ENABLED } from '@/lib/features';

type Props = {
  activeTab: 'basic' | 'disc' | 'play' | 'store';
  setActiveTab: (tab: 'basic' | 'disc' | 'play' | 'store') => void;
};

export default function ProfileTabs({ activeTab, setActiveTab }: Props) {
  const tabs = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'disc', label: 'Disc Golf Info' },
    { key: 'play', label: 'Play Style' },
    // Store settings only matter when the marketplace is live.
    ...(MARKETPLACE_ENABLED
      ? ([{ key: 'store', label: 'Store Settings' }] as const)
      : []),
  ] as const;

  return (
    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={clsx(
            'px-4 py-2 rounded-lg font-semibold transition-all duration-200',
            activeTab === key
              ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-sm scale-[1.02]'
              : 'bg-[var(--surface)] text-[var(--foreground)]/80 hover:bg-[var(--muted)]/20'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
