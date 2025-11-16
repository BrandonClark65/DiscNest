'use client';

type TabsNavProps = {
  activeTab: string;
  setActiveTab: (tab: any) => void;
};

const tabs = [
  { key: 'stats', label: 'Dashboard' },
  { key: 'discs', label: 'Disc Catalog' },
  { key: 'users', label: 'Users' },
  { key: 'pending', label: 'Pending Listings' },
  { key: 'errors', label: 'Errors' },
  { key: 'flagged', label: 'Flagged Messages' },
  { key: 'reports', label: 'User Reports' },
];

export default function TabsNav({ activeTab, setActiveTab }: TabsNavProps) {
  return (
    <div className="flex overflow-x-auto border-b mb-6 space-x-4 pb-2 scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`whitespace-nowrap px-4 py-2 transition-colors ${
            activeTab === tab.key
              ? 'border-b-2 border-blue-500 font-bold text-blue-600'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
