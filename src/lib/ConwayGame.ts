import { CellMap } from './CellMap'
import { CellTiles } from './CellTiles'
import { decodePattern, encodePattern } from './patterns'
import type { Pattern, ConwayOptions } from './types'

export class ConwayGame
{
	private canvas: HTMLCanvasElement
	private context: CanvasRenderingContext2D
	private cellMap: CellMap
	private tiles: CellTiles
	private history: Uint8Array[] = []
	private intervalId: number | null = null

	public width: number
	public height: number
	public cellSize: number
	public gridLines: boolean
	public interval: number
	public onGeneration?: (generation: number, cellMap: CellMap) => void

	constructor(options: ConwayOptions)
	{
		this.canvas = options.canvas
		this.context = this.canvas.getContext('2d')!
		this.width = options.width
		this.height = options.height
		this.cellSize = options.cellSize
		this.gridLines = options.gridLines ?? true
		this.interval = options.interval ?? 100
		this.onGeneration = options.onGeneration

		const rows = Math.floor(this.height / this.cellSize)
		const cols = Math.floor(this.width / this.cellSize)

		this.cellMap = new CellMap({ x: rows, y: cols })
		this.tiles = new CellTiles({ width: this.cellSize })

		this.canvas.width = this.width
		this.canvas.height = this.height

		if (options.pattern)
		{
			this.setPattern(options.pattern)
		}
	}

	init(): void
	{
		this.render()
	}

	destroy(): void
	{
		this.stop()
		this.cellMap.clear()
		this.history = []
	}

	start(): void
	{
		if (this.intervalId !== null) return

		this.intervalId = window.setInterval(() =>
		{
			this.step()
		}, this.interval)
	}

	stop(): void
	{
		if (this.intervalId !== null)
		{
			clearInterval(this.intervalId)
			this.intervalId = null
		}
	}

	isRunning(): boolean
	{
		return this.intervalId !== null
	}

	step(): void
	{
		this.saveSnapshot()
		this.cellMap = this.cellMap.tick()
		this.render()

		if (this.onGeneration)
		{
			this.onGeneration(this.history.length, this.cellMap)
		}
	}

	undo(): void
	{
		if (this.history.length === 0) return

		const snapshot = this.history.pop()!
		this.cellMap = CellMap.FromUint8Array(snapshot, this.cellMap.x, this.cellMap.y)
		this.render()
	}

	reset(): void
	{
		this.stop()
		this.cellMap.clear()
		this.history = []
		this.render()
	}

	getCellMap(): CellMap
	{
		return this.cellMap
	}

	getGeneration(): number
	{
		return this.history.length
	}

	setPattern(pattern: string | Pattern): void
	{
		this.reset()

		const cells = decodePattern(pattern)
		this.cellMap.clear()
		for (const [row, col] of cells)
		{
			this.cellMap.setCell(row, col)
		}

		this.cellMap = this.cellMap.center()
		this.render()
	}

	setDimensions(width: number, height: number): void
	{
		this.width = width
		this.height = height
		this.canvas.width = width
		this.canvas.height = height

		const rows = Math.floor(height / this.cellSize)
		const cols = Math.floor(width / this.cellSize)
		this.cellMap.setDimensions(rows, cols)

		this.render()
	}

	setCellSize(size: number): void
	{
		this.cellSize = size
		this.tiles.setSideLength(size)

		const rows = Math.floor(this.height / this.cellSize)
		const cols = Math.floor(this.width / this.cellSize)
		this.cellMap.setDimensions(rows, cols)

		this.render()
	}

	addCell(row: number, col: number): void
	{
		if (this.cellMap.hasCell(row, col)) return
		this.saveSnapshot()
		this.cellMap.setCell(row, col)
		this.render()
	}

	removeCell(row: number, col: number): void
	{
		if (!this.cellMap.hasCell(row, col)) return
		this.saveSnapshot()
		this.cellMap.removeCell(row, col)
		this.render()
	}

	coordinatesFromEvent(event: MouseEvent): [number, number]
	{
		const rect = this.canvas.getBoundingClientRect()
		const x = event.clientX - rect.left
		const y = event.clientY - rect.top

		const row = Math.floor(y / this.cellSize)
		const col = Math.floor(x / this.cellSize)

		return [row, col]
	}

	getPatternRLE(): string
	{
		const cells: number[][] = []
		this.cellMap.overCells((r, c) => cells.push([r, c]))
		return encodePattern(cells)
	}

	private saveSnapshot(): void
	{
		const snapshot = this.cellMap.toUint8Array()
		this.history.push(snapshot)
	}

	private render(): void
	{
		this.drawFrame()
		this.drawGridLines()
		this.drawCells()
	}

	private drawFrame(): void
	{
		this.context.fillStyle = 'white'
		this.context.fillRect(0, 0, this.width, this.height)
		this.context.fillStyle = 'black'
	}

	private drawGridLines(): void
	{
		if (!this.gridLines) return

		this.context.strokeStyle = '#2F343C'
		this.context.lineWidth = 1

		let x = this.cellSize
		while (x <= this.width)
		{
			const i = x + 0.5
			this.context.beginPath()
			this.context.moveTo(i, 0)
			this.context.lineTo(i, this.height + 0.5)
			this.context.stroke()
			x += this.cellSize
		}

		let y = this.cellSize
		while (y <= this.height)
		{
			const i = y + 0.5
			this.context.beginPath()
			this.context.moveTo(0, i)
			this.context.lineTo(this.width + 0.5, i)
			this.context.stroke()
			y += this.cellSize
		}
	}

	private drawCells(): void
	{
		for (const [row, columns] of this.cellMap)
		{
			const r = row * this.cellSize
			for (const [col] of columns)
			{
				this.tiles.drawCell(this.context, [col * this.cellSize, r])
			}
		}

		for (const [row, col] of this.cellMap.deaths)
		{
			this.tiles.drawCell(this.context, [col * this.cellSize, row * this.cellSize], false)
		}
	}
}

export function createConwayGame(options: ConwayOptions): ConwayGame
{
	return new ConwayGame(options)
}
