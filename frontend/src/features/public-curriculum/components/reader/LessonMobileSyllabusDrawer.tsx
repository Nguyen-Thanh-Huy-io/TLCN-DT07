'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { HubButton } from '../hub/HubUi';
import { HubSyllabus } from '../hub/HubSyllabus';
import { LearningPathItem } from '@/services/entities/learning-path.service';

interface LessonMobileSyllabusDrawerProps {
  isOpen: boolean;
  learningPath: LearningPathItem | null;
  activeLessonId?: string;
  isCompleted: (id: string) => boolean;
  onClose: () => void;
}

export function LessonMobileSyllabusDrawer({
  isOpen,
  learningPath,
  activeLessonId,
  isCompleted,
  onClose,
}: LessonMobileSyllabusDrawerProps) {
  if (!learningPath) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            aria-label="Đóng nội dung"
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 top-0 z-[70] w-[min(92vw,24rem)] overflow-y-auto bg-lh-canvas p-4 shadow-2xl lg:hidden"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="font-[family-name:var(--font-heading)] text-xl font-bold text-lh-ink">
                Chương trình học
              </div>
              <HubButton
                variant="ghost"
                className="size-10 p-0"
                onClick={onClose}
                aria-label="Đóng"
              >
                <X className="size-5" />
              </HubButton>
            </div>
            <HubSyllabus
              path={learningPath}
              activeLessonId={activeLessonId}
              isCompleted={isCompleted}
              onNavigate={onClose}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
