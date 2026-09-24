/**
 * Group a flat seat list into ordered rows.
 * seats: [{ seatNumber, row, column, seatType, priceMultiplier, status }]
 * returns: [{ row: 'A', seats: [...] }, ...]
 */
export const groupSeatsByRow = (seats = []) => {
  const map = new Map();
  for (const s of seats) {
    if (!map.has(s.row)) map.set(s.row, []);
    map.get(s.row).push(s);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, list]) => ({
      row,
      seats: list.sort((a, b) => a.column - b.column),
    }));
};

export const seatTypeClasses = (seatType) => {
  switch (seatType) {
    case 'PREMIUM':
      return 'text-amber-300';
    case 'RECLINER':
      return 'text-fuchsia-300';
    default:
      return 'text-ink-300';
  }
};