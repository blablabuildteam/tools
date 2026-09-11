'use client';

import { useState, useCallback } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  Save,
  Target,
  Trash2,
  Users,
  Zap,
  X,
  Check,
  Lightbulb,
  Settings,
} from 'lucide-react';
import type { ProjectPlan, BlaBlaRecommendation } from './projectPlanTypes';
import {
  emptyProjectPlan,
  getSolutionsText,
  RECOMMENDATION_CATEGORIES,
  EFFORT_WEEKS,
} from './projectPlanTypes';
import type { FeaturePhaseAssignment, FeaturePriority } from './prioritizeMeta';
import {
  FEATURE_PRIORITY_META,
  normalizeFeaturePriority,
} from './prioritizeMeta';
import type { UseCase } from './types';
import { resolveFeatureCopy } from './projectPlanHelpers';

interface ProjectPlanPanelProps {
  projectId: string;
  projectName: string;
  plan?: ProjectPlan;
  members: UseCase[];
  featurePhases: Record<string, FeaturePhaseAssignment>;
  recommendations: BlaBlaRecommendation[];
  onPlanChange: (plan: ProjectPlan) => void;
  onFeaturePhaseChange: (caseId: string, assignment: Partial<FeaturePhaseAssignment>) => void;
  onRecommendationAction: (recId: string, action: 'approve' | 'reject', reason?: string) => void;
  onFeatureUpdate?: (caseId: string, updates: { name?: string; description?: string }) => void;
  onFeatureDelete?: (caseId: string) => void;
  onAddFeature?: (feature: {
    name: string;
    description: string;
    priority: FeaturePriority;
    effort: 'xs' | 's' | 'm' | 'l' | 'xl';
  }) => void;
}

function PlanSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <Icon className="h-4 w-4 text-bla-lime/70" />
        <span className="flex-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
          {title}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronRight className="h-4 w-4 text-white/40" />
        )}
      </button>
      {open && <div className="border-t border-white/8 px-4 py-3">{children}</div>}
    </div>
  );
}

