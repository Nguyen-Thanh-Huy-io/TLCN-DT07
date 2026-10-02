'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Field, SelectField } from '@/components/common/FormField';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus } from '@/constants/enums';
import api, { extractErrorMessage } from '@/services/api';

export function PeriodForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    region: 'Việt Nam',
    displayOrder: '',
    startYear: '',
    endYear: '',
    description: '',
    status: ContentStatus.DRAFT,
  });
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startYear) {
      alert('Vui lòng nhập tên giai đoạn và năm bắt đầu.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/periods', {
        name: form.name.trim(),
        region: form.region || 'Việt Nam',
        startYear: Number(form.startYear),
        endYear: form.endYear ? Number(form.endYear) : undefined,
        description: form.description.trim() || undefined,
        displayOrder: Number(form.displayOrder || 0),
        status: form.status,
      });
      router.push(APP_ROUTES.PERIODS.LIST);
    } catch (err: unknown) {
      console.error('Failed to save period:', err);
      alert(extractErrorMessage(err, 'Không thể lưu giai đoạn.'));
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
          <Field
            label="Tên giai đoạn"
            required
            placeholder="Ví dụ: Kháng chiến chống Pháp"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <div className="field-row">
            <SelectField
              label="Khu vực"
              required
              value={form.region}
              onChange={(e) => updateField('region', e.target.value)}
              options={['Việt Nam', 'Thế giới', 'Đông Nam Á']}
            />
            <Field
              label="Thứ tự hiển thị"
              type="number"
              placeholder="05"
              value={form.displayOrder}
              onChange={(e) => updateField('displayOrder', e.target.value)}
            />
          </div>
          <div className="field-row">
            <Field
              label="Năm bắt đầu"
              required
              type="number"
              placeholder="1945"
              value={form.startYear}
              onChange={(e) => updateField('startYear', e.target.value)}
            />
            <Field
              label="Năm kết thúc"
              type="number"
              placeholder="1954 (không bắt buộc)"
              value={form.endYear}
              onChange={(e) => updateField('endYear', e.target.value)}
            />
          </div>
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
              placeholder="Nhập mô tả về bối cảnh và phạm vi của giai đoạn..."
            />
            <small>{form.description.length} / 500 ký tự</small>
          </label>
          <label className="field">
            <span>Ảnh bìa</span>
            <div className="upload-box">
              <div>
                <Icon name={IconName.PLUS} />
                <strong>Tải ảnh lên</strong>
              </div>
              <p>Kéo thả hoặc nhấp để chọn ảnh · PNG, JPG tối đa 5MB</p>
            </div>
          </label>
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
          <div className="tree-item active">
            <Icon name={IconName.CLOCK} size={16} /> Giai đoạn đang tạo
          </div>
        </div>
      </aside>

      <div className="sticky-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => router.push(APP_ROUTES.PERIODS.LIST)}
        >
          Hủy
        </button>
        <div>
          <span>Mọi thay đổi sẽ được lưu vào bản nháp</span>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu giai đoạn'}
          </button>
        </div>
      </div>
    </form>
  );
}
