"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/services/api";

export default function TagCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Vui lòng nhập tên thẻ.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/tags", {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.push("/tags");
    } catch (err: any) {
      console.error("Failed to create tag:", err);
      alert(err?.response?.data?.message || "Không thể tạo thẻ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel management-panel" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="page-title" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">
            <button type="button" onClick={() => router.push("/tags")}>Tags</button>
          </div>
          <h1>Thêm thẻ mới</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-card" style={{ padding: 24 }}>
        <label className="field">
          <span>
            Tên thẻ <b>*</b>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Kháng chiến, Di sản, Cách mạng"
          />
        </label>

        <label className="field">
          <span>Mô tả</span>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả ngắn về thẻ..."
          />
        </label>

        <div className="sticky-actions" style={{ justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" className="secondary-button" onClick={() => router.push("/tags")}>
            Hủy
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thẻ"}
          </button>
        </div>
      </form>
    </div>
  );
}
