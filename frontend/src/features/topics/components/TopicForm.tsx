'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Field, SelectField } from '@/components/common/FormField';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus } from '@/constants/enums';
import api, { extractErrorMessage } from '@/services/api';

export function TopicForm() {
  const router = useRouter();
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [periodOptions, setPeriodOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    name: '',
    selectedPeriodId: '',
    displayOrder: '',
    description: '',
    isSequential: false,
    status: ContentStatus.DRAFT,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingPeriods(true);
    api
      .get('/periods')
      .then((res) => {
        const payload = res.data?.items || res.data?.data || res.data || [];
        const list = Array.isArray(payload) ? payload : [];
        setPeriodOptions(list);
        if (list[0] && !form.selectedPeriodId) {
          setForm((prev) => ({ ...prev, selectedPeriodId: list[0].id }));
        }
      })
      .catch((err) => {
        console.error('Failed to load periods for topic form:', err);
        setPeriodOptions([]);
      })
      .finally(() => setLoadingPeriods(false));
  }, []);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.selectedPeriodId) {
      alert('Không có giai đoạn nào để gắn cho chủ đề.');
      return;
    }

    if (!form.name.trim()) {
      alert('Vui lòng nhập tên chủ đề.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/topics', {
        periodId: form.selectedPeriodId,
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

  return (
    <form className="form-page" onSubmit={handleSubmit}>
      <div className="form-main">
        <section className="form-card">
          <div className="section-title">
            <span>01</span>
            <div>
              <h2>Thông tin cơ bản</h2>
              <p>Thông tin nhận diện và phân loại nội dung</p>
            </div>
          </div>
          <SelectField
            label="Giai đoạn lịch sử"
            required
            value={
              periodOptions.find((p) => p.id === form.selectedPeriodId)?.name ||
              (loadingPeriods ? 'Đang tải...' : 'Chọn giai đoạn')
            }
            onChange={(e) => updateField('selectedPeriodId', e.target.value)}
            options={periodOptions.map((p) => p.name)}
            optionValues={periodOptions.map((p) => p.id)}
          />
          <Field
            label="Tên chủ đề"
            required
            placeholder="Ví dụ: Chiến dịch Điện Biên Phủ"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <Field
            label="Thứ tự hiển thị"
            type="number"
            placeholder="01"
            value={form.displayOrder}
            onChange={(e) => updateField('displayOrder', e.target.value)}
          />
        </section>

        <section className="form-card">
          <div className="section-title">
            <span>02</span>
            <div>
              <h2>Nội dung</h2>
              <p>Mô tả ngắn gọn giúp biên tập viên hiểu rõ nội dung</p>
            </div>
          </div>
          <label className="field">
            <span>Mô tả</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Nhập mô tả tổng quan về chủ đề lịch sử..."
            />
            <small>{form.description.length} / 500 ký tự</small>
          </label>
        </section>

        <section className="form-card">
          <div className="section-title">
            <span>03</span>
            <div>
              <h2>Cấu hình học tập</h2>
              <p>Thiết lập cách học sinh tiếp cận chủ đề</p>
            </div>
          </div>
          <div className="toggle-row">
            <div>
              <strong>Học tuần tự</strong>
              <p>Học sinh phải hoàn thành bài trước trước khi mở bài tiếp theo.</p>
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
            <p>Nội dung ở trạng thái bản nháp chỉ hiển thị trong CMS.</p>
          </div>
        </div>

        <div className="hierarchy-card">
          <span>HỆ THỐNG NỘI DUNG</span>
          <div className="tree-item muted">
            <Icon name={IconName.CLOCK} size={16} /> Giai đoạn
          </div>
          <i />
          <div className="tree-item active">
            <Icon name={IconName.FOLDER} size={16} /> Chủ đề đang tạo
          </div>
          <i />
          <div className="tree-item muted">
            <Icon name={IconName.BOOK} size={16} /> Bài học
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
          <span>Mọi thay đổi sẽ được lưu vào bản nháp</span>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu chủ đề'}
          </button>
        </div>
      </div>
    </form>
  );
}
