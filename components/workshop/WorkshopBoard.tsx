"use client";

import { useMemo, useState } from "react";
import { Plus, ThumbsUp, Trash2 } from "lucide-react";
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

  function handleDrop(columnId: WorkshopColumnId) {
    if (!dragId) return;
    const card = cards.find((c) => c.id === dragId);
    if (!card) return;
    const targetList = (byColumn.get(columnId) ?? []).filter((c) => c.id !== dragId);
    const moved: WorkshopCard = {
      ...card,
      columnId,
      order: targetList.length,
      updatedAt: new Date().toISOString(),
    };
    const others = cards
      .filter((c) => c.id !== dragId)
      .map((c) =>
        c.columnId === columnId && c.order >= moved.order
          ? { ...c, order: c.order + 1 }
          : c
      );
    onMove([...others, moved]);
    setDragId(null);
  }

  function toggleVote(card: WorkshopCard) {
    const has = card.votes.includes(author);
    const votes = has ? card.votes.filter((v) => v !== author) : [...card.votes, author];
    onChange({ ...card, votes, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] gap-3 p-4 sm:p-6">
      {columns.map((col) => {
        const list = byColumn.get(col.id) ?? [];
        return (
          <section
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
            className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <div className="border-b border-white/10 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold tracking-tight">{col.title}</h3>
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

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
              {list.map((card) => (
                <article
                  key={card.id}
                  draggable
                  onDragStart={() => setDragId(card.id)}
                  onDragEnd={() => setDragId(null)}
                  className="cursor-grab rounded-xl border border-white/10 bg-bla-charcoal p-3 active:cursor-grabbing"
                  style={{ boxShadow: `inset 3px 0 0 ${card.color}` }}
                >
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
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-white/25"
                  />
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
                    className="mt-1 w-full resize-none bg-transparent text-xs leading-relaxed text-bla-text-light outline-none placeholder:text-white/20"
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
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
