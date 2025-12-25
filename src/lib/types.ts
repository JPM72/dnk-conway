import type { CellMap } from './CellMap'

export { CellMap }

export interface Pattern
{
	name: string
	pattern: string
	x?: number
	y?: number
	comments?: string
	author?: string
	rule?: string
}

export interface ConwayOptions
{
	canvas: HTMLCanvasElement
	width: number
	height: number
	cellSize: number
	gridLines?: boolean
	interval?: number
	pattern?: string | Pattern
	onGeneration?: (generation: number, cellMap: CellMap) => void
}
