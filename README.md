# Conway's Game of Life - Code Analysis & Architecture Report

## Project Overview

This is a browser-based implementation of Conway's Game of Life, currently structured as a React application with Redux Toolkit state management. The codebase contains core library functionality for simulating cellular automata, but it's tightly coupled to React/Redux infrastructure rather than being a standalone, framework-agnostic library.

## Core Implementation Details

### 1. CellMap Class (`src/model/CellMap.ts`)

The heart of the simulation engine is the `CellMap` class, which implements Conway's Game of Life rules.

**Data Structure:**
- Extends `Map<number, Map<number, boolean>>` - a sparse matrix representation
- Only stores live cells, making it memory-efficient for sparse patterns
- Each row is a Map, and each column within that row is a Map entry

**Key Properties:**
```typescript
x: number              // Grid width (number of rows)
y: number              // Grid height (number of columns)
deaths: number[][]     // Coordinates of cells that died in the last generation
toroidal: boolean      // Enable wrap-around topology (default: true)
```

**Core Algorithm (`tick()` method):**
```
For each living cell:
  1. Count its neighbors
  2. Apply survival rules (2-3 neighbors → survives, else dies)
  3. For each neighbor position:
     - If position is empty and has exactly 3 neighbors → birth
  4. Track deaths for animation purposes
```

**Conway's Rules Implementation:**
```typescript
static GetCellTransition(alive: boolean, neighborCount: number) {
    return alive
        ? neighborCount === 2 || neighborCount === 3  // Survival
        : neighborCount === 3                          // Birth
}
```

**Neighbor Counting:**
- `overNeighbors()` iterates through the 8-cell Moore neighborhood
- Supports toroidal topology with modulo arithmetic for wrap-around
- Non-toroidal mode clips to grid boundaries

**Serialization System:**
- `serialize()`: Converts Map structure to plain objects for Redux storage
- `FromSerialized()`: Factory method to reconstruct CellMap from serialized state
- `CellsToUint8Array()` / `Uint8ArrayToCells()`: Compress cell data for history snapshots
  - Uses run-length encoding: stores row numbers and column counts
  - Format: `[columnOffset, row1, count1, row2, count2, ..., col1, col2, ...]`

**Spatial Operations:**
- `center()`: Centers pattern on grid by calculating boundaries and translating
- `translate(a, b)`: Shifts all cells by row offset `a` and column offset `b`
- `getBoundaries()`: Returns min/max coordinates of live cells

### 2. Pattern System (`src/model/patterns.ts`)

Implements RLE (Run Length Encoded) format for storing and loading patterns.

**RLE Format:**
- `b` = dead cell, `o` = live cell, `$` = end of row, `!` = end of pattern
- Numbers prefix runs: `3o` = three live cells, `2b` = two dead cells
- Example: `bo$2bo$3o!` encodes a glider

**Encoding Process (`encodePattern()`):**
```
1. Group cells by row number
2. For each row, create run-length encoded string
3. Join rows with '$' separator
4. Append '!' terminator
```

**Decoding Process (`decodePatternRLE()`):**
```
1. Split pattern by '$' into rows
2. Parse each row's runs (regex: /(\d+)?\w/g)
3. For 'o' runs, generate cell coordinates
4. Flatten into array of [row, column] pairs
```

**Pattern Loading:**
- Patterns stored in `patterns.json` with metadata (name, author, comments, rule)
- Loaded at module initialization into `Patterns` object
- `decodePattern()` converts RLE to `SerializedCellMapCoordinates` format
- Patterns automatically centered on grid when applied

### 3. Rendering System (`src/rendering/draw.ts`)

Pure functions for canvas rendering, mostly framework-agnostic.

**CellTiles Optimization (`src/rendering/CellTiles.ts`):**
- Uses two `OffscreenCanvas` instances: one for alive cells (black), one for dead cells (white)
- Pre-renders cell tiles to avoid repeated `fillRect()` calls
- `drawCell()` uses `drawImage()` to stamp tiles onto main canvas
- Dynamically resizes tiles via `setSideLength()` when cell size changes
- Small offset (`deltaX`, `deltaY`) prevents grid line overlap at canvas edges

**Drawing Functions:**

1. **`drawFrame()`**: Clears canvas, fills white background, sets black fill style
2. **`drawGridLines()`**: Renders cell boundaries if `gridLines` enabled
   - Iterates by `cellSideLength` increments
   - Uses 0.5-pixel offset for crisp 1px lines (sub-pixel rendering)
