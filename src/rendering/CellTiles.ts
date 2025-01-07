export class CellTiles
{
	canvases: OffscreenCanvas[]

	constructor({ width = 20, height = width }: { width?: number, height?: number })
	{
		this.canvases = [0, 1].map(alive =>
		{
			const osc = new OffscreenCanvas(width, height)
			const ctx = osc.getContext('2d')
			ctx.fillStyle = alive ? 'black' : 'white'
			ctx.fillRect(0, 0, width, height)
			return osc
		})
	}

	setSideLength(length: number)
	{
		this.canvases.forEach((canvas, alive) =>
		{
			_.assign(canvas, { width: length, height: length })
			const ctx = canvas.getContext('2d')
			ctx.fillStyle = alive ? 'black' : 'white'
			ctx.fillRect(0, 0, length, length)
		})
		return this
	}

	get width() { return this.canvases[0].width }
	set width(width) { this.setWidth(width) }
	get height() { return this.canvases[0].height }
	set height(height) { this.setHeight(height) }

	setWidth(width: number)
	{
		for (const c of this.canvases) c.width = width
		return this
	}
	setHeight(height: number)
	{
		for (const c of this.canvases) c.height = height
		return this
	}
	getCanvases({ width, height }: { width?: number, height?: number } = {})
	{
		const w = width && width !== this.width
		const h = height && height !== this.height
		if (w) this.setWidth(width)
		if (h) this.setHeight(height)

		if (w || h)
		{
			this.canvases.forEach((c, alive) =>
			{
				const ctx = c.getContext('2d')
				ctx.fillStyle = alive ? 'black' : 'white'
				ctx.fillRect(0, 0, c.width, c.height)
			})
		}

		return this.canvases
	}

	drawCell(context: CanvasRenderingContext2D, [x, y]: number[], alive = true)
	{
		const { canvases } = this
		const deltaX = +!(x === 0)
		const deltaY = +!(y === 0)
		context.drawImage(
			canvases[+!!alive],
			x + deltaX,
			y + deltaY,
			this.width - deltaX,
			this.height - deltaY,
		)
		return this
	}
}
export default CellTiles