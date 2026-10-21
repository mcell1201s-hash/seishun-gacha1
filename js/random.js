// All randomness lives here. Pass a seeded source to make a run reproducible.
export function createRandom(source = Math.random) {
  return { int: (min, max) => Math.floor(source() * (max - min + 1)) + min,
    chance: probability => source() < probability,
    pick: items => items[Math.floor(source() * items.length)] };
}
