"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Plus, ThumbsUp, Trash2, User } from "lucide-react";
import type { WorkshopCard, WorkshopColumn, WorkshopColumnId } from "@/lib/workshop-types";

type Props = {
  columns: WorkshopColumn[];
  cards: WorkshopCard[];
  author: string;
  active?: boolean;
  onAdd: (columnId: WorkshopColumnId) => void;
  onChange: (card: WorkshopCard) => void;
  onDelete: (id: string) => void;
  onChangeColumn: (column: WorkshopColumn) => void;
  onAddColumn: () => void;
  onDeleteColumn: (id: WorkshopColumnId) => void;
};

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  className,
  active = true,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  active?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, active]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={className}
    />
  );
}

export default function WorkshopBoard({
  columns,
  cards,
  author,
  active = true,
  onAdd,
  onChange,
  onDelete,
  onChangeColumn,
  onAddColumn,
  onDeleteColumn,
}: Props) {
  const byColumn = useMemo(() => {
    const map = new Map<WorkshopColumnId, WorkshopCard[]>();
    for (const col of columns) map.set(col.id, []);
    for (const card of [...cards].sort((a, b) => a.order - b.order)) {
      const list = map.get(card.columnId);
      if (list) list.push(card);
    }
    return map;
  }, [cards, columns]);

  function toggleVote(card: WorkshopCard) {
    const has = card.votes.includes(author);
    const votes = has ? card.votes.filter((v) => v !== author) : [...card.votes, author];
    onChange({ ...card, votes, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] gap-4 overflow-x-auto p-4 sm:p-6">
      {columns.map((col) => {
        const list = byColumn.get(col.id) ?? [];
        const accent = col.color;

        return (
          <section
            key={col.id}
            data-view-item
            className="group/col flex w-[min(100%,340px)] shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] sm:w-[360px]"
            style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
          >
            <div className="border-b border-white/10 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <input
                    value={col.title}
                    onChange={(e) => onChangeColumn({ ...col, title: e.target.value })}
                    placeholder="Sectietitel"
                    className="w-full bg-transparent text-sm font-bold tracking-tight outline-none placeholder:text-white/25"
                  />
                  <AutoGrowTextarea
                    value={col.hint}
                    onChange={(hint) => onChangeColumn({ ...col, hint })}
                    placeholder="Beschrijving"
                    active={active}
                    className="mt-0.5 w-full resize-none bg-transparent text-[11px] leading-snug text-bla-text-muted outline-none placeholder:text-white/25"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDeleteColumn(col.id)}
                    className="rounded-md p-1 text-bla-text-muted opacity-100 transition hover:text-red-300 md:opacity-0 md:group-hover/col:opacity-100 md:group-focus-within/col:opacity-100 md:focus-visible:opacity-100"
                    aria-label="Verwijder sectie"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-bla-text-muted">
                    {list.length}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAdd(col.id)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 py-1.5 text-xs text-bla-text-muted transition hover:border-bla-lime/50 hover:text-bla-lime"
              >
                <Plus className="h-3.5 w-3.5" /> Kaart
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
              {list.map((card) => (
                <article
                  key={card.id}
                  className="group rounded-xl border border-white/10 bg-bla-charcoal"
                  style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
                >
                  <div className="p-3 pb-0">
                    <input
                      value={card.title}
                      onChange={(e) =>
                        onChange({
                          ...card,
                          title: e.target.value,
                          updatedAt: new Date().toISOString(),
                        })
                      }
                      placeholder="Titel"
                      className="w-full bg-transparent py-0.5 text-sm font-semibold outline-none placeholder:text-white/25"
                    />
                  </div>
                  <div className="px-3 pb-3">
                    <AutoGrowTextarea
                      value={card.body}
                      onChange={(body) =>
                        onChange({
                          ...card,
                          body,
                          updatedAt: new Date().toISOString(),
                        })
                      }
                      placeholder="Notitie…"
                      active={active}
                      className="mt-1 w-full resize-none overflow-hidden bg-transparent text-xs leading-relaxed text-bla-text-light outline-none placeholder:text-white/20"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <User className="h-3 w-3 shrink-0 text-white/35" />
                        <span className="truncate text-[11px] text-white/55">
                          {card.author || "anon"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleVote(card)}
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] ${
                            card.votes.includes(author)
                              ? "bg-bla-lime/20 text-bla-lime"
                              : "text-bla-text-muted hover:text-white"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {card.votes.length}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(card.id)}
                          className="rounded-md p-1 text-bla-text-muted opacity-100 transition hover:text-red-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus-visible:opacity-100"
                          aria-label="Verwijder"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {list.length === 0 && (
                <p className="px-2 py-6 text-center text-[11px] text-white/25">
                  Voeg een kaart toe
                </p>
              )}
            </div>
          </section>
        );
      })}

      <button
        type="button"
        data-view-item
        onClick={onAddColumn}
        className="flex w-[min(100%,340px)] min-h-[220px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-bla-text-muted transition hover:border-bla-lime/50 hover:text-bla-lime sm:w-[360px]"
      >
        <Plus className="h-5 w-5" />
        <span className="text-sm font-medium">Nieuwe sectie</span>
      </button>
    </div>
  );
}
