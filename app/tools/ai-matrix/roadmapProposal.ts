import {
  type PriorityStatus,
  type UseCase,
  calcScore,
  getQuadrant,
  normalizePriorityStatus,
  sortUseCasesByScore,
} from './types';
import { suggestionFor } from './deliverySuggestions';

/** Target sizes for first roadmap proposal (active cases only; Kill separate). */
export const ROADMAP_TARGETS = {
  now: 8,
  near: 12,
  next: 16,
  // later = remainder
} as const;

function roadmapWeight(uc: UseCase): number {
  let w = calcScore(uc.scores);
  const q = getQuadrant(uc);
  if (q === 'quick') w += 0.45;
  if (q === 'strategic') w += 0.15;
  if (q === 'low') w -= 0.1;
  if (q === 'later') w -= 0.35;
  if (uc.isWinner) w += 0.25;
  if (uc.buildInClaudeCode) w += 0.35;
  if (uc.claudeFit === 'good') w += 0.15;
  if (uc.claudeFit === 'blocked') w -= 0.2;
  return w;
}

/**
 * First-cut roadmap from workshop scores + fit signals.
 * Kill from our suggestions (or existing kill). Rest bucketed Now → Near → Next → Later.
 * Also sets delivery suggestions where missing and re-ranks globally.
 */
export function proposeRoadmap(cases: UseCase[]): UseCase[] {
  const withDelivery = cases.map((uc) => {
    const sug = suggestionFor(uc.id);
    const existing = uc.priorityStatus ? normalizePriorityStatus(uc.priorityStatus) : undefined;
    const suggestedKill = sug.priorityStatus === 'kill';
    return {
      uc,
      sug,
      isKill: existing === 'kill' || suggestedKill,
    };
  });

  const kills = withDelivery.filter((x) => x.isKill);
  const active = withDelivery
    .filter((x) => !x.isKill)
    .sort((a, b) => {
      const diff = roadmapWeight(b.uc) - roadmapWeight(a.uc);
      return diff !== 0 ? diff : a.uc.id.localeCompare(b.uc.id);
    });

  const nowN = ROADMAP_TARGETS.now;
  const nearN = ROADMAP_TARGETS.near;
  const nextN = ROADMAP_TARGETS.next;

  const assigned: UseCase[] = [];

  active.forEach((item, i) => {
    let status: PriorityStatus;
    if (i < nowN) status = 'now';
    else if (i < nowN + nearN) status = 'near';
    else if (i < nowN + nearN + nextN) status = 'next';
    else status = 'later';

    assigned.push({
      ...item.uc,
      priorityStatus: status,
      deliveryPartners: item.uc.deliveryPartners?.length
        ? item.uc.deliveryPartners
        : item.sug.deliveryPartners,
    });
  });

  kills.forEach((item) => {
    assigned.push({
      ...item.uc,
      priorityStatus: 'kill',
      deliveryPartners: item.uc.deliveryPartners?.length
        ? item.uc.deliveryPartners
        : item.sug.deliveryPartners,
    });
  });

  // Rank: Now → Near → Next → Later → Kill, within bucket by weight/score
  const order: PriorityStatus[] = ['now', 'near', 'next', 'later', 'kill'];
  const ranked = [...assigned].sort((a, b) => {
    const ai = order.indexOf(normalizePriorityStatus(a.priorityStatus));
    const bi = order.indexOf(normalizePriorityStatus(b.priorityStatus));
    if (ai !== bi) return ai - bi;
    const diff = roadmapWeight(b) - roadmapWeight(a);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  return ranked.map((uc, i) => ({ ...uc, priorityRank: i }));
}

/** Soft migrate backlog → later without reshuffling ranks. */
export function migrateLegacyStatuses(cases: UseCase[]): UseCase[] {
  return cases.map((uc) => ({
    ...uc,
    priorityStatus: normalizePriorityStatus(uc.priorityStatus ?? 'later'),
    deliveryPartners: uc.deliveryPartners?.length
      ? uc.deliveryPartners
      : suggestionFor(uc.id).deliveryPartners,
    priorityRank:
      typeof uc.priorityRank === 'number'
        ? uc.priorityRank
        : undefined,
  }));
}

export function ensureRanks(cases: UseCase[]): UseCase[] {
  if (cases.every((uc) => typeof uc.priorityRank === 'number')) return cases;
  return sortUseCasesByScore(cases).map((uc, i) => ({
    ...uc,
    priorityRank: typeof uc.priorityRank === 'number' ? uc.priorityRank : i,
  }));
}
