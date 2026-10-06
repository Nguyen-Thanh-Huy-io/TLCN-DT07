'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KnowledgeTabKey } from '../types/knowledge-hub.type';
import { KnowledgeTabStrategyFactory } from '../strategies/knowledge-tab.strategy';
import { Icon } from '@/components/icons/Icon';

export function KnowledgeHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<KnowledgeTabKey>(KnowledgeTabKey.LOCATIONS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('tab') as KnowledgeTabKey;
      if (
        param &&
        Object.values(KnowledgeTabKey).includes(param)
      ) {
        setActiveTab(param);
      }
    }
  }, []);

  const allStrategies = useMemo(
    () => KnowledgeTabStrategyFactory.getAllStrategies(),
    [],
  );

  const currentStrategy = useMemo(
    () => KnowledgeTabStrategyFactory.getStrategy(activeTab),
    [activeTab],
  );

  const handleTabChange = (key: KnowledgeTabKey) => {
    setActiveTab(key);
    router.replace(`/knowledge?tab=${key}`, { scroll: false });
  };

  return (
    <div className="knowledge-hub-view space-y-3">
      {/* Horizontal Tab Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center gap-1 overflow-x-auto">
        {allStrategies.map((strat) => {
          const isActive = strat.config.key === activeTab;
          return (
            <button
              key={strat.config.key}
              type="button"
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-md flex items-center justify-center gap-2 text-xs transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
              onClick={() => handleTabChange(strat.config.key)}
            >
              <Icon name={strat.config.icon} size={14} />
              <span>{strat.config.label}</span>
              {strat.config.badgeLabel ? (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {strat.config.badgeLabel}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Tab Description Context */}
      <div className="bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>{currentStrategy.config.description}</span>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-slate-900 hover:underline shrink-0"
          onClick={() => {
            const routes: Record<KnowledgeTabKey, string> = {
              [KnowledgeTabKey.LOCATIONS]: '/locations',
              [KnowledgeTabKey.ENTITIES]: '/entities',
              [KnowledgeTabKey.EVENTS]: '/events',
              [KnowledgeTabKey.TAGS]: '/tags',
            };
            router.push(routes[activeTab]);
          }}
        >
          Mở toàn trang ↗
        </button>
      </div>

      {/* Tab Content Rendering */}
      <div className="knowledge-tab-content">
        {currentStrategy.renderComponent()}
      </div>
    </div>
  );
}