3. **`drawCells()`**: Main render function
   - Clears canvas and redraws frame + grid lines
   - Iterates through CellMap entries
   - Calculates pixel coordinates: `row * cellSideLength`, `column * cellSideLength`
   - Draws alive cells in black, death animations in white

**Rendering Pipeline:**
```
drawFrame() → clear background, set styles
drawGridLines() → render grid overlay (conditional)
drawCells() → iterate CellMap, stamp tiles for each cell
            → iterate deaths array, stamp white tiles (fade-out effect)
```

### 4. State Management Architecture

**Two Redux Slices:**

1. **Universe Slice** (`src/model/universeSlice.ts`)
   - Manages game state: cell grid, generation counter, death list
   - State shape matches `SerializedCellMap` + `generation: number`
   - Reducers: `patternSet`, `dimensionsSet`, `cellsSet`, `cellAdded`, `cellRemoved`, `tick`, `reset`
   - Thunks handle side effects: `saveSnapshot()`, `clearHistory()`, etc.
   - Snapshot system: `cellStore` array stores Uint8Array-compressed states for undo

2. **Rendering Slice** (`src/rendering/renderingSlice.ts`)
   - UI state: canvas dimensions, cell size, grid visibility, animation speed
   - State: `{ width, height, cellSideLength, gridLines, ticking, interval, patternKey }`
   - Thunks: `setDimensions()`, `ticking.start/stop/toggle()`, `setPattern()`
   - `resolveDimensions()` thunk calculates cell grid dimensions from canvas size

**State Initialization:**
- Rendering state initialized first with default canvas dimensions (800x800, 20px cells)
- Universe state calculated from rendering dimensions: `Math.floor(height / cellSideLength)` rows
- Grid size dynamically updates when canvas dimensions change

