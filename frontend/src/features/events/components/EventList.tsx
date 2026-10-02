'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { ContentCell } from '@/components/common/ContentCell';
import { ActionMenu } from '@/components/common/ActionMenu';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { EventModal, EventFormData } from './EventModal';
import { IconName } from '@/constants/icons';
import api from '@/services/api';

export interface EventItem {
  id: string;
  name: string;
  topic: string;
  topicId?: string;
  year: string;
  description: string;
  location?: string;
}

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    name: 'Chiến thắng Điện Biên Phủ',
    topic: 'Chiến dịch Điện Biên Phủ',
    year: '1954',
    description:
      'Chiến thắng lẫy lừng năm châu, chấn động địa cầu kết thúc 9 năm kháng chiến chống Pháp.',
    location: 'Điện Biên',
  },
  {
    id: 'evt-2',
    name: 'Mở màn chiến dịch',
    topic: 'Chiến dịch Điện Biên Phủ',
    year: '13/03/1954',
    description:
      'Quân ta nổ súng tiến công cứ điểm Him Lam, mở màn chiến dịch.',
    location: 'Him Lam, Điện Biên',
  },
  {
    id: 'evt-3',
    name: 'Đợt tiến công thứ hai',
    topic: 'Chiến dịch Điện Biên Phủ',
    year: '30/03/1954',
    description:
      'Tiến công đồng loạt các cứ điểm phía Đông phân khu trung tâm.',
    location: 'Đồi A1, C1, D1',
  },
];

export function EventList() {
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [topics, setTopics] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);

  const fetchTopics = async () => {
    try {
      const res = await api.get('/topics');
      const payload = res.data?.items || res.data?.data || res.data || [];
      setTopics(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/historical-events');
      const payload = res.data?.items || res.data?.data || res.data || [];
      const list = Array.isArray(payload) ? payload : [];
      if (list.length === 0) {
        setEventsList(DEFAULT_EVENTS);
        return;
      }
      interface RawHistoricalEvent {
        id: string;
        title?: string;
        name?: string;
        topic?: { name?: string };
        topicName?: string;
        topicId?: string;
        eventYear?: number | string;
        year?: number | string;
        description?: string;
        location?: string;
      }
      setEventsList(
        (list as RawHistoricalEvent[]).map((evt) => ({
          id: evt.id,
          name: evt.title || evt.name || '',
          topic: evt.topic?.name || evt.topicName || 'Chủ đề chưa gán',
          topicId: evt.topicId || '',
          year: String(evt.eventYear ?? evt.year ?? ''),
          description: evt.description || '',
          location: evt.location || '',
        }))
      );
    } catch (err) {
      console.error('Failed to load events, using fallback:', err);
      setEventsList(DEFAULT_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchEvents();
  }, []);

  const handleSaveEvent = async (data: EventFormData) => {
    try {
      if (editingEvent) {
        await api.patch(`/historical-events/${editingEvent.id}`, {
          title: data.name,
          description: data.description,
          eventYear: data.year ? parseInt(data.year, 10) : undefined,
          location: data.location,
        });
        setEventsList((prev) =>
          prev.map((e) => (e.id === editingEvent.id ? { ...e, ...data } : e))
        );
      } else {
        const res = await api.post('/historical-events', {
          title: data.name,
          description: data.description,
          eventYear: data.year ? parseInt(data.year, 10) : undefined,
          location: data.location,
        });
        const created = res.data?.data || res.data || { id: `evt-${Date.now()}`, ...data };
        setEventsList((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error('Save event failed, using local update:', err);
      if (editingEvent) {
        setEventsList((prev) =>
          prev.map((e) => (e.id === editingEvent.id ? { ...e, ...data } : e))
        );
      } else {
        setEventsList((prev) => [{ id: `evt-${Date.now()}`, ...data }, ...prev]);
      }
    } finally {
      setIsModalOpen(false);
      setEditingEvent(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    try {
      await api.delete(`/historical-events/${deletingEvent.id}`);
      setEventsList((prev) => prev.filter((e) => e.id !== deletingEvent.id));
    } catch (err) {
      console.error('Delete event failed, using local delete:', err);
      setEventsList((prev) => prev.filter((e) => e.id !== deletingEvent.id));
    } finally {
      setDeletingEvent(null);
    }
  };

  const filteredEvents = eventsList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="panel management-panel">
      <div className="toolbar">
        <label className="search-box">
          <Icon name={IconName.SEARCH} size={17} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sự kiện lịch sử..."
          />
        </label>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
        >
          <Icon name={IconName.PLUS} size={17} />
          Thêm sự kiện
        </button>
      </div>

      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th className="check-col">
                <input type="checkbox" />
              </th>
              <th>SỰ KIỆN</th>
              <th>CHỦ ĐỀ</th>
              <th>THỜI GIAN</th>
              <th>ĐỊA ĐIỂM</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                  Đang tải danh sách sự kiện...
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                  Không tìm thấy sự kiện nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <ContentCell
                      icon={IconName.CALENDAR}
                      title={evt.name}
                      sub={evt.description}
                    />
                  </td>
                  <td>{evt.topic}</td>
                  <td>{evt.year}</td>
                  <td>{evt.location || '—'}</td>
                  <td>
                    <ActionMenu
                      onEdit={() => {
                        setEditingEvent(evt);
                        setIsModalOpen(true);
                      }}
                      onDelete={() => setDeletingEvent(evt)}
                      onView={() => alert(`Xem chi tiết: ${evt.name}`)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>Hiển thị 1–{filteredEvents.length} trong {filteredEvents.length} sự kiện</span>
        <div>
          <button type="button" className="selected">1</button>
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initialData={editingEvent}
        topics={topics}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDeleteEvent}
        title={deletingEvent?.name || ''}
        itemTypeLabel="sự kiện"
      />
    </div>
  );
}
