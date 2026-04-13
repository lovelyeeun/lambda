"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useSettingsStore } from "@/lib/settings-store";
import { useFocusPulse } from "@/lib/settings-events";
import ShippingAddressModal, {
  addressToDraft,
  emptyShippingDraft,
  type ShippingDraft,
} from "@/components/settings/ShippingAddressModal";

const PULSE_SHADOW = "rgba(99,102,241,0.5) 0px 0px 0px 2px, rgba(99,102,241,0.15) 0px 6px 20px";

export default function CompanyShipping() {
  const { shipping, addShipping, removeShipping, setDefaultShipping, updateShipping } = useSettingsStore();
  const [modalMode, setModalMode] = useState<null | "add" | "edit">(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const editingAddress = editingId ? shipping.find((x) => x.id === editingId) : undefined;

  const handleSubmit = (draft: ShippingDraft) => {
    if (modalMode === "add") {
      addShipping({
        name: draft.name.trim(),
        address: draft.address.trim(),
        receiver: draft.receiver.trim(),
        phone: draft.phone.trim(),
        zipcode: draft.zipcode.trim() || undefined,
        detailAddress: draft.detailAddress.trim() || undefined,
        deliveryNote: draft.deliveryNote.trim() || undefined,
      });
      showToast("추가되었습니다");
    } else if (modalMode === "edit" && editingId) {
      updateShipping(editingId, {
        name: draft.name.trim(),
        address: draft.address.trim(),
        receiver: draft.receiver.trim(),
        phone: draft.phone.trim(),
        zipcode: draft.zipcode.trim() || undefined,
        detailAddress: draft.detailAddress.trim() || undefined,
        deliveryNote: draft.deliveryNote.trim() || undefined,
      });
      showToast("수정되었습니다");
    }
    setModalMode(null);
    setEditingId(null);
  };

  return (
    <div className="max-w-[520px]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-semibold">배송지 관리</h2>
        <button
          onClick={() => setModalMode("add")}
          className="flex items-center gap-1.5 px-3 py-[6px] text-[13px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-lg cursor-pointer hover:bg-[#ebebeb]"
        >
          <Plus size={14} strokeWidth={1.5} />추가
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {shipping.map((a) => (
          <ShippingRow
            key={a.id}
            id={a.id}
            onSetDefault={() => { setDefaultShipping(a.id); showToast("기본 배송지로 지정했습니다"); }}
            onEdit={() => { setEditingId(a.id); setModalMode("edit"); }}
            onRemove={() => { removeShipping(a.id); showToast("삭제되었습니다"); }}
            address={a}
          />
        ))}
      </div>

      <ShippingAddressModal
        open={modalMode !== null}
        mode={modalMode ?? "add"}
        initial={modalMode === "edit" && editingAddress ? addressToDraft(editingAddress) : emptyShippingDraft()}
        onClose={() => { setModalMode(null); setEditingId(null); }}
        onSubmit={handleSubmit}
      />

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>}
    </div>
  );
}

function ShippingRow({
  id,
  address: a,
  onSetDefault,
  onEdit,
  onRemove,
}: {
  id: string;
  address: ReturnType<typeof useSettingsStore>["shipping"][number];
  onSetDefault: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const idPulse = useFocusPulse(`shipping.${id}`);
  const listPulse = useFocusPulse("shipping.list");
  const pulse = idPulse || listPulse;
  return (
    <div
      className="flex items-start gap-3 p-4 transition-all duration-300"
      style={{
        borderRadius: "12px",
        boxShadow: pulse ? PULSE_SHADOW : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        transform: pulse ? "scale(1.01)" : "scale(1)",
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[14px] font-medium">{a.name}</p>
          {a.isDefault ? (
            <span className="text-[10px] font-medium text-[#3b82f6] bg-[#eff6ff] px-1.5 py-0 rounded">기본</span>
          ) : (
            <button onClick={onSetDefault} className="text-[10px] text-[#999] hover:text-[#3b82f6] cursor-pointer">
              기본으로
            </button>
          )}
        </div>
        <p className="text-[13px] text-[#444]">
          {a.zipcode ? `(${a.zipcode}) ` : ""}
          {a.address}
          {a.detailAddress ? `, ${a.detailAddress}` : ""}
        </p>
        <p className="text-[12px] text-[#999] mt-1">{a.receiver} · {a.phone}</p>
        {a.deliveryNote && <p className="text-[11px] text-[#999] mt-1">요청사항: {a.deliveryNote}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]" aria-label="수정">
          <Pencil size={13} strokeWidth={1.5} color="#999" />
        </button>
        <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]" aria-label="삭제">
          <Trash2 size={13} strokeWidth={1.5} color="#999" />
        </button>
      </div>
    </div>
  );
}
