import type { RenderingParameters } from '@/types'
import CellTiles from './CellTiles'
import { type CellMap } from '../model'

const drawFrame = (
	context: CanvasRenderingContext2D,
	parameters: RenderingParameters,
) =>
{
	const { width, height } = parameters

	context.fillStyle = 'white'
	context.strokeStyle = '#2F343C'
	context.fillRect(0, 0, width, height)

	context.lineWidth = 1
	// context.strokeRect(0, 0, width, height)

	context.fillStyle = 'black'
}

const drawGridLines = (
	context: CanvasRenderingContext2D,
	{
		gridLines,
		width, height,
		cellSideLength,
		dimensions: { x: w, y: h }
	}: RenderingParameters,
) =>
{
	if (!gridLines) return

	const wh = height + 0.5
	const hw = width + 0.5

	const drawLine = (x0, y0, x1, y1) =>
	{
		context.moveTo(x0, y0)
		context.lineTo(x1, y1)
		context.stroke()
	}

	if (w)
	{
		// drawLine(width, 0, width, height)
		// let x = 0

		let x = cellSideLength

		while (x <= width)
		{
			let i = x + 0.5
			drawLine(i, 0, i, wh)
			x += cellSideLength
		}
	}
	if (h)
	{
		// drawLine(0, height, width, height)
		// let y = 0

		let y = cellSideLength

		while (y <= height)
		{
			let i = y + 0.5
			drawLine(0, i, hw, i)
			y += cellSideLength
		}
	}
}

const tiles = new CellTiles({ width: 40 })
const drawCells = (
	context: CanvasRenderingContext2D,
	parameters: RenderingParameters,
	cellMap: CellMap,
) =>
{
	const { width,  height, cellSideLength } = parameters
	context.clearRect(0, 0, width, height)
	drawFrame(context, parameters)
	drawGridLines(context, parameters)
	tiles.setSideLength(cellSideLength)

	for (const [row, columns] of cellMap)
	{
		const r = row * cellSideLength
		for (const [column] of columns)
		{
			tiles.drawCell(context, [column * cellSideLength, r])
		}
	}

	const { deaths } = cellMap
	for (const [row, column] of deaths)
	{
		tiles.drawCell(context, [column * cellSideLength, row * cellSideLength], false)
	}
}

export const draw = {
	tiles,
	frame: drawFrame,
	gridLines: drawGridLines,
	cells: drawCells,
}
export default draw