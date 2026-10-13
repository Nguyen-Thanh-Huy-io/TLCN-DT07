import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageBlockView } from '../components/blocks/ImageBlockView';
import { IMAGE_BLOCK_CONSTANTS } from '../constants/block-node.constants';

export const ImageBlockExtension = Node.create({
  name: IMAGE_BLOCK_CONSTANTS.NODE_NAME,
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-src') || element.querySelector('img')?.getAttribute('src') || '',
        renderHTML: (attributes) => ({
          'data-src': attributes.src,
        }),
      },
      alt: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-alt') || element.querySelector('img')?.getAttribute('alt') || '',
        renderHTML: (attributes) => ({
          'data-alt': attributes.alt,
        }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || element.querySelector('figcaption')?.textContent || '',
        renderHTML: (attributes) => ({
          'data-caption': attributes.caption,
        }),
      },
      mediaId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-media-id') || '',
        renderHTML: (attributes) => ({
          'data-media-id': attributes.mediaId,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-block"]',
      },
      {
        tag: 'div[data-type="image-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-type': 'image-block', class: 'lesson-image-block' }),
      HTMLAttributes['data-src']
        ? ['img', { src: HTMLAttributes['data-src'], alt: HTMLAttributes['data-alt'] || '' }]
        : '',
      HTMLAttributes['data-caption']
        ? ['figcaption', {}, HTMLAttributes['data-caption']]
        : '',
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});