**Selectors:**
- Memoized with `createAppSelector()` (re-export of Redux Toolkit's selector factory)
- `universeSelectors.cellMap`: Deserializes state into CellMap instance
- `renderingSelectors.parameters`: Combines rendering state with calculated dimensions
- `universeSelectors.patternRle`: Encodes current cells back to RLE format

### 5. React Integration (`src/rendering/Quadrille.tsx`)

The main rendering component couples the library to React.

**Component Structure:**
```typescript
function Quadrille() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cellMap = useAppSelector(universeSelectors.cellMap)
    const parameters = useAppSelector(renderingSelectors.parameters)

    // Draw frame and grid lines once
    useEffect(() => { /* ... */ }, [cellMap])

    // Animation loop in custom hook
    useQuadrille({ canvas: canvasRef })

    return <canvas {...eventHandlers} />
}
```

**Animation System (`useQuadrille` hook):**
- Uses `useEffect` with dependencies: `[cellMap, ticking, interval]`
- When `ticking` is true, creates `setInterval(() => dispatch(tick()), interval)`
- Calls `draw.cells()` on every CellMap change
- Cleanup function clears interval on unmount or state change

**Mouse Interaction:**
- Left-click: `addCell()` - converts pixel offset to grid coordinates via `Math.floor(offset / cellSideLength)`
- Right-click: `removeCell()` - prevents context menu with `event.preventDefault()`
- Both dispatch thunks that save snapshots before modifying cells

**Coordinate Conversion:**
```typescript
const offsetToCoordinates = ({ offsetX, offsetY }, cellSideLength) =>
    [offsetY, offsetX].map(n => Math.floor(n / cellSideLength))
```
Note: `[offsetY, offsetX]` order maps Y to row, X to column (row-major order).

### 6. History/Undo System

Implemented in `universeSlice.ts` with manual snapshot management.

**Snapshot Storage:**
- `cellStore` array (module-level variable) stores compressed states
- Each snapshot is a `Uint8Array` generated by `CellMap.CellsToUint8Array()`
- Compression reduces memory footprint (vs. storing full serialized objects)

**Lifecycle:**
- `saveSnapshot()`: Called before `tick()`, `addCell()`, `removeCell()`
- `tick()`: Saves current state, then advances generation
- `untick()`: Pops last snapshot, restores cells, decrements generation counter
- `reset()`: Clears `cellStore`, stops animation, reinitializes grid

**Generation Counter:**
- Equals `cellStore.length` (number of snapshots)
- Updated via `setGeneration()` thunk
- Displayed in UI, used to disable "untick" button when zero

## Deviations from Library Architecture

The codebase **significantly deviates** from a single-responsibility, framework-agnostic library design. Below is a complete enumeration of coupling points and architectural issues:

### React Coupling

1. **`src/rendering/Quadrille.tsx`** (Lines 1-115)
   - Entire component is React-specific
   - Uses React hooks: `useRef`, `useEffect`, `useAppSelector`
   - Canvas lifecycle tied to React component lifecycle
   - Should be: Vanilla JS function accepting canvas ref and parameters

2. **`src/app/Provider.tsx`** (Lines 1-15)
   - React component wrapping Redux provider
   - Should not exist in a library

3. **`src/app/useConway.ts`** (Lines 1-15)
   - Incomplete React hook (empty body)
   - Appears to be abandoned experiment
   - Should be: Vanilla JS initialization function

4. **`src/index.tsx`** (Lines 1-70)
   - Entire application entry point is React-specific
   - Controls component with UI elements (buttons, select dropdowns)
   - Should not exist in a library (demo/example code at most)

5. **`src/app/hooks.ts`** (Lines 1-6)
   - Typed Redux hooks for React integration
   - Should be: Direct store interaction without React bindings

### Redux Coupling

6. **`src/model/universeSlice.ts`** (Lines 1-215)
   - Game state managed by Redux slice
   - Thunks tightly couple simulation logic to Redux dispatch system
   - Lines 146-213: All thunks return `AppThunk` type
   - Should be: Pure `CellMap` methods or standalone state machine

7. **`src/rendering/renderingSlice.ts`** (Lines 1-132)
   - Rendering parameters stored in Redux
   - Thunks for UI state management (lines 94-127)
   - Should be: Plain object/class with getters/setters

8. **`src/app/store.ts`** (Lines 1-75)
   - Redux store configuration
   - `createAppStore()` factory pattern
   - Should not exist in a library

9. **`src/model/model.ts`** (Lines 1-14)
   - Combines slices using Redux Toolkit's `combineSlices()`
   - Should be: Separate concerns without Redux infrastructure

10. **`src/app/listenerMiddleware.ts`** (Lines 1-4)
    - Redux middleware (currently unused but present)
    - Should not exist in a library

### State Management Issues

11. **Module-Level State in `universeSlice.ts`** (Line 11)
    - `const cellStore = []` - module-scoped mutable array
    - Prevents multiple instances, breaks encapsulation
    - Should be: Instance property or passed as parameter

12. **State Initialization Coupling** (`src/app/store.ts`, lines 12-20)
    - `getPreloadedState()` couples rendering and model slices
    - Circular dependency: rendering dimensions determine universe dimensions
    - Should be: Independent initialization with explicit parameter passing

13. **Thunk Side Effects** (Throughout `universeSlice.ts` and `renderingSlice.ts`)
    - Thunks dispatch other thunks (e.g., `reset()` calls `clearHistory()`, `renderingThunks.ticking.stop()`)
    - Business logic scattered across thunk definitions
    - Should be: Pure functions that return new state

### Animation/Rendering Coupling

14. **Animation Loop in React Component** (`Quadrille.tsx`, lines 58-73)
    - `useEffect` manages `setInterval` directly
    - Ticking state stored in Redux, but interval created in component
    - Should be: Library provides animation controller class with `start()`, `stop()`, `step()` methods

15. **Drawing Logic Partially Decoupled** (`src/rendering/draw.ts`)
    - Functions like `drawFrame()`, `drawGridLines()`, `drawCells()` are pure and framework-agnostic ✓
    - However, they're not exposed as public API
    - Singleton `tiles` instance (line 74) prevents multiple instances

16. **RenderingParameters Type Coupling** (`src/types.d.ts`, lines 29-32)
    - `RenderingParameters` extends `RenderingState` (Redux slice state)
    - Should be: Standalone interface with no Redux dependencies

### Pattern System Issues

17. **Pattern Loading** (`src/model/patterns.ts`, lines 86-92)
    - `Patterns` object created at module initialization
    - Loads all patterns from JSON immediately
    - Should be: Lazy loading or explicit initialization function

18. **Pattern Storage** (`src/model/patterns.json`)
    - All patterns bundled in application code
    - Should be: Optional external resource, not required dependency

### Mouse Interaction Coupling

19. **Event Handlers in Quadrille** (`Quadrille.tsx`, lines 23-46)
    - `onCanvasClick()` function dispatches Redux actions
    - Coordinate conversion logic embedded in component
    - Should be: Library provides helper for coordinate conversion, consumer handles events

20. **Coordinate Conversion** (`Quadrille.tsx`, lines 18-21)
    - `offsetToCoordinates()` helper is local to component
    - Should be: Public utility function exported by library

### Selector Coupling

21. **Selectors Tied to Redux State Shape**
    - `universeSelectors` (lines 118-144 in `universeSlice.ts`)
    - `renderingSelectors` (lines 79-92 in `renderingSlice.ts`)
    - All use `createAppSelector()` which assumes Redux state structure
    - Should be: Plain getters on state objects

22. **`createModelSelector()` and `createRenderingSelector()`**
    - Utility functions for creating nested selectors (`src/model/createModelSelector.ts`, `src/rendering/createRenderingSelector.ts`)
    - Assume specific Redux state tree structure
    - Should not exist

### TypeScript Type Coupling

23. **`AppThunk` Type** (`src/app/store.ts`, lines 66-75)
    - Thunks typed with Redux-specific `ThunkAction`
    - Forces all async operations through Redux pattern
    - Should be: Plain async functions or Promises

24. **`AppState` and `AppDispatch` Types** (`src/app/store.ts`, lines 63-65)
    - Types derived from store instance
    - Should be: Independent types not derived from Redux

### Utility Functions

25. **`safeMerge()` Uses Immer** (`src/util/sliceUtilities.ts`, lines 4-6)
    - Wraps Lodash `merge()` with Immer's `produce()`
    - Only needed for Redux's immutability requirements
    - Should be: Direct mutation or plain object spread

### Build Configuration

26. **Webpack Configuration** (`webpack.config.js`)
    - Configured for full application build, not library distribution
    - No library output format (UMD, CommonJS, ESM)
    - Should be: Build outputs library bundle with multiple formats

27. **Package.json Scripts** (Lines 7-10)
    - `serve`, `build`, `watch` scripts for application
    - No library-specific build command
    - Should be: Scripts for building distributable library

### Missing Library Features

28. **No Public API Surface**
    - No clear entry point for library consumers
    - No exported initialization function
    - Should be: Single export with `init(canvas, options)` function

29. **No Lifecycle Management**
    - No `destroy()` or `dispose()` methods
    - Cannot clean up event listeners or intervals
    - Should be: Instance with lifecycle methods

30. **No Configuration Object**
    - Parameters scattered across Redux slices
    - Should be: Single configuration object passed to initialization

31. **No Event System**
    - No callbacks for generation updates, pattern completion, etc.
    - Consumer cannot react to state changes without Redux
    - Should be: Event emitter or callback registration

## Recommended Library Architecture

To align with the stated goal of a framework-agnostic library, the codebase should be restructured as follows:

### Core Library (`conway-lib.ts`)

```typescript
interface ConwayOptions {
    canvas: HTMLCanvasElement
    width: number
    height: number
    cellSize: number
    gridLines?: boolean
    interval?: number
    pattern?: string | Pattern
    onGeneration?: (generation: number, cellMap: CellMap) => void
}

class ConwayGame {
    constructor(options: ConwayOptions)

    // Lifecycle
    init(): void
    destroy(): void

    // Simulation control
    start(): void
    stop(): void
    step(): void
    reset(): void
    undo(): void

    // State access
    getCellMap(): CellMap
    getGeneration(): number

    // Configuration
    setPattern(pattern: string | Pattern): void
    setDimensions(width: number, height: number): void
    setCellSize(size: number): void

    // Cell manipulation
    addCell(row: number, column: number): void
    removeCell(row: number, column: number): void

    // Utilities
    coordinatesFromEvent(event: MouseEvent): [number, number]
}

// Factory function
export function createConwayGame(options: ConwayOptions): ConwayGame
```

### Reusable Components (Keep As-Is)

- `CellMap` class ✓ (already framework-agnostic)
- `draw.ts` functions ✓ (pure functions)
- `CellTiles` class ✓ (only uses Canvas API)
- `patterns.ts` encoding/decoding ✓ (pure functions)

### Remove Entirely

- All Redux infrastructure (slices, store, middleware, selectors, thunks)
- React components and hooks
- Application entry point (`index.tsx`)

### Optional React Adapter

Create separate package/file for React integration:

```typescript
// conway-react.tsx
export function useConway(options: ConwayOptions) {
    const gameRef = useRef<ConwayGame>()
    // ... wrapper implementation
    return gameRef.current
}

export function ConwayCanvas(props: ConwayOptions) {
    // React component wrapper
}
```

## Summary

This codebase contains excellent core algorithms (CellMap sparse matrix, RLE pattern encoding, OffscreenCanvas optimization) that form a solid foundation for a Game of Life library. However, the code is structured as a **React application** rather than a **reusable library**, with deep coupling to React and Redux throughout.

**Key Statistics:**
- 31 distinct architectural violations identified
- Approximately 70% of codebase is framework coupling (React/Redux)
- Core library functionality: ~30% (CellMap, draw functions, patterns)

To achieve the stated goal of a framework-agnostic library, a significant refactoring is required to extract the core functionality, remove Redux, and provide a clean imperative API with lifecycle management.
