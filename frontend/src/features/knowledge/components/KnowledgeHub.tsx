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
    <div className="knowledge-hub-view space-y-4">

      {/* Horizontal Tab Navigation Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm flex items-center gap-1 overflow-x-auto">
        {allStrategies.map((strat) => {
          const isActive = strat.config.key === activeTab;
          return (
            <button
              key={strat.config.key}
              type="button"
              className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-md flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#15395f] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent'
              }`}
              onClick={() => handleTabChange(strat.config.key)}
            >
              <Icon name={strat.config.icon} size={15} />
              <span>{strat.config.label}</span>
              {strat.config.badgeLabel ? (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
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
      <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>{currentStrategy.config.description}</span>
        </div>
        <span className="text-[10px] text-blue-500 font-medium">
          Dữ liệu thời gian thực
        </span>
      </div>

      {/* Active Tab Table Content */}
      <div className="tab-body mt-2">
        {currentStrategy.renderComponent()}
      </div>
    </div>
  );
}
