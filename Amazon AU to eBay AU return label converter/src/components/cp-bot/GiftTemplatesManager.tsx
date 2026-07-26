"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, Loader2, Gift, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GiftTemplate } from "@/types/cp-bot";
import { saveGiftTemplate } from "@/app/actions/saveGiftTemplate";
import { deleteGiftTemplate } from "@/app/actions/deleteGiftTemplate";

interface Props {
  initialTemplates: GiftTemplate[];
  authEnabled: boolean;
}

export function GiftTemplatesManager({ initialTemplates, authEnabled }: Props) {
  const [templates, setTemplates] = useState<GiftTemplate[]>(initialTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formFrom, setFormFrom] = useState("");

  const canAdd = templates.length < 5;

  function openAddForm() {
    setEditingId(null);
    setFormName("");
    setFormMessage("");
    setFormFrom("");
    setShowForm(true);
  }

  function openEditForm(t: GiftTemplate) {
    setEditingId(t.id);
    setFormName(t.name);
    setFormMessage(t.message);
    setFormFrom(t.from_name);
    setShowForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSave() {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      toast.error("Template name is required");
      return;
    }

    setSaving(true);
    try {
      const result = await saveGiftTemplate({
        id: editingId || undefined,
        name: trimmedName,
        message: formMessage.trim(),
        from_name: formFrom.trim(),
        position: editingId
          ? templates.findIndex((t) => t.id === editingId)
          : templates.length,
      });

      if (result.success) {
        if (editingId) {
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === editingId
                ? { ...t, name: trimmedName, message: formMessage.trim(), from_name: formFrom.trim() }
                : t
            )
          );
          toast.success("Template updated");
        } else {
          setTemplates((prev) => [
            ...prev,
            { id: result.id!, name: trimmedName, message: formMessage.trim(), from_name: formFrom.trim() },
          ]);
          toast.success("Template created");
        }
        closeForm();
      } else {
        toast.error(result.error || "Failed to save template");
      }
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteGiftTemplate(id);
      if (result.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        if (editingId === id) closeForm();
        toast.success("Template deleted");
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
        Gift Message Templates
      </h2>
      <p className="text-xs font-medium text-slate-400">
        Create up to 5 templates. Use them from the extension popup&apos;s Gift Option Settings dropdown.
      </p>

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-md">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
            <Gift className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">No templates yet</p>
            <p className="text-xs text-slate-400">
              Create templates here and select them in the extension popup.
            </p>
          </div>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className={cn(
                "flex items-start gap-3 px-5 py-3.5 transition-colors",
                editingId === t.id && showForm ? "bg-cyan-50/50" : "hover:bg-slate-50/50"
              )}
            >
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{t.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {t.message ? `"${t.message}"` : <span className="italic">No message</span>}
                </p>
                {t.from_name && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    From: {t.from_name}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEditForm(t)}
                  disabled={!!deletingId}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-cyan-600"
                  title="Edit template"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(t.id)}
                  disabled={!!deletingId}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Delete template"
                >
                  {deletingId === t.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!showForm && canAdd && (
        <button
          type="button"
          onClick={openAddForm}
          disabled={!authEnabled}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:border-cyan-400 hover:bg-cyan-50/50 hover:text-cyan-600 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Template
        </button>
      )}

      {!canAdd && !showForm && (
        <p className="text-xs font-semibold text-slate-400">
          5 of 5 templates used
        </p>
      )}

      {showForm && (
        <div className="space-y-4 rounded-2xl border border-cyan-200 bg-cyan-50/30 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-700">
              {editingId ? "Edit Template" : "New Template"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Template Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Standard Thank You"
              maxLength={50}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              For reference only — shown in the extension popup dropdown.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Gift Message
            </label>
            <textarea
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder="Thank you for shopping with us!"
              maxLength={240}
              rows={3}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              FROM
            </label>
            <input
              type="text"
              value={formFrom}
              onChange={(e) => setFormFrom(e.target.value)}
              placeholder="Your Store Name"
              maxLength={100}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !authEnabled}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingId ? "Update Template" : "Save Template"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="text-xs font-bold text-slate-400 transition hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
