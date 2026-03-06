import React from 'react';

export function ChatBubble({ type, text }: { type: 'q' | 'a'; text: string }) {
  return <div className={`bubble ${type}`}>{text}</div>;
}
