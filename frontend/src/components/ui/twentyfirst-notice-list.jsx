'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Pencil, Trash2, Check, X } from 'lucide-react';

/**
 * NoticeItem -- Individual draggable announcement row
 */
function NoticeItem({
  item,
  isEditing,
  editValue,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
        backgroundColor: '#ffffff',
        zIndex: 50,
      }}
      transition={{ duration: 0.18 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 12px',
        background: isEditing ? '#ffffff' : '#f8faf9',
        border: isEditing ? '1px solid #1e5038' : '1px solid #e2ece6',
        borderRadius: '10px',
        boxSizing: 'border-box',
        width: '100%',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* 21st.dev: Tactile Drag Handle */}
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'grab',
          padding: '4px',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          touchAction: 'none',
          borderRadius: '6px',
        }}
        title="Hold and drag to reorder"
        aria-label="Hold and drag to reorder"
      >
        <GripVertical size={16} strokeWidth={2.2} />
      </button>

      {/* Message Text or Inline Editor */}
      {isEditing ? (
        <div style={{ display: 'flex', flex: 1, minWidth: 0, alignItems: 'center', gap: '6px' }}>
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            maxLength={250}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #1e5038',
              fontSize: '0.84rem',
              color: '#1a3028',
              outline: 'none',
              background: '#fff',
            }}
          />
          <button
            type="button"
            onClick={onSaveEdit}
            style={{
              background: '#e8f5ee',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#1e5038',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Save"
            aria-label="Save"
          >
            <Check size={15} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Cancel"
            aria-label="Cancel"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <span
          onDoubleClick={onStartEdit}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: '0.84rem',
            color: '#1a3028',
            cursor: 'text',
            wordBreak: 'break-word',
            lineHeight: 1.35,
          }}
          title="Double-click or tap pencil to edit"
        >
          {item.text}
        </span>
      )}

      {/* Action buttons (Pencil & Trash) */}
      {!isEditing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onStartEdit}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1e5038';
              e.currentTarget.style.background = '#e8f5ee';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.background = 'none';
            }}
            title="Edit announcement"
            aria-label="Edit announcement"
          >
            <Pencil size={15} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
            title="Delete announcement"
            aria-label="Delete announcement"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      )}
    </Reorder.Item>
  );
}

/**
 * TwentyFirstNoticeList -- 21st.dev
 * Draggable reorderable list of announcements with tactile drag handles,
 * sleek pencil icon, and inline editing.
 *
 * @param {object} props
 * @param {string[]} props.messages - Array of notice announcement strings
 * @param {(newMessages: string[]) => void} props.onChange - Callback with reordered strings
 */
export default function TwentyFirstNoticeList({ messages = [], onChange }) {
  // Map strings to objects with stable unique IDs
  const idGenRef = useRef(1);
  const [items, setItems] = useState(() =>
    messages.map((text) => ({ id: `notice-item-${idGenRef.current++}`, text }))
  );

  // Sync internal items when parent messages change externally (e.g. initial load, defaults, add)
  useEffect(() => {
    setItems((prevItems) => {
      // Check if text sequence matches current items
      const currentTexts = prevItems.map((i) => i.text);
      if (
        currentTexts.length === messages.length &&
        currentTexts.every((txt, idx) => txt === messages[idx])
      ) {
        return prevItems; // No change needed
      }

      // Rebuild with stable IDs where possible
      return messages.map((text, idx) => {
        if (prevItems[idx] && prevItems[idx].text === text) {
          return prevItems[idx];
        }
        return { id: `notice-item-${idGenRef.current++}`, text };
      });
    });
  }, [messages]);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.text);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    const updated = items.map((i) => (i.id === editingId ? { ...i, text: trimmed } : i));
    setItems(updated);
    onChange?.(updated.map((i) => i.text));
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (itemId) => {
    const updated = items.filter((i) => i.id !== itemId);
    setItems(updated);
    onChange?.(updated.map((i) => i.text));
    if (editingId === itemId) setEditingId(null);
  };

  const handleReorder = (newItems) => {
    setItems(newItems);
    onChange?.(newItems.map((i) => i.text));
  };

  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '24px 16px',
          color: '#6b8a7a',
          fontSize: '0.84rem',
          background: '#f8faf9',
          border: '1px dashed #d4ddd8',
          borderRadius: '10px',
        }}
      >
        No announcements added yet. Add one above or click &quot;Defaults&quot;.
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={handleReorder}
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
      }}
    >
      {items.map((item) => (
        <NoticeItem
          key={item.id}
          item={item}
          isEditing={editingId === item.id}
          editValue={editValue}
          onStartEdit={() => handleStartEdit(item)}
          onEditChange={setEditValue}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={() => handleDelete(item.id)}
        />
      ))}
    </Reorder.Group>
  );
}
