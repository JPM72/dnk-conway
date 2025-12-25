export class CellTiles
{
	private canvases: OffscreenCanvas[]

	constructor({ width = 20, height = width }: { width?: number; height?: number })
	{
		this.canvases = [0, 1].map((alive) =>
		{
			const osc = new OffscreenCanvas(width, height)
			const ctx = osc.getContext('2d')!
			ctx.fillStyle = alive ? 'black' : 'white'
			ctx.fillRect(0, 0, width, height)
			return osc
		})
	}

	setSideLength(length: number): this
	{
		this.canvases.forEach((canvas, alive) =>
		{
			canvas.width = length
			canvas.height = length
			const ctx = canvas.getContext('2d')!
			ctx.fillStyle = alive ? 'black' : 'white'
			ctx.fillRect(0, 0, length, length)
		})
		return this
	}

	get width()
	{
		return this.canvases[0].width
	}

	get height()
	{
		return this.canvases[0].height
	}

	drawCell(context: CanvasRenderingContext2D, [x, y]: number[], alive = true): this
	{
		const { canvases } = this
		const deltaX = +(x !== 0)
		const deltaY = +(y !== 0)
		context.drawImage(
			canvases[+!!alive],
			x + deltaX,
			y + deltaY,
			this.width - deltaX,
			this.height - deltaY
		)
		return this
	}
}
