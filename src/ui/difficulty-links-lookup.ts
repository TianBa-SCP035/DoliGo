import type { SceneDifficultyItem } from "./SceneDifficultyLinks";
import type { DifficultyMark } from "./difficulty-ui";
import { isDifficultyTier } from "./difficulty-ui";

export type DifficultyLinkDoc = {
  id: string;
  title: string;
  parentSceneId?: string;
  difficulty?: DifficultyMark;
};

export type DifficultyLinkCatalog = {
  scenes: readonly DifficultyLinkDoc[];
  readings?: readonly DifficultyLinkDoc[];
};

const TIER_RANK: Record<string, number> = {
  foundational: 0,
  everyday: 1,
  advanced: 2,
};

function difficultyMark(
  value: DifficultyLinkDoc["difficulty"],
): DifficultyMark | undefined {
  if (!value || !isDifficultyTier(value.tier)) return undefined;
  return value;
}

function familyRootId(scene: DifficultyLinkDoc | undefined, fallbackId: string): string {
  if (!scene) return fallbackId;
  return scene.parentSceneId || scene.id;
}

function familyScenes(
  catalog: DifficultyLinkCatalog,
  rootId: string,
): DifficultyLinkDoc[] {
  return catalog.scenes.filter(
    (scene) => scene.id === rootId || scene.parentSceneId === rootId,
  );
}

function toItem(scene: DifficultyLinkDoc): SceneDifficultyItem {
  return {
    id: scene.id,
    title: scene.title,
    route: `#/scenes/${scene.id}`,
    kind: "scene",
    difficulty: difficultyMark(scene.difficulty),
  };
}

function sortItems(
  items: SceneDifficultyItem[],
  rootId?: string,
): SceneDifficultyItem[] {
  return [...items].sort((a, b) => {
    if (rootId && a.id === rootId && b.id !== rootId) return -1;
    if (rootId && b.id === rootId && a.id !== rootId) return 1;
    const tierA = a.difficulty?.tier ? TIER_RANK[a.difficulty.tier] ?? 99 : 99;
    const tierB = b.difficulty?.tier ? TIER_RANK[b.difficulty.tier] ?? 99 : 99;
    if (tierA !== tierB) return tierA - tierB;
    return a.title.localeCompare(b.title, "zh");
  });
}

/** Parent first, then official extensions by tier and title. Includes the current page. */
export function orderedSceneFamilyItems(
  catalog: DifficultyLinkCatalog,
  docId: string,
): SceneDifficultyItem[] {
  if (!docId) return [];
  const current = catalog.scenes.find((scene) => scene.id === docId);
  const rootId = familyRootId(current, docId);
  const members = familyScenes(catalog, rootId);
  return sortItems(
    members.filter((scene) => scene.title).map(toItem),
    rootId,
  );
}

/**
 * Same-scene family links (parent scene + official extensions).
 * Uses catalog entries already hung in 4174. Does not read draft practice packs,
 * and does not invent word-tier group routes.
 * When App passes difficultyLinks, the view should keep that list instead.
 */
export function difficultyLinksForDocument(
  catalog: DifficultyLinkCatalog,
  kind: "scene" | "reading",
  docId: string,
): { sceneTitle?: string; items: SceneDifficultyItem[] } {
  if (kind !== "scene" || !docId) return { items: [] };
  const current = catalog.scenes.find((scene) => scene.id === docId);
  const rootId = familyRootId(current, docId);
  const members = familyScenes(catalog, rootId);
  const root = members.find((scene) => scene.id === rootId) ?? current;
  const items = orderedSceneFamilyItems(catalog, docId).filter(
    (item) => item.id !== docId,
  );
  return {
    sceneTitle: root?.title,
    items,
  };
}
