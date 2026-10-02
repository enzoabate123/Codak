'use client';

import React from 'react';
import { linkifyText } from '@/lib/grimoire-linker';

interface LinkedTextProps {
  text: string;
  onNavigate?: (entryId: string) => void;
  className?: string;
  /** If true, wraps output in a <p>. Defaults to inline <span>s. */
  block?: boolean;
}

/**
 * Renders a text string with auto-detected entity references as clickable spans.
 * Uses the EntityRegistry + grimoire-linker to detect names and produce inline links.
 *
 * Styling: links use the tactical amber color (#F59E0B) with an underline,
 * cursor:pointer — no new CSS classes needed.
 */
export default function LinkedText({ text, onNavigate, className, block }: LinkedTextProps) {
  const fragments = React.useMemo(() => linkifyText(text), [text]);

  const content = fragments.map((frag, i) => {
    if (frag.linkTo) {
      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.(frag.linkTo!);
          }}
          style={{
            color: '#F59E0B',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 600,
          }}
          title={`Abrir: ${frag.text}`}
        >
          {frag.text}
        </span>
      );
    }
    return <React.Fragment key={i}>{frag.text}</React.Fragment>;
  });

  if (block) {
    return <p className={className}>{content}</p>;
  }
  return <span className={className}>{content}</span>;
}
