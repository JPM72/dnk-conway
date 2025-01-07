import type { CellMap } from './model'
import type { RenderingState } from './rendering'

export { CellMap }

export type Coordinates = [number, number]

export interface Pattern
{
	name: string
	pattern: string
	x: number
	y: number
	comments?: string
	author?: string
	rule?: string
}

export interface Dimensions
{
	x: number
	y: number
}
export interface RenderDimensions
{
	width: number
	height: number
}
export interface RenderingParameters extends RenderingState
{
	dimensions: Dimensions
}