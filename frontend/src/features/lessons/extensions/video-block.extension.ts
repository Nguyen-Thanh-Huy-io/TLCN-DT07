import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VideoBlockView } from '../components/blocks/VideoBlockView';
import { VIDEO_BLOCK_CONSTANTS, VideoSourceType } from '../constants/block-node.constants';

export const VideoBlockExtension = Node.create({
  name: VIDEO_BLOCK_CONSTANTS.NODE_NAME,
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-src') || '',
        renderHTML: (attributes) => ({
          'data-src': attributes.src,
        }),
      },
      sourceType: {
        default: VideoSourceType.URL,
        parseHTML: (element) => (element.getAttribute('data-source-type') as VideoSourceType) || VideoSourceType.URL,
        renderHTML: (attributes) => ({
          'data-source-type': attributes.sourceType,
        }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || '',
        renderHTML: (attributes) => ({
          'data-caption': attributes.caption,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'video-block', class: 'lesson-video-block' }),
      HTMLAttributes['data-src']
        ? ['iframe', { src: HTMLAttributes['data-src'], allowfullscreen: 'true' }]
        : '',
      HTMLAttributes['data-caption']
        ? ['p', { class: 'video-caption' }, HTMLAttributes['data-caption']]
        : '',
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoBlockView);
  },
});
