'use client';

import React from 'react';
import { GrimoireModalItem, resolveEntryId } from '@/types/grimoire';
import { linkifyText } from '@/lib/grimoire-linker';
import { getEntityRegistry } from '@/lib/entity-registry';
import { tacticalAudio } from '@/lib/audio';

export interface RelatedItem {
  id: string;
  name: string;
}

export interface RelatedItemsBarProps {
  items: RelatedItem[];
  onNavigate: (id: string) => void;
}

export function extractRelatedItems(item: GrimoireModalItem): RelatedItem[] {
  let textToScan = '';
  let currentId = '';

  switch (item.type) {
    case 'class':
      currentId = resolveEntryId('class', item.data.id);
      textToScan += (item.data.description || '') + ' ';
      item.data.classFeatures?.forEach((f: any) => {
        textToScan += (f.desc || '') + ' ';
      });
      item.data.subclasses?.forEach((sc: any) => {
        textToScan += (sc.tagline || '') + ' ';
        sc.abilities?.forEach((ab: any) => {
          textToScan += (ab.desc || '') + ' ';
        });
      });
      break;
    case 'ability':
      currentId = resolveEntryId('ability', item.data.id);
      textToScan += (item.data.summary || '') + ' ';
      textToScan += (item.data.description || '') + ' ';
      textToScan += (item.data.tacticalTip || '') + ' ';
      if (item.data.rules) {
        textToScan += item.data.rules.join(' ') + ' ';
      }
      break;
    case 'weapon':
      currentId = resolveEntryId('weapon', item.data.id);
      textToScan += (item.data.name || '') + ' ';
      textToScan += (item.data.type || '') + ' ';
      break;
    case 'attachment':
      currentId = resolveEntryId('attachment', item.data.id);
      textToScan += (item.data.effect || '') + ' ';
      break;
    case 'ammo':
      currentId = resolveEntryId('ammo', (item.data as any).type);
      textToScan += ((item.data as any).specialEffect || '') + ' ';
      break;
    case 'lore_rule':
      currentId = resolveEntryId('lore_rule', item.data.id);
      textToScan += (item.data.summary || '') + ' ';
      textToScan += (item.data.description || '') + ' ';
      break;
  }

  const fragments = linkifyText(textToScan);
  
  const uniqueIds = new Set<string>();
  const results: RelatedItem[] = [];

  for (const frag of fragments) {
    if (frag.linkTo && frag.linkTo !== currentId) {
      if (!uniqueIds.has(frag.linkTo)) {
        uniqueIds.add(frag.linkTo);
        const entity = getEntityRegistry().findById(frag.linkTo);
        if (entity) {
          results.push({
            id: entity.id,
            name: entity.name,
          });
        }
        if (results.length >= 8) break;
      }
    }
  }

  return results;
}

export function RelatedItemsBar({ items, onNavigate }: RelatedItemsBarProps) {
  return (
    <div
      className="grimoire-related-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        gap: '0.75rem',
        overflowX: 'auto',
      }}
    >
      <span
        className="grimoire-related-label"
        style={{
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          fontWeight: 'bold',
        }}
      >
        ITENS RELACIONADOS
      </span>

      <span style={{ color: 'var(--border-subtle)' }}>|</span>

      {items.length === 0 ? (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {items.map((item) => (
            <button
              key={item.id}
              className="grimoire-related-chip"
              onClick={() => {
                tacticalAudio.playSelect();
                onNavigate(item.id);
              }}
              onMouseEnter={() => tacticalAudio.playHover()}
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--color-amber-primary)',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-amber-primary)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--color-amber-primary)';
                e.currentTarget.style.backgroundColor = 'var(--surface-3)';
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
