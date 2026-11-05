'use client';

import React from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { EntityReaderModel } from './entity-reader-adapter';

interface EntityInfoboxProps {
  model: EntityReaderModel;
}

export const EntityInfobox: React.FC<EntityInfoboxProps> = ({ model }) => {
  return (
    <aside className="ue-infobox">
      <div className="ue-infobox-title">
        <Info size={16} />
        <span>Hồ sơ tóm lược</span>
      </div>

      <div className="ue-facts-list">
        {model.facts.map((fact) => (
          <div key={fact.id} className="ue-fact-row">
            <span className="ue-fact-label">{fact.label}</span>
            <div className="ue-fact-value">
              {fact.href ? (
                <Link href={fact.href}>{fact.value}</Link>
              ) : (
                <span>{fact.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
