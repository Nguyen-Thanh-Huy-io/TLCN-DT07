import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CharacterBlockView } from '../components/blocks/CharacterBlockView';
import { CHARACTER_BLOCK_CONSTANTS } from '../constants/block-node.constants';

export const CharacterBlockExtension = Node.create({
  name: CHARACTER_BLOCK_CONSTANTS.NODE_NAME,
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      entityId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-entity-id') || '',
        renderHTML: (attributes) => ({
          'data-entity-id': attributes.entityId,
        }),
      },
      name: {
        default: CHARACTER_BLOCK_CONSTANTS.DEFAULT_NAME,
        parseHTML: (element) =>
          element.getAttribute('data-name') ||
          element.querySelector('h4')?.textContent ||
          CHARACTER_BLOCK_CONSTANTS.DEFAULT_NAME,
        renderHTML: (attributes) => ({
          'data-name': attributes.name,
        }),
      },
      years: {
        default: CHARACTER_BLOCK_CONSTANTS.DEFAULT_YEARS,
        parseHTML: (element) =>
          element.getAttribute('data-years') ||
          CHARACTER_BLOCK_CONSTANTS.DEFAULT_YEARS,
        renderHTML: (attributes) => ({
          'data-years': attributes.years,
        }),
      },
      summary: {
        default: CHARACTER_BLOCK_CONSTANTS.DEFAULT_SUMMARY,
        parseHTML: (element) =>
          element.getAttribute('data-summary') ||
          element.querySelector('p')?.textContent ||
          CHARACTER_BLOCK_CONSTANTS.DEFAULT_SUMMARY,
        renderHTML: (attributes) => ({
          'data-summary': attributes.summary,
        }),
      },
      avatarUrl: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-avatar') || '',
        renderHTML: (attributes) => ({
          'data-avatar': attributes.avatarUrl,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="character-block"]',
      },
      {
        tag: 'blockquote[data-type="character-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'character-block',
        class: 'hisgo-character-block',
      }),
      ['h4', {}, HTMLAttributes['data-name'] || CHARACTER_BLOCK_CONSTANTS.DEFAULT_NAME],
      ['span', { class: 'years' }, HTMLAttributes['data-years'] || ''],
      ['p', {}, HTMLAttributes['data-summary'] || ''],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CharacterBlockView);
  },
});
