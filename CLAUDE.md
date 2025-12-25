# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run serve` - Start webpack dev server in development mode (opens Chrome automatically)
- `npm run build` - Production build with webpack
- `npm run watch` - Development build with watch mode
- No tests configured (`npm test` exits with error)

## Architecture

### State Management (Redux Toolkit)

The application uses Redux Toolkit with two main slices:

1. **Universe Slice** (`src/model/universeSlice.ts`) - Game state
   - Manages cell grid state, generations, and history
   - Uses `CellMap` class for efficient cell storage and Conway's Game of Life rules
   - Snapshots saved as Uint8Arrays for undo/redo via `cellStore` array
   - Key thunks: `tick`, `untick`, `reset`, `setPattern`, `addCell`, `removeCell`

2. **Rendering Slice** (`src/rendering/renderingSlice.ts`) - UI state
   - Controls canvas dimensions, cell size, grid lines, animation speed
   - Manages ticking state (play/pause)
   - Key thunks: `setDimensions`, `ticking.start/stop/toggle`, `setPattern`

### Core Data Structure

**CellMap** (`src/model/CellMap.ts`) - Sparse matrix implementation using nested Maps
- `Map<number, Map<number, boolean>>` for efficient storage of live cells only
- Implements Conway's Game of Life rules in `tick()` method
- Supports toroidal (wrap-around) topology via `toroidal` property
- Serialization to/from plain objects for Redux storage
- Compression to Uint8Array for history snapshots
- Methods: `center()`, `translate()`, `clone()`, `getBoundaries()`

### Pattern System

**Patterns** (`src/model/patterns.ts`, `src/model/patterns.json`)
- Patterns stored in RLE (Run Length Encoded) format
- `encodePattern()` and `decodePattern()` for RLE conversion
- Patterns loaded from JSON and automatically centered on grid

### Rendering

**Quadrille Component** (`src/rendering/Quadrille.tsx`)
- React component managing HTML5 canvas
- Uses `useQuadrille` hook for animation loop via `setInterval`
- Mouse handlers: left-click adds cells, right-click removes cells
- Drawing logic in `src/rendering/draw.ts`

### TypeScript Path Aliases

Configured in `tsconfig.json` and `webpack.config.js`:
- `@` → `src/`
- `model` → `src/model/`
- `rendering` → `src/rendering/`
- `util` → `src/util/`
- `types` → `src/types`

### Store Initialization

App store created via `createAppStore()` factory function (`src/app/store.ts`) rather than singleton export. Initial state calculated from rendering dimensions to determine grid size.