function EditableText({
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = useCallback(() => {
    onChange(draft.trim());
    setEditing(false);
  }, [draft, onChange]);

  if (editing) {
    return (
      <div className="space-y-2">
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full resize-none rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[13px] text-white/85"
            rows={3}
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[13px] text-white/85"
            placeholder={placeholder}
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-lg border border-bla-lime/30 bg-bla-lime/10 px-3 py-1 text-[12px] text-bla-lime"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="rounded-lg border border-white/10 px-3 py-1 text-[12px] text-white/50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="group flex w-full items-start gap-2 text-left"
    >
      <span
        className={`flex-1 text-[13px] leading-relaxed ${
          value ? 'text-white/70' : 'italic text-white/30'
        }`}
      >
        {value || placeholder}
      </span>
      <Edit2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function EditableList({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [newItem, setNewItem] = useState('');
  const [editing, setEditing] = useState(false);

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...values, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {values.length > 0 ? (
        <ul className="space-y-1.5">
          {values.map((item, i) => (
            <li
              key={i}
              className="group flex items-start gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
            >
              <span className="flex-1 text-[13px] text-white/70">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="shrink-0 text-white/20 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] italic text-white/30">{placeholder}</p>
      )}
      {editing ? (
        <div className="flex gap-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-1.5 text-[13px] text-white/85"
            placeholder="Add item..."
            autoFocus
          />
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg border border-bla-lime/30 bg-bla-lime/10 px-3 py-1.5 text-[12px] text-bla-lime"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-white/50"
          >
            Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/60"
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </button>
      )}
    </div>
  );
}

function FeatureCard({
  uc,
  assignment,
  onPhaseChange,
  onFeatureUpdate,
  onFeatureDelete,
}: {
  uc: UseCase;
  assignment?: FeaturePhaseAssignment;
  onPhaseChange: (patch: Partial<FeaturePhaseAssignment>) => void;
  onFeatureUpdate?: (updates: { name?: string; description?: string }) => void;
  onFeatureDelete?: () => void;
}) {
  const copy = resolveFeatureCopy(uc, assignment);
  const priority = normalizeFeaturePriority(assignment?.priority || assignment?.phase);
  const effort = assignment?.effort || 'm';
  const priorityMeta = FEATURE_PRIORITY_META[priority];
  const effortMeta = EFFORT_WEEKS[effort];
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(copy.title);
  const [draftDesc, setDraftDesc] = useState(copy.description);

  const cyclePriority = () => {
    const priorities: FeaturePriority[] = ['high', 'medium', 'low', 'backlog'];
    const currentIndex = priorities.indexOf(priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    onPhaseChange({ priority: priorities[nextIndex] });
  };

  const saveEdit = () => {
    const title = draftName.trim() || copy.title;
    const description = draftDesc.trim();
    onPhaseChange({
      transformedTitle: title,
      transformedDescription: description,
    });
    if (onFeatureUpdate) {
      onFeatureUpdate({ name: title, description });
    }
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[14px] font-medium text-white"
                placeholder="Feature name"
                autoFocus
              />
              <textarea
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[12px] text-white/80"
                placeholder="Feature description — what we build"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="flex items-center gap-1 rounded-lg border border-bla-lime/30 bg-bla-lime/10 px-3 py-1 text-[12px] text-bla-lime"
                >
                  <Save className="h-3 w-3" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(copy.title);
                    setDraftDesc(copy.description);
                    setEditing(false);
                  }}
                  className="rounded-lg border border-white/10 px-3 py-1 text-[12px] text-white/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  className="group min-w-0 flex-1 text-left"
                  onClick={() => {
                    setDraftName(copy.title);
                    setDraftDesc(copy.description);
                    setEditing(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-white">{copy.title}</p>
                    <Edit2 className="h-3 w-3 shrink-0 text-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  {copy.description && (
                    <p className="mt-1 text-[12px] leading-relaxed text-white/50">{copy.description}</p>
                  )}
                </button>
                {onFeatureDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete feature “${copy.title}”?`)) {
                        onFeatureDelete();
                      }
                    }}
                    className="mt-0.5 shrink-0 rounded-md p-1 text-white/25 transition-colors hover:bg-red-400/10 hover:text-red-300"
                    title="Delete feature"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={cyclePriority}
              className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors hover:opacity-80 ${priorityMeta.border} ${priorityMeta.bg} ${priorityMeta.color}`}
              title="Click to change priority"
            >
              {priorityMeta.short}
            </button>
            <span className="font-mono text-[10px] text-white/40">{effortMeta.label.split(' ')[0]}</span>
          </div>
        )}
      </div>

      {!editing && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
              Priority
            </span>
            {(['high', 'medium', 'low', 'backlog'] as const).map((p) => {
              const m = FEATURE_PRIORITY_META[p];
              const active = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPhaseChange({ priority: p })}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${
                    active
                      ? `${m.border} ${m.bg} ${m.color}`
                      : 'border-white/10 text-white/30 hover:text-white/50'
                  }`}
                >
                  {m.short}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">Effort</span>
            {(['xs', 's', 'm', 'l', 'xl'] as const).map((e) => {
              const active = effort === e;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => onPhaseChange({ effort: e })}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase ${
                    active
                      ? 'border-white/30 bg-white/10 text-white/80'
                      : 'border-white/10 text-white/30 hover:text-white/50'
                  }`}
                >
                  {e.toUpperCase()}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  onAction,
}: {
  rec: BlaBlaRecommendation;
  onAction: (action: 'approve' | 'reject', reason?: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const catMeta = RECOMMENDATION_CATEGORIES[rec.category];
  const priority = normalizeFeaturePriority(rec.suggestedPriority || rec.suggestedPhase);
  const phaseMeta = FEATURE_PRIORITY_META[priority];
  const effortMeta = EFFORT_WEEKS[rec.effort];

  if (rec.status === 'approved') {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-400/70">
            Approved · blablabuild
          </span>
        </div>
        <p className="mt-2 text-[14px] font-medium text-white">{rec.title}</p>
        <p className="mt-1 text-[12px] text-white/50">{rec.description}</p>
      </div>
    );
  }

  if (rec.status === 'rejected') {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.01] p-3 opacity-50">
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-white/40" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
            Rejected
          </span>
        </div>
        <p className="mt-2 text-[14px] font-medium text-white/60">{rec.title}</p>
        {rec.rejectedReason && (
          <p className="mt-1 text-[12px] italic text-white/40">Reason: {rec.rejectedReason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-400/70">
              blablabuild Recommendation
            </span>
          </div>
          <p className="mt-2 text-[14px] font-medium text-white">{rec.title}</p>
          <p className="mt-1 text-[12px] text-white/60">{rec.description}</p>
          <p className="mt-2 text-[12px] text-white/40">
            <span className="text-white/60">Rationale:</span> {rec.rationale}
          </p>
          <p className="mt-1 text-[12px] text-white/40">
            <span className="text-white/60">Expected value:</span> {rec.expectedValue}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="font-mono text-[10px] text-white/40">
            {catMeta.icon} {catMeta.label}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${phaseMeta.border} ${phaseMeta.bg} ${phaseMeta.color}`}
          >
            {phaseMeta.short}
          </span>
          <span className="font-mono text-[10px] text-white/40">{effortMeta.label.split(' ')[0]}</span>
        </div>
      </div>

      {showReject ? (
        <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[13px] text-white/85"
            placeholder="Reason for rejecting (optional)"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onAction('reject', rejectReason || undefined);
                setShowReject(false);
              }}
              className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1 text-[12px] text-red-300"
            >
              Confirm Reject
            </button>
            <button
              type="button"
              onClick={() => setShowReject(false)}
              className="rounded-lg border border-white/10 px-3 py-1 text-[12px] text-white/50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2 border-t border-white/8 pt-3">
          <button
            type="button"
            onClick={() => onAction('approve')}
            className="flex items-center gap-1.5 rounded-lg border border-bla-lime/30 bg-bla-lime/10 px-3 py-1.5 text-[12px] text-bla-lime"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-white/50 hover:text-white/70"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProjectPlanPanel({
  projectId,
  projectName,
  plan: initialPlan,
  members,
  featurePhases,
  recommendations,
  onPlanChange,
  onFeaturePhaseChange,
  onRecommendationAction,
  onFeatureUpdate,
  onFeatureDelete,
  onAddFeature,
}: ProjectPlanPanelProps) {
  const plan = initialPlan || emptyProjectPlan();
  
  const pendingRecs = recommendations.filter((r) => r.status === 'suggested');
  const approvedRecs = recommendations.filter((r) => r.status === 'approved');
  
  const updatePlan = useCallback(
    (patch: Partial<ProjectPlan>) => {
      onPlanChange({ ...plan, ...patch, updatedAt: new Date().toISOString() });
    },
    [plan, onPlanChange]
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<FeaturePriority>('medium');
  const [newEffort, setNewEffort] = useState<'xs' | 's' | 'm' | 'l' | 'xl'>('m');

  const submitNewFeature = () => {
    if (!onAddFeature || !newTitle.trim()) return;
    onAddFeature({
      name: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      effort: newEffort,
    });
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setNewEffort('m');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Problem & Opportunity */}
      <PlanSection title="Problem & Opportunity" icon={Target} defaultOpen>
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              Problem Statement
            </p>
            <EditableText
              value={plan.problemStatement}
              onChange={(v) => updatePlan({ problemStatement: v })}
              placeholder="What pain or gap exists today?"
              multiline
            />
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              Opportunity
            </p>
            <EditableText
              value={plan.opportunity}
              onChange={(v) => updatePlan({ opportunity: v })}
              placeholder="What becomes possible?"
              multiline
            />
          </div>
        </div>
      </PlanSection>

      {/* Solutions */}
      <PlanSection title="Solutions" icon={Zap}>
        <EditableText
          value={getSolutionsText(plan)}
          onChange={(v) => updatePlan({ solutions: v })}
          placeholder="Describe the overall solution approach..."
          multiline
        />
      </PlanSection>

      {/* Impact & Value */}
      <PlanSection title="Impact & Business Value" icon={Target}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              Expected Impact
            </p>
            <EditableText
              value={plan.expectedImpact}
              onChange={(v) => updatePlan({ expectedImpact: v })}
              placeholder="Measurable outcomes"
              multiline
            />
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              Business Value
            </p>
            <EditableText
              value={plan.businessValue}
              onChange={(v) => updatePlan({ businessValue: v })}
              placeholder="Revenue, cost, or efficiency impact"
              multiline
            />
          </div>
        </div>
      </PlanSection>

      {/* Target Audience */}
      <PlanSection title="Target Audience" icon={Users}>
        <EditableList
          values={plan.targetAudience}
          onChange={(v) => updatePlan({ targetAudience: v })}
          placeholder="Who benefits from this?"
        />
      </PlanSection>

      {/* Features & Functionalities */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Zap className="h-4 w-4 text-bla-lime/70" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
            Features & Functionalities
          </span>
        </div>
        <div className="space-y-2 border-t border-white/8 px-4 py-3">
          {members.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-white/40">No features in this project</p>
          ) : (
            members.map((uc) => (
              <FeatureCard
                key={uc.id}
                uc={uc}
                assignment={featurePhases[uc.id]}
                onPhaseChange={(patch) => onFeaturePhaseChange(uc.id, patch)}
                onFeatureUpdate={onFeatureUpdate ? (updates) => onFeatureUpdate(uc.id, updates) : undefined}
                onFeatureDelete={onFeatureDelete ? () => onFeatureDelete(uc.id) : undefined}
              />
            ))
          )}
          {onAddFeature && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-[13px] text-white/40 transition-colors hover:border-bla-lime/30 hover:bg-bla-lime/5 hover:text-bla-lime"
            >
              <Plus className="h-4 w-4" />
              Add New Feature
            </button>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0d0f12] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-host text-[17px] font-medium text-white">Add feature</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/40 hover:text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-[12px] text-white/40">
              Describe the solution feature — not the original pain point.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Feature title
                </span>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[14px] text-white"
                  placeholder="e.g. Daily send-quota optimizer"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Feature description
                </span>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[13px] text-white/85"
                  placeholder="What we build and the outcome it delivers"
                />
              </label>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Priority
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(['high', 'medium', 'low', 'backlog'] as const).map((p) => {
                    const m = FEATURE_PRIORITY_META[p];
                    const active = newPriority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${
                          active
                            ? `${m.border} ${m.bg} ${m.color}`
                            : 'border-white/10 text-white/35 hover:text-white/60'
                        }`}
                      >
                        {m.short}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Effort
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(['xs', 's', 'm', 'l', 'xl'] as const).map((e) => {
                    const active = newEffort === e;
                    return (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setNewEffort(e)}
                        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase ${
                          active
                            ? 'border-white/30 bg-white/10 text-white/80'
                            : 'border-white/10 text-white/35 hover:text-white/60'
                        }`}
                      >
                        {e.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-[13px] text-white/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNewFeature}
                disabled={!newTitle.trim()}
                className="rounded-lg border border-bla-lime/30 bg-bla-lime/10 px-3 py-1.5 text-[13px] text-bla-lime disabled:opacity-40"
              >
                Add feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technical Approach */}
      <PlanSection title="Technical Approach" icon={Settings}>
        <EditableText
          value={plan.technicalApproach}
          onChange={(v) => updatePlan({ technicalApproach: v })}
          placeholder="High-level how"
          multiline
        />
      </PlanSection>

      {/* Risks & Dependencies */}
      <PlanSection title="Risks & Dependencies" icon={AlertTriangle}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              Risks
            </p>
            <EditableList
              values={plan.risks}
              onChange={(v) => updatePlan({ risks: v })}
              placeholder="What could go wrong?"
            />
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              Dependencies
            </p>
            <EditableList
              values={plan.dependencies}
              onChange={(v) => updatePlan({ dependencies: v })}
              placeholder="What does this need to succeed?"
            />
          </div>
        </div>
      </PlanSection>

      {/* blablabuild Recommendations */}
      {(pendingRecs.length > 0 || approvedRecs.length > 0) && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.02]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-4 w-4 text-amber-400/70" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber-400/60">
                blablabuild Recommendations
              </span>
            </div>
            {pendingRecs.length > 0 && (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] text-amber-300">
                {pendingRecs.length} pending
              </span>
            )}
          </div>
          <div className="space-y-3 border-t border-amber-400/10 px-4 py-3">
            {pendingRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onAction={(action, reason) => onRecommendationAction(rec.id, action, reason)}
              />
            ))}
            {approvedRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onAction={(action, reason) => onRecommendationAction(rec.id, action, reason)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
