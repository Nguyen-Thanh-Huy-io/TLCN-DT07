'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Field, SelectField } from '@/components/common/FormField';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus, LearningPathType } from '@/constants/enums';
import { TopicApiService } from '@/services/entities/topic.service';
import { extractErrorMessage } from '@/services/api';
import { TopicItem } from '@/types/models/topic.type';

export function TopicForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParentId = searchParams ? searchParams.get('parentId') || '' : '';

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [parentTopicOptions, setParentTopicOptions] = useState<TopicItem[]>([]);

  const [form, setForm] = useState({
    name: '',
    selectedParentId: initialParentId,
    pathType: LearningPathType.CHRONOLOGICAL,
    displayOrder: '',
    description: '',
    isSequential: false,
    status: ContentStatus.DRAFT,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingInitial(true);
    TopicApiService.getTopics({ limit: 100 })
      .then((topicsRes) => {
        setParentTopicOptions(topicsRes.items || []);
      })
      .catch(() => {
        setParentTopicOptions([]);
      })
      .finally(() => setLoadingInitial(false));
  }, []);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('Vui lòng nhập tên chủ đề.');
      return;
    }

    try {
      setSaving(true);
      await TopicApiService.createTopic({
        parentId: form.selectedParentId || undefined,
        pathType: form.pathType,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        displayOrder: Number(form.displayOrder || 0),
        isSequential: form.isSequential,
        status: form.status,
      });
      router.push(APP_ROUTES.TOPICS.LIST);
    } catch (err: unknown) {
      console.error('Failed to save topic:', err);
      alert(extractErrorMessage(err, 'Không thể lưu chủ đề.'));
    } finally {
      setSaving(false);
    }
  };

  // Chuẩn bị danh sách options cho Chủ đề cha
  const parentDropdownOptions = [
    '-- Không có (Đây là Chủ đề Gốc) --',
    ...parentTopicOptions.map((t) => t.name),
  ];
  const parentDropdownValues = ['', ...parentTopicOptions.map((t) => t.id)];

  return (
    <form className="form-page" onSubmit={handleSubmit}>
      <div className="form-main">
        <section className="form-card">
          <div className="section-title">
            <span>01</span>
            <div>
              <h2>Thông tin cơ bản</h2>
              <p>Phân cấp thứ bậc và nhận diện chủ đề lịch sử</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Chủ đề cha (Phân cấp Cha - Con)"
              value={
                parentDropdownOptions[
                  parentDropdownValues.indexOf(form.selectedParentId)
                ] || parentDropdownOptions[0]
              }
              onChange={(e) => updateField('selectedParentId', e.target.value)}
              options={parentDropdownOptions}
              optionValues={parentDropdownValues}
            />

            <SelectField
              label="Loại tiến trình học tập"
              value={form.pathType}
              onChange={(e) => updateField('pathType', e.target.value)}
              items={[
                {
                  value: LearningPathType.CHRONOLOGICAL,
                  label: 'Theo dòng thời gian (Niên đại)',
                },
                {
                  value: LearningPathType.THEMATIC,
                  label: 'Chuyên đề độc lập',
                },
                {
                  value: LearningPathType.MYTHOLOGICAL,
                  label: 'Huyền sử & Dân gian',
                },
              ]}
            />
          </div>

          <Field
            label="Tên chủ đề"
            required
            placeholder="Ví dụ: Kháng chiến chống Mỹ, cứu nước (1954 - 1975) hoặc Chiến dịch Điện Biên Phủ"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Thứ tự hiển thị"
              type="number"
              placeholder="01"
              value={form.displayOrder}
              onChange={(e) => updateField('displayOrder', e.target.value)}
            />
          </div>
        </section>

        <section className="form-card">
          <div className="section-title">
            <span>02</span>
            <div>
              <h2>Nội dung & Bối cảnh</h2>
              <p>Mô tả ngắn gọn giúp người học và biên tập viên nắm bắt chủ đề</p>
            </div>
          </div>
          <label className="field">
            <span>Mô tả chủ đề</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Nhập mô tả bối cảnh lịch sử, ý nghĩa và phạm vi kiến thức của chủ đề..."
            />
            <small>{form.description.length} / 500 ký tự</small>
          </label>
        </section>

        <section className="form-card">
          <div className="section-title">
            <span>03</span>
            <div>
              <h2>Cấu hình học tập</h2>
              <p>Thiết lập lộ trình trải nghiệm cho người học</p>
            </div>
          </div>
          <div className="toggle-row">
            <div>
              <strong>Học tuần tự (Sequential)</strong>
              <p>Học sinh phải hoàn thành bài trước trước khi mở khóa bài tiếp theo trong chủ đề này.</p>
            </div>
            <button
              type="button"
              className={`toggle ${form.isSequential ? 'on' : ''}`}
              onClick={() => updateField('isSequential', !form.isSequential)}
            >
              <i />
            </button>
          </div>
        </section>
      </div>

      <aside className="form-side">
        <div className="form-card">
          <h3>Cài đặt xuất bản</h3>
          <SelectField
            label="Trạng thái"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            options={[
              ContentStatus.DRAFT,
              ContentStatus.PUBLISHED,
              ContentStatus.PENDING_REVIEW,
            ]}
          />
          <div className="info-note">
            <Icon name={IconName.SPARK} size={17} />
            <p>Chủ đề ở trạng thái Bản nháp chỉ hiển thị cho Quản trị viên trong CMS.</p>
          </div>
        </div>

        <div className="hierarchy-card">
          <span>CẤU TRÚC PHÂN CẤP (COMPOSITE)</span>
          <div className="tree-item muted">
            <Icon name={IconName.CLOCK} size={16} /> Giai đoạn (Tùy chọn)
          </div>
          <i />
          {form.selectedParentId && (
            <>
              <div className="tree-item muted">
                <Icon name={IconName.FOLDER} size={16} /> Chủ đề cha
              </div>
              <i />
            </>
          )}
          <div className="tree-item active">
            <Icon name={IconName.FOLDER} size={16} /> Chủ đề đang tạo
          </div>
          <i />
          <div className="tree-item muted">
            <Icon name={IconName.BOOK} size={16} /> Bài học trực thuộc
          </div>
        </div>
      </aside>

      <div className="sticky-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => router.push(APP_ROUTES.TOPICS.LIST)}
        >
          Hủy
        </button>
        <div>
          <span>Mọi thay đổi sẽ được lưu vào hệ thống</span>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu chủ đề'}
          </button>
        </div>
      </div>
    </form>
  );
}
