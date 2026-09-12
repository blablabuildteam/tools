"use client";

import { useMemo, useRef, useState } from "react";
import { GripVertical, Plus, ThumbsUp, Trash2 } from "lucide-react";
import type { WorkshopCard, WorkshopColumnId } from "@/lib/workshop-types";

type Column = {
  id: WorkshopColumnId;
  title: string;
  hint: string;
};

type Props = {
  columns: Column[];
  cards: WorkshopCard[];
  author: string;
  onAdd: (columnId: WorkshopColumnId) => void;
  onChange: (card: WorkshopCard) => void;
  onDelete: (id: string) => void;
  onMove: (cards: WorkshopCard[]) => void;
};

type DropTarget = { columnId: WorkshopColumnId; index: number } | null;

function reindex(cards: WorkshopCard[]): WorkshopCard[] {
  const byCol = new Map<WorkshopColumnId, WorkshopCard[]>();
  for (const c of cards) {
    const list = byCol.get(c.columnId) ?? [];
    list.push(c);
    byCol.set(c.columnId, list);
  }
  const next: WorkshopCard[] = [];
  for (const [, list] of byCol) {
    list
      .sort((a, b) => a.order - b.order)
      .forEach((c, i) => {
        next.push({ ...c, order: i });
      });
  }
  // keep cards from unknown columns
  for (const c of cards) {
    if (!next.find((x) => x.id === c.id)) next.push(c);
  }
  return next;
}

export default function WorkshopBoard({
  columns,
  cards,
  author,
  onAdd,
  onChange,
  onDelete,
  onMove,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const dragIdRef = useRef<string | null>(null);

  const byColumn = useMemo(() => {
    const map = new Map<WorkshopColumnId, WorkshopCard[]>();
    for (const col of columns) map.set(col.id, []);
    for (const card of [...cards].sort((a, b) => a.order - b.order)) {
      const list = map.get(card.columnId);
      if (list) list.push(card);
      else map.set(card.columnId, [card]);
    }
    return map;
  }, [cards, columns]);

  function applyMove(columnId: WorkshopColumnId, index: number) {
    const id = dragIdRef.current;
    if (!id) return;
    const moving = cards.find((c) => c.id === id);
    if (!moving) return;

    const without = cards.filter((c) => c.id !== id);
    const inTarget = without
      .filter((c) => c.columnId === columnId)
      .sort((a, b) => a.order - b.order);

    const clamped = Math.max(0, Math.min(index, inTarget.length));
    const moved: WorkshopCard = {
      ...moving,
      columnId,
      order: clamped,
      updatedAt: new Date().toISOString(),
    };

    const rebuiltTarget = [
      ...inTarget.slice(0, clamped),
      moved,
      ...inTarget.slice(clamped),
    ].map((c, i) => ({ ...c, order: i, columnId }));

    const others = without.filter((c) => c.columnId !== columnId);
    onMove(reindex([...others, ...rebuiltTarget]));
  }

  function toggleVote(card: WorkshopCard) {
    const has = card.votes.includes(author);
    const votes = has ? card.votes.filter((v) => v !== author) : [...card.votes, author];
    onChange({ ...card, votes, updatedAt: new Date().toISOString() });
  }

  function onColumnDragOver(e: React.DragEvent, columnId: WorkshopColumnId, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ columnId, index });
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] gap-4 overflow-x-auto p-4 sm:p-6">
      {columns.map((col) => {
        const list = byColumn.get(col.id) ?? [];
        const isOverCol = dropTarget?.columnId === col.id;

        return (
          <section
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              if ((e.target as HTMLElement).closest("[data-card]")) return;
              onColumnDragOver(e, col.id, list.length);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const index = dropTarget?.columnId === col.id ? dropTarget.index : list.length;
              applyMove(col.id, index);
              setDragId(null);
              dragIdRef.current = null;
              setDropTarget(null);
            }}
            onDragLeave={() => {}}
            className={`flex w-[min(100%,340px)] shrink-0 flex-col rounded-2xl border bg-white/[0.03] transition sm:w-[360px] ${
              isOverCol ? "border-[#ceff00]/50 bg-[#ceff00]/[0.04]" : "border-white/10"
            }`}
          >
            <div className="border-b border-white/10 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">{col.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-bla-text-muted">{col.hint}</p>
                </div>
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-bla-text-muted">
                  {list.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onAdd(col.id)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 py-1.5 text-xs text-bla-text-muted transition hover:border-bla-lime/50 hover:text-bla-lime"
              >
                <Plus className="h-3.5 w-3.5" /> Kaart
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
              {list.map((card, index) => (
                <div key={card.id}>
                  {dropTarget?.columnId === col.id &&
                    dropTarget.index === index &&
                    dragId &&
                    dragId !== card.id && (
                      <div className="mb-1 h-1 rounded-full bg-bla-lime" />
                    )}
                  <article
                    data-card
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const before = e.clientY < rect.top + rect.height / 2;
                      onColumnDragOver(e, col.id, before ? index : index + 1);
                    }}
                    className={`rounded-xl border border-white/10 bg-bla-charcoal transition ${
                      dragId === card.id ? "opacity-40" : ""
                    }`}
                    style={{ boxShadow: `inset 3px 0 0 ${card.color}` }}
                  >
                    <div className="flex items-start gap-1 p-2 pb-0">
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          dragIdRef.current = card.id;
                          setDragId(card.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", card.id);
                          // ghost looks better without default text selection
                          const ghost = e.currentTarget.parentElement?.parentElement;
                          if (ghost) e.dataTransfer.setDragImage(ghost, 20, 20);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          dragIdRef.current = null;
                          setDropTarget(null);
                        }}
                        className="mt-1 cursor-grab rounded p-1 text-white/30 hover:bg-white/5 hover:text-white/70 active:cursor-grabbing"
                        aria-label="Versleep kaart"
                        title="Slepen"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
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
                        className="w-full bg-transparent py-1 pr-2 text-sm font-semibold outline-none placeholder:text-white/25"
                      />
                    </div>
                    <div className="px-3 pb-2 pl-9">
                      <textarea
                        value={card.body}
                        onChange={(e) =>
                          onChange({
                            ...card,
                            body: e.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        placeholder="Notitie…"
                        rows={3}
                        className="w-full resize-y bg-transparent text-xs leading-relaxed text-bla-text-light outline-none placeholder:text-white/20"
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] text-bla-text-muted">{card.author}</span>
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
                            className="rounded-md p-1 text-bla-text-muted hover:text-red-300"
                            aria-label="Verwijder"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
              {dropTarget?.columnId === col.id && dropTarget.index === list.length && dragId && (
                <div className="mt-1 h-1 rounded-full bg-bla-lime" />
              )}
              {list.length === 0 && (
                <p className="px-2 py-6 text-center text-[11px] text-white/25">
                  Sleep hierheen of voeg een kaart toe
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
