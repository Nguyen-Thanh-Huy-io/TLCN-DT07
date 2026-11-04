import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { EventBlockView } from '../components/blocks/EventBlockView';
import { EVENT_BLOCK_CONSTANTS } from '../constants/block-node.constants';

export const EventBlockExtension = Node.create({
  name: EVENT_BLOCK_CONSTANTS.NODE_NAME,
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      eventId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-event-id') || '',
        renderHTML: (attributes) => ({
          'data-event-id': attributes.eventId,
        }),
      },
      title: {
        default: EVENT_BLOCK_CONSTANTS.DEFAULT_NAME,
        parseHTML: (element) =>
          element.getAttribute('data-title') ||
          element.querySelector('h3')?.textContent ||
          EVENT_BLOCK_CONSTANTS.DEFAULT_NAME,
        renderHTML: (attributes) => ({
          'data-title': attributes.title,
        }),
      },
      timeLocation: {
        default: EVENT_BLOCK_CONSTANTS.DEFAULT_TIME_LOCATION,
        parseHTML: (element) =>
          element.getAttribute('data-time-location') ||
          EVENT_BLOCK_CONSTANTS.DEFAULT_TIME_LOCATION,
        renderHTML: (attributes) => ({
          'data-time-location': attributes.timeLocation,
        }),
      },
      summary: {
        default: EVENT_BLOCK_CONSTANTS.DEFAULT_SUMMARY,
        parseHTML: (element) =>
          element.getAttribute('data-summary') ||
          element.querySelector('p')?.textContent ||
          EVENT_BLOCK_CONSTANTS.DEFAULT_SUMMARY,
        renderHTML: (attributes) => ({
          'data-summary': attributes.summary,
        }),
      },
      thumbnailUrl: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-thumbnail') || '',
        renderHTML: (attributes) => ({
          'data-thumbnail': attributes.thumbnailUrl,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="event-block"]',
      },
      {
        tag: 'section[data-type="event-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'event-block',
        class: 'hisgo-event-block',
      }),
      ['span', { class: 'sub-label' }, EVENT_BLOCK_CONSTANTS.SUB_LABEL],
      ['h3', {}, HTMLAttributes['data-title'] || EVENT_BLOCK_CONSTANTS.DEFAULT_NAME],
      ['span', { class: 'time-loc' }, HTMLAttributes['data-time-location'] || ''],
      ['p', {}, HTMLAttributes['data-summary'] || ''],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EventBlockView);
  },
});
