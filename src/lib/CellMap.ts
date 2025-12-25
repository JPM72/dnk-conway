export class CellMap extends Map<number, Map<number, boolean>>
{
	static GetCellTransition(alive: boolean, neighborCount: number)
	{
		return alive
			? neighborCount === 2 || neighborCount === 3
			: neighborCount === 3
	}

	static FromUint8Array(array: Uint8Array, x: number, y: number): CellMap
	{
		const cellMap = new CellMap({ x, y })
		const columnOffset = 1 + array[0] * 2

		const rowValues = array.slice(1, columnOffset)
		const columnValues = array.slice(columnOffset)

		const len = rowValues.length
		let i = 0, j = 0
		while (i < len)
		{
			const r = rowValues[i]
			const n = rowValues[i + 1]

			for (let k = 0; k < n; k++)
			{
				cellMap.setCell(r, columnValues[j + k])
			}

			i += 2
			j += n
		}

		return cellMap
	}

	toroidal: boolean = true
	x: number
	y: number
	deaths: number[][] = []

	constructor({ x = 5, y = x, deaths = [] }: { x?: number, y?: number, deaths?: number[][] } = {})
	{
		super()
		this.x = x
		this.y = y
		this.deaths = deaths.slice()
	}

	clone(): CellMap
	{
		const { x, y, deaths } = this
		const next = new CellMap({ x, y, deaths })
		this.overCells((row, column) => next.setCell(row, column))
		return next
	}

	hasCell(row: number, column: number): boolean
	{
		return !!this.get(row)?.get(column)
	}

	setCell(row: number, column: number): this
	{
		if (this.has(row))
		{
			this.get(row)!.set(column, true)
		} else
		{
			this.set(row, new Map([[column, true]]))
		}
		return this
	}

	addCell(row: number, column: number): this
	{
		if (this.hasCell(row, column)) return this
		this.setCell(row, column)
		this.deaths = this.deaths.filter(([r, c]) => r !== row || c !== column)
		return this
	}

	removeCell(row: number, column: number): this
	{
		if (!this.hasCell(row, column)) return this
		const columns = this.get(row)
		if (columns)
		{
			columns.delete(column)
			if (!columns.size) this.delete(row)
		}
		this.deaths.push([row, column])
		return this
	}

	setDimensions(x: number = this.x, y: number = this.y): this
	{
		this.x = x
		this.y = y
		return this
	}

	overCells(fn: (r: number, c: number) => any): void
	{
		for (const [row, columns] of this)
		{
			for (const [column] of columns)
			{
				fn(row, column)
			}
		}
	}

	overNeighbors(row: number, column: number, fn: (r: number, c: number) => any): void
	{
		const { x, y, toroidal } = this

		let a = row - 2, b = row + 2

		if (toroidal)
		{
			while (++a < b)
			{
				let $a = a
				if ($a < 0)
				{
					$a = x + a
				} else if (a >= x)
				{
					$a = a - x
				}

				let c = column - 2, d = column + 2
				while (++c < d)
				{
					let $c = c
					if ($a === row && c === column) continue
					if (c < 0)
					{
						$c = y + c
					} else if (c >= y)
					{
						$c = c - y
					}
					fn($a, $c)
				}
			}
		} else
		{
			while (++a < b)
			{
				if (a < 0 || a === x) continue
				let c = column - 2, d = column + 2
				while (++c < d)
				{
					if ((c < 0 || c === y) || (a === row && c === column)) continue
					fn(a, c)
				}
			}
		}
	}

	getCellFate(row: number, column: number, previous: boolean): boolean
	{
		return CellMap.GetCellTransition(previous, this.getNeighborCount(row, column))
	}

	getNeighborCount(row: number, column: number): number
	{
		let neighborCount = 0
		this.overNeighbors(row, column, (r, c) => (neighborCount += +this.hasCell(r, c)))
		return neighborCount
	}

	tick(): CellMap
	{
		const { x, y } = this
		const next = new CellMap({ x, y })
		const { deaths } = next

		this.overCells((row, column) =>
		{
			if (this.getCellFate(row, column, true))
			{
				next.setCell(row, column)
			} else
			{
				deaths.push([row, column])
			}
			this.overNeighbors(row, column, (r, c) =>
			{
				if (this.hasCell(r, c)) return
				if (this.getCellFate(r, c, false)) next.setCell(r, c)
			})
		})
		return next
	}

	getBoundaries(): { x: [number, number], y: [number, number] }
	{
		const columns: number[] = []
		const rows: number[] = []

		for (const [row, cols] of this)
		{
			rows.push(row)
			for (const [col] of cols)
			{
				columns.push(col)
			}
		}

		return {
			x: [Math.min(...columns), Math.max(...columns)],
			y: [Math.min(...rows), Math.max(...rows)],
		}
	}

	center(): CellMap
	{
		const { x, y } = this
		const boundaries = this.getBoundaries()
		const [xMin, xMax] = boundaries.x
		const [yMin, yMax] = boundaries.y
		const width = 1 + xMax - xMin
		const height = 1 + yMax - yMin

		const a = Math.ceil(y / 2) - (yMin + Math.floor(height / 2))
		const b = Math.ceil(x / 2) - (xMin + Math.floor(width / 2))

		return this.translate(a, b)
	}

	translate(a = 0, b = a): CellMap
	{
		const { x, y } = this
		if (a >= y || b >= x) return this

		const next = new CellMap(this)

		for (const [row, columns] of this)
		{
			const r = row + a
			if (r < 0 || r >= y) continue
			for (const [column] of columns)
			{
				const c = column + b
				if (c < 0 || c >= x) continue
				next.setCell(r, c)
			}
		}
		return next
	}

	toUint8Array(): Uint8Array
	{
		const rows: number[] = []
		const columns: number[] = []

		for (const [row, cols] of this)
		{
			rows.push(row, cols.size)
			for (const [col] of cols)
			{
				columns.push(col)
			}
		}

		const columnOffset = rows.length / 2
		return new Uint8Array([columnOffset, ...rows, ...columns])
	}
}
