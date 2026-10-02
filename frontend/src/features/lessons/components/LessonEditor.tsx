'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/common/Badge';
import { SelectField } from '@/components/common/FormField';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus, DifficultyLevel } from '@/constants/enums';
import { DIFFICULTY_LABEL_MAP } from '@/constants/ui-theme';
import { LessonApiService } from '@/services/entities/lesson.service';
import { TopicApiService } from '@/services/entities/topic.service';
import { extractErrorMessage } from '@/services/api';

export function LessonEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('id');

  const [topics, setTopics] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);

  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  const [title, setTitle] = useState('');
  const [contentRichText, setContentRichText] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [sourceReferenceNote, setSourceReferenceNote] = useState('');

  const loadTopics = useCallback(async () => {
    try {
      const res = await TopicApiService.getTopics({ limit: 100 });
      setTopics(res.items);
      if (!selectedTopicId && res.items.length > 0) {
        setSelectedTopicId(res.items[0].id);
      }
    } catch (err) {
      console.error('Failed to load topics for lesson form:', err);
      setTopics([]);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    if (lessonId) {
      setLoadingLesson(true);
      LessonApiService.getLessonById(lessonId)
        .then((lesson) => {
          if (lesson) {
            setTitle(lesson.title || '');
            setSelectedTopicId(lesson.topic?.id || '');
            setContentRichText(lesson.contentRichText || '');
            setDifficulty(lesson.difficulty || DifficultyLevel.MEDIUM);
            setSourceReferenceNote(lesson.sourceReferenceNote || '');
            setStatus(lesson.status || ContentStatus.DRAFT);
          }
        })
        .catch((err) => {
          console.error('Failed to load lesson detail:', err);
          alert('Không thể tải bài học cần sửa.');
        })
        .finally(() => setLoadingLesson(false));
    } else {
      setTitle('Chiến dịch Điện Biên Phủ năm 1954');
      setContentRichText(`
        <h2>Bối cảnh lịch sử</h2>
        <p>Cuối năm 1953, cuộc kháng chiến chống thực dân Pháp của nhân dân Việt Nam bước sang năm thứ tám.</p>
        <p>Điện Biên Phủ được xây dựng thành một tập đoàn cứ điểm mạnh nhất Đông Dương.</p>
      `);
      setSourceReferenceNote('Viện Sử học (2017), Lịch sử Việt Nam, tập 10, NXB Khoa học Xã hội.');
    }
  }, [lessonId]);

  const submitLesson = async (nextStatus: ContentStatus) => {
    if (!selectedTopicId) {
      alert('Không có chủ đề nào để gắn bài học. Hãy tạo chủ đề trước.');
      return;
    }

    if (!title.trim()) {
      alert('Vui lòng nhập tên bài học.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        topicId: selectedTopicId,
        title: title.trim(),
        contentRichText: contentRichText.trim() || undefined,
        difficulty,
        sourceReferenceNote: sourceReferenceNote.trim() || undefined,
        status: nextStatus,
        displayOrder: 0,
      };

      if (lessonId) {
        await LessonApiService.updateLesson(lessonId, payload);
      } else {
        await LessonApiService.createLesson(payload);
      }
      router.push(APP_ROUTES.LESSONS.LIST);
    } catch (err: unknown) {
      console.error('Failed to save lesson:', err);
      alert(
        extractErrorMessage(
          err,
          'Không thể lưu bài học. Vui lòng kiểm tra dữ liệu.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingLesson) {
    return <div style={{ padding: 30 }}>Đang tải bài học...</div>;
  }

  return (
    <div className="editor-wrap">
      <div className="editor-actions">
        <Badge>Trạng thái: {status}</Badge>
        <button type="button" className="secondary-button">
          <Icon name={IconName.EYE} size={16} /> Xem trước
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => submitLesson(ContentStatus.DRAFT)}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu nháp'}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => submitLesson(ContentStatus.PENDING_REVIEW)}
          disabled={saving}
        >
          {lessonId ? 'Lưu cập nhật' : 'Gửi duyệt'} <Icon name={IconName.ARROW} size={15} />
        </button>
      </div>

      <div className="editor-grid">
        <main className="editor-main">
          <div className="title-input">
            <span>TÊN BÀI HỌC</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên bài học"
            />
          </div>
          <section className="form-card rich-card">
            <div className="rich-label">NỘI DUNG BÀI HỌC</div>
            <div className="rich-toolbar">
              <select defaultValue="p">
                <option value="p">Đoạn văn</option>
              </select>
              <i />
              {[
                'B',
                'I',
                'U',
                'H1',
                'H2',
                '•',
                '1.',
                '❝',
                '↗',
                '⌁',
                '↶',
                '↷',
              ].map((x, i) => (
                <button
                  type="button"
                  key={i}
                  className={i === 1 ? 'italic' : ''}
                >
                  {x}
                </button>
              ))}
            </div>
            <article
              className="rich-content"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) =>
                setContentRichText((e.target as HTMLElement).innerHTML)
              }
              dangerouslySetInnerHTML={{ __html: contentRichText }}
            />
            <div className="word-count">
              {
                contentRichText
                  .replace(/<[^>]*>/g, ' ')
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length
              }{' '}
              từ
            </div>
          </section>
        </main>

        <aside className="editor-side">
          <section className="form-card">
            <h3>Phân loại</h3>
            <SelectField
              label="Chủ đề"
              required
              value={
                topics.find((topic) => topic.id === selectedTopicId)?.name ||
                (topics.length ? 'Chọn chủ đề' : 'Chưa có chủ đề')
              }
              onChange={(e) => setSelectedTopicId(e.target.value)}
              options={topics.map((topic) => topic.name)}
              optionValues={topics.map((topic) => topic.id)}
            />
            <div className="parent-path">
              <span>Thuộc giai đoạn</span>
              <strong>
                <Icon name={IconName.CLOCK} size={14} />{' '}
                {topics.length ? 'Từ chủ đề đã chọn' : 'Chưa có dữ liệu'}
              </strong>
            </div>
            <SelectField
              label="Độ khó"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              options={[
                DifficultyLevel.EASY,
                DifficultyLevel.MEDIUM,
                DifficultyLevel.HARD,
              ]}
              optionValues={[
                DifficultyLevel.EASY,
                DifficultyLevel.MEDIUM,
                DifficultyLevel.HARD,
              ]}
              items={[
                { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.EASY], value: DifficultyLevel.EASY },
                { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.MEDIUM], value: DifficultyLevel.MEDIUM },
                { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.HARD], value: DifficultyLevel.HARD },
              ]}
            />
          </section>

          <section className="form-card source-card">
            <h3>
              Nguồn tham khảo <em>Bắt buộc</em>
            </h3>
            <p>Nguồn rõ ràng giúp đảm bảo tính chính xác lịch sử.</p>
            <textarea
              rows={5}
              value={sourceReferenceNote}
              onChange={(e) => setSourceReferenceNote(e.target.value)}
            />
          </section>
        </aside>
      </div>

      <div className="sticky-actions editor-sticky">
        <button
          type="button"
          className="secondary-button"
          onClick={() => router.push(APP_ROUTES.LESSONS.LIST)}
        >
          Thoát trình soạn thảo
        </button>
        <span>{saving ? 'Đang lưu vào database...' : 'Sẵn sàng lưu'}</span>
      </div>
    </div>
  );
}
