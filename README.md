# Conway's Game of Life Library

A lightweight, framework-agnostic TypeScript library for implementing Conway's Game of Life on HTML5 Canvas.

## Features

- **Framework-agnostic**: Pure TypeScript/JavaScript, no React or other framework dependencies
- **Efficient**: Sparse matrix implementation using nested Maps for memory efficiency
- **Toroidal topology**: Optional wrap-around behavior at grid edges
- **Pattern support**: RLE (Run Length Encoded) format for loading classic Game of Life patterns
- **History/Undo**: Built-in snapshot system with compressed Uint8Array storage
- **Canvas optimized**: Uses OffscreenCanvas for pre-rendered cell tiles

## Installation

```bash
npm install dnk-conway
```

## Quick Start

```javascript
import { createConwayGame } from 'dnk-conway'

const game = createConwayGame({
	canvas: document.getElementById('my-canvas'),
	width: 800,
	height: 800,
	cellSize: 20,
	gridLines: true,
	interval: 100,
	pattern: 'bo$2bo$3o!', // Glider pattern in RLE format
	onGeneration: (generation, cellMap) => {
		console.log(`Generation ${generation}`)
	}
})

game.init()
game.start() // Begin animation
```

## API

### `createConwayGame(options: ConwayOptions): ConwayGame`

Factory function to create a new Conway Game instance.

**Options:**
- `canvas: HTMLCanvasElement` - Target canvas element
- `width: number` - Canvas width in pixels
- `height: number` - Canvas height in pixels
- `cellSize: number` - Size of each cell in pixels
- `gridLines?: boolean` - Show grid lines (default: true)
- `interval?: number` - Animation interval in milliseconds (default: 100)
- `pattern?: string | Pattern` - Initial pattern in RLE format
- `onGeneration?: (generation: number, cellMap: CellMap) => void` - Callback on each generation

### ConwayGame Methods

#### Lifecycle
- `init()` - Initialize and render the game
- `destroy()` - Clean up resources and stop animation

#### Simulation Control
- `start()` - Start automatic animation
- `stop()` - Stop animation
- `step()` - Advance one generation manually
- `reset()` - Clear the grid and stop animation
- `undo()` - Revert to previous generation
- `isRunning(): boolean` - Check if animation is running

#### State Access
- `getCellMap(): CellMap` - Get the current cell map
- `getGeneration(): number` - Get current generation number
- `getPatternRLE(): string` - Export current pattern as RLE string

#### Configuration
- `setPattern(pattern: string | Pattern)` - Load a new pattern
- `setDimensions(width: number, height: number)` - Resize canvas
- `setCellSize(size: number)` - Change cell size

#### Cell Manipulation
- `addCell(row: number, col: number)` - Add a live cell
- `removeCell(row: number, col: number)` - Remove a cell
- `coordinatesFromEvent(event: MouseEvent): [number, number]` - Convert mouse event to grid coordinates

## Pattern Format (RLE)

The library supports Run Length Encoded (RLE) patterns:

- `b` = dead cell
- `o` = live cell
- `$` = end of row
- `!` = end of pattern
- Numbers prefix runs (e.g., `3o` = three live cells)

**Example patterns:**
```javascript
const glider = 'bo$2bo$3o!'
const blinker = '3o!'
const toad = 'b3o$3o!'
```

## Advanced Usage

### Pattern Encoding/Decoding

```javascript
import { encodePattern, decodePattern } from 'dnk-conway'

// Encode cells to RLE
const cells = [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]] // Glider
const rle = encodePattern(cells) // 'bo$2bo$3o!'

// Decode RLE to cells
const cells = decodePattern('3o!') // [[0, 0], [0, 1], [0, 2]]
```

### Direct CellMap Access

```javascript
import { CellMap } from 'dnk-conway'

const cellMap = new CellMap({ x: 50, y: 50 })
cellMap.setCell(10, 10)
cellMap.setCell(10, 11)
cellMap.setCell(10, 12)

const nextGeneration = cellMap.tick()
```

## Example

See the `/example` directory for a complete vanilla JavaScript implementation with controls.

To run the example:
```bash
npm run dev
```

## Architecture

### Core Classes

- **ConwayGame**: Main API class managing canvas, animation, and game state
- **CellMap**: Sparse matrix implementation of cellular automata using `Map<number, Map<number, boolean>>`
- **CellTiles**: OffscreenCanvas optimization for pre-rendered cell graphics
- **Pattern utilities**: RLE encoding/decoding functions

### Key Implementation Details

- Sparse storage only tracks live cells, not the entire grid
- Moore neighborhood (8 surrounding cells) for neighbor counting
- Toroidal topology with modulo arithmetic for wrap-around
- Uint8Array compression for history snapshots
- Delta tracking for death animations

## Browser Support

Requires modern browsers with:
- ES2020+ support
- HTML5 Canvas API
- OffscreenCanvas support

## License

ISC

## Credits

Implements [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life), invented by John Horton Conway in 1970.
