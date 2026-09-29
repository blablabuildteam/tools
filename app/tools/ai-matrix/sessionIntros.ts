export type SessionIntro = {
  eyebrow: string;
  paragraphs: string[];
  cta: string;
};

export type SessionUiProfile = {
  intro?: SessionIntro;
  /** Hide Claude Cases tab (StasDock client board). */
  hideClaudeCases?: boolean;
  /** Hide Help / workshop how-to tab. */
  hideHelp?: boolean;
};

/** Client-facing session UI — keyed by matrix session id. Adsomnia etc. stay default. */
export const SESSION_PROFILES: Record<string, SessionUiProfile> = {
  "stasdock-matrix": {
    hideClaudeCases: true,
    hideHelp: true,
    intro: {
      eyebrow: "StasDock · AI matrix",
      paragraphs: [
        "StasDock maakt premium fietsophangsystemen. Ze staan in de aanloop naar StasDock 2.0: nieuwe branding, nieuwe frontend — en daar hoort idealiter ook meer innovatie met AI bij.",
        "Op dit bord zetten we AI-kansen naast elkaar en scoren we wat eerst loont: kosten, omzet, efficiency, snelheid.",
      ],
      cta: "Naar de matrix",
    },
  },
};

export function getSessionProfile(sessionId: string): SessionUiProfile | null {
  const key = sessionId.trim().toLowerCase();
  return SESSION_PROFILES[key] ?? null;
}

export function getSessionIntro(sessionId: string): SessionIntro | null {
  return getSessionProfile(sessionId)?.intro ?? null;
}
