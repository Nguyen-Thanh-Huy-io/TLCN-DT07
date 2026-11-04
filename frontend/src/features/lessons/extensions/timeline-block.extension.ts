import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TimelineBlockView } from '../components/blocks/TimelineBlockView';
import { TIMELINE_BLOCK_CONSTANTS } from '../constants/block-node.constants';

export const TimelineBlockExtension = Node.create({
  name: TIMELINE_BLOCK_CONSTANTS.NODE_NAME,
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: TIMELINE_BLOCK_CONSTANTS.TITLE,
        parseHTML: (element) =>
          element.getAttribute('data-title') ||
          element.querySelector('h3')?.textContent ||
          TIMELINE_BLOCK_CONSTANTS.TITLE,
        renderHTML: (attributes) => ({
          'data-title': attributes.title,
        }),
      },
      subtitle: {
        default: TIMELINE_BLOCK_CONSTANTS.DEFAULT_SUBTITLE,
        parseHTML: (element) =>
          element.getAttribute('data-subtitle') ||
          TIMELINE_BLOCK_CONSTANTS.DEFAULT_SUBTITLE,
        renderHTML: (attributes) => ({
          'data-subtitle': attributes.subtitle,
        }),
      },
      nodes: {
        default: JSON.stringify([
          {
            id: '1',
            year: '1945',
            title: 'Tuyên bố độc lập',
            description: 'Sự kiện đánh dấu bước ngoặt lịch sử.',
          },
          {
            id: '2',
            year: '1954',
            title: 'Chiến thắng Điện Biên Phủ',
            description: 'Mốc sự kiện tiếp theo trên dòng thời gian.',
          },
        ]),
        parseHTML: (element) => element.getAttribute('data-nodes') || '[]',
        renderHTML: (attributes) => ({
          'data-nodes': attributes.nodes,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="timeline-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    let parsedNodes: Array<{ year: string; title: string; description: string }> = [];
    try {
      parsedNodes = JSON.parse(HTMLAttributes['data-nodes'] || '[]');
    } catch {
      parsedNodes = [];
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'timeline-block',
        class: 'hisgo-timeline-block',
      }),
      ['h3', {}, HTMLAttributes['data-title'] || TIMELINE_BLOCK_CONSTANTS.TITLE],
      ['h4', {}, HTMLAttributes['data-subtitle'] || TIMELINE_BLOCK_CONSTANTS.DEFAULT_SUBTITLE],
      [
        'ul',
        { class: 'timeline-node-list' },
        ...parsedNodes.map((n) => [
          'li',
          { class: 'timeline-node-item' },
          ['strong', {}, `${n.year} — ${n.title}: `],
          ['span', {}, n.description],
        ]),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineBlockView);
  },
});
