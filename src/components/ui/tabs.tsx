// src/components/ui/tabs.tsx
'use client';

import { useState, ReactNode } from 'react';
import clsx from 'clsx';

type TabsProps = {
  defaultValue: string;
  children: ReactNode;
};

type TabsListProps = {
  children: ReactNode;
  className?: string;
};

type TabsTriggerProps = {
  value: string;
  activeTab?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
};

type TabsContentProps = {
  value: string;
  activeTab?: string;
  children: ReactNode;
};

export function Tabs({ defaultValue, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Clone children to inject activeTab/onChange props
  const enhancedChildren = Array.isArray(children)
    ? children.map((child: React.ReactElement) =>
        child.type === TabsList
          ? {
              ...child,
              props: {
                ...(child.props || {}),
                activeTab,
                setActiveTab,
              },
            }
          : child.type === TabsContent
          ? {
              ...child,
              props: { ...(child.props || {}), activeTab },
            }
          : child
      )
    : children;

  return <div>{enhancedChildren}</div>;
}

export function TabsList({
  children,
  className = '',
  activeTab,
  setActiveTab,
}: TabsListProps & { activeTab?: string; setActiveTab?: (v: string) => void }) {
  return (
    <div
      className={clsx(
        'flex bg-gray-100 rounded-lg p-1 gap-1',
        className
      )}
    >
      {Array.isArray(children)
        ? children.map((child: React.ReactElement) =>
            child.type === TabsTrigger
              ? {
                  ...child,
                  props: { ...(child.props || {}), activeTab, onChange: setActiveTab },
                }
              : child
          )
        : children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  activeTab,
  onChange,
}: TabsTriggerProps) {
  const isActive = value === activeTab;
  return (
    <button
      onClick={() => onChange?.(value)}
      className={clsx(
        'px-4 py-2 rounded-md text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
          : 'text-gray-600 hover:bg-gray-200'
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  activeTab,
  children,
}: TabsContentProps) {
  if (value !== activeTab) return null;
  return <div className="mt-4">{children}</div>;
}
