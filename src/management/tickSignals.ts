/**
 * Counts owned construction sites per visible room from `Game.constructionSites` in one pass.
 * @returns Map room name → count of sites with `pos` in that room and `my === true`
 */
export function countMyConstructionSitesByRoom(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id in Game.constructionSites) {
    const site = Game.constructionSites[id as Id<ConstructionSite>];
    if (!site?.my) {
      continue;
    }
    const roomName = site.pos.roomName;
    counts[roomName] = (counts[roomName] ?? 0) + 1;
  }
  return counts;
}
