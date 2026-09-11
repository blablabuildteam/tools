import { CLUSTERS_SEED_VERSION, PROJECT_CLUSTERS, type ProjectCluster } from './projectClusters';
import { CLUSTER_MIGRATION_MAP, PROJECT_CLUSTERS_V2 } from './projectClustersEnhanced';

/** Deep-ish clone of default proposal (code seed). */
export function cloneDefaultClusters(): ProjectCluster[] {
  return PROJECT_CLUSTERS.map((c) => ({
    ...c,
    caseIds: [...c.caseIds],
    primaryDelivery: c.primaryDelivery ? [...c.primaryDelivery] : undefined,
  }));
}

/**
 * Expand legacy unsplit project IDs into V2 split projects (once per seed bump).
 */
function expandLegacySplits(draft: ProjectCluster[]): ProjectCluster[] {
  const out: ProjectCluster[] = [];
  const seen = new Set<string>();

  for (const c of draft) {
    const splitIds = CLUSTER_MIGRATION_MAP[c.id];
    if (splitIds?.length) {
      for (const id of splitIds) {
        if (seen.has(id)) continue;
        seen.add(id);
        const seed = PROJECT_CLUSTERS_V2.find((s) => s.id === id);
        if (!seed) continue;
        out.push({
          id: seed.id,
          name: seed.name,
          summary: seed.summary,
          rationale: seed.rationale,
          caseIds: seed.caseIds.filter((cid) => c.caseIds.includes(cid) || seed.caseIds.includes(cid)),
          suggestedHorizon: seed.suggestedHorizon,
          primaryDelivery: seed.primaryDelivery ? [...seed.primaryDelivery] : undefined,
        });
      }
      continue;
    }
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }

  // Ensure all V2 seed projects exist after migration
  for (const seed of PROJECT_CLUSTERS) {
    if (seen.has(seed.id)) continue;
    seen.add(seed.id);
    out.push({
      ...seed,
      caseIds: [...seed.caseIds],
      primaryDelivery: seed.primaryDelivery ? [...seed.primaryDelivery] : undefined,
    });
  }

  return out;
}

/**
 * Active draft, or seed defaults.
 * When seed version bumps, refresh name/summary/rationale for known ids (keep caseIds).
 */
export function resolveClusters(
  draft: ProjectCluster[] | null | undefined,
  seedVersion?: number | null
): ProjectCluster[] {
  if (!Array.isArray(draft) || draft.length === 0) {
    return cloneDefaultClusters();
  }
  const refreshCopy = !seedVersion || seedVersion < CLUSTERS_SEED_VERSION;
  const expanded = refreshCopy ? expandLegacySplits(draft) : draft;
  const removedIds = new Set(['pm-intake']);

  return expanded
    .filter((c) => !removedIds.has(c.id))
    .map((c) => {
    const seed = PROJECT_CLUSTERS.find((s) => s.id === c.id);
    if (!seed || c.id.startsWith('custom-')) {
      return {
        ...c,
        caseIds: [...(c.caseIds || [])],
        primaryDelivery: c.primaryDelivery ? [...c.primaryDelivery] : undefined,
        suggestedHorizon: c.suggestedHorizon,
      };
    }
    return {
      ...seed,
      caseIds: [...(c.caseIds || seed.caseIds)],
      name: refreshCopy ? seed.name : c.name || seed.name,
      summary: refreshCopy ? seed.summary : c.summary || seed.summary,
      rationale: refreshCopy ? seed.rationale : c.rationale || seed.rationale,
      suggestedHorizon: c.suggestedHorizon ?? seed.suggestedHorizon,
      primaryDelivery: seed.primaryDelivery ? [...seed.primaryDelivery] : undefined,
    };
  });
}

export function unclusteredIds(clusters: ProjectCluster[], allCaseIds: string[]): string[] {
  const assigned = new Set(clusters.flatMap((c) => c.caseIds));
  return allCaseIds.filter((id) => !assigned.has(id));
}

export function projectIdForCase(clusters: ProjectCluster[], caseId: string): string | null {
  for (const c of clusters) {
    if (c.caseIds.includes(caseId)) return c.id;
  }
  return null;
}

/** Remove case from all projects, optionally place into target (or leave unclustered). */
export function moveCase(
  clusters: ProjectCluster[],
  caseId: string,
  targetProjectId: string | 'unclustered'
): ProjectCluster[] {
  const next = clusters.map((c) => ({
    ...c,
    caseIds: c.caseIds.filter((id) => id !== caseId),
  }));
  if (targetProjectId === 'unclustered') return next;
  return next.map((c) =>
    c.id === targetProjectId ? { ...c, caseIds: [...c.caseIds, caseId] } : c
  );
}

export function createProject(clusters: ProjectCluster[], name: string): ProjectCluster[] {
  const id = `custom-${slugId(name)}-${Date.now().toString(36).slice(-4)}`;
  return [
    ...clusters,
    {
      id,
      name,
      summary: '',
      rationale: '',
      caseIds: [],
      suggestedHorizon: 'later',
    },
  ];
}

export function mergeProjectInto(
  clusters: ProjectCluster[],
  fromId: string,
  intoId: string
): ProjectCluster[] {
  const from = clusters.find((c) => c.id === fromId);
  const into = clusters.find((c) => c.id === intoId);
  if (!from || !into || fromId === intoId) return clusters;
  const mergedIds = Array.from(new Set([...into.caseIds, ...from.caseIds]));
  return clusters
    .filter((c) => c.id !== fromId)
    .map((c) => (c.id === intoId ? { ...c, caseIds: mergedIds } : c));
}

export function updateProjectFields(
  clusters: ProjectCluster[],
  projectId: string,
  patch: Partial<Pick<ProjectCluster, 'name' | 'summary' | 'rationale' | 'suggestedHorizon'>>
): ProjectCluster[] {
  return clusters.map((c) => (c.id === projectId ? { ...c, ...patch } : c));
}

export function removeProject(clusters: ProjectCluster[], projectId: string): ProjectCluster[] {
  return clusters.filter((c) => c.id !== projectId);
}

export function slugId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || `project-${Date.now().toString(36)}`
  );
}
