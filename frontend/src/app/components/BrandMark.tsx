// The Charlemont Watch mark: a "C" built from apartment windows, with one
// window lit in the brand blue. Cells use currentColor and the lit window uses
// --primary, so the mark follows the light/dark theme automatically.
// Source artwork lives in docs/brand/.
const SIZE = 15;
const GAP = 3;
const CELLS: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 0], [2, 0], [3, 0], [4, 1], [4, 2], [4, 3]];
const WIDTH = 4 * SIZE + 3 * GAP;
const HEIGHT = 5 * SIZE + 4 * GAP;

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={className} aria-hidden="true" focusable="false">
      {CELLS.map(([row, col]) => (
        <rect
          key={`${row}-${col}`}
          x={col * (SIZE + GAP)}
          y={row * (SIZE + GAP)}
          width={SIZE}
          height={SIZE}
          rx={2.5}
          fill={row === 0 && col === 3 ? 'var(--primary)' : 'currentColor'}
        />
      ))}
    </svg>
  );
}
