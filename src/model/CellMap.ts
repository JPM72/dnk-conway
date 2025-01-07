export type SerializedCellMapCoordinates = {
	[k: string]: {
		[j: string]: boolean
	}
}
export interface SerializedCellMap
{
	x: number,
	y: number,
	deaths: number[][]
	cells: SerializedCellMapCoordinates
}

const parseInt = Number.parseInt

export class CellMap extends Map<number, Map<number, boolean>>
{
	static GetCellTransition(alive: boolean, neighborCount: number)
	{
		return alive
			? neighborCount === 2 || neighborCount === 3
			: neighborCount === 3
	}

	static FromSerialized(serialized: SerializedCellMap)
	{
		const { x, y, deaths = [], cells } = serialized
		const cm = new CellMap({ x, y, deaths })

		_.forEach(cells, (m, r) =>
		{
			const row = parseInt(r)
			_.forEach(m, (v, c) =>
			{
				cm.setCell(row, parseInt(c))
			})
		})
		return cm
	}

	static CellsToUint8Array(cells: SerializedCellMapCoordinates)
	{
		const rows = _.flatMap(cells, (c, r) => [parseInt(r), _.size(c)])
		const columns = _.flatMap(cells, c => _.keys(c).map(x => parseInt(x)))
		const columnOffset = rows.length / 2
		return new Uint8Array([
			columnOffset,
			...rows,
			...columns
		])
	}

	static Uint8ArrayToCells(array: Uint8Array<ArrayBuffer>)
	{
		const columnOffset = 1 + array[0] * 2

		const rowValues = array.slice(1, columnOffset)
		const columnValues = array.slice(columnOffset)

		const cells: SerializedCellMapCoordinates = {}

		const len = rowValues.length
		let i = 0, j = 0
		while (i < len)
		{
			const r = rowValues[i]
			const n = rowValues[i + 1]

			columnValues.slice(j, j + n).forEach(c => _.setWith(cells, [r, c], true, Object))

			i += 2
			j += n
		}
		return cells
	}

	/** Right <-> Left and Top <-> Bottom wrap-around behavior  */
	toroidal: boolean = true

	x: number
	y: number
	deaths: number[][] = []
	constructor({
		x = 5,
		y = x,
		deaths = [],
	}: {
		x?: number,
		y?: number,
		deaths?: number[][],
	})
	{
		super()
		this.x = x
		this.y = y
		this.deaths = _.cloneDeep(deaths)
	}

	clone()
	{
		const { x, y, deaths } = this
		const next = new CellMap({ x, y, deaths })
		this.overCells((row, column) => next.setCell(row, column))
		return next
	}

	hasCell(row: number, column: number)
	{
		return !!this.get(row)?.get(column)
	}

	setCell(row: number, column: number)
	{
		if (this.has(row))
		{
			this.get(row).set(column, true)
		} else
		{
			this.set(row, new Map([[column, true]]))
		}
		return this
	}

	addCell(row: number, column: number)
	{
		if (this.hasCell(row, column)) return this
		this.setCell(row, column)
		_.pullAllWith(this.deaths, [[row, column]], _.isEqual)
		return this
	}

	removeCell(row: number, column: number)
	{
		if (!this.hasCell(row, column)) return this
		const columns = this.get(row)
		columns.delete(column)
		if (!columns.size) this.delete(row)
		/* shouldnt have a danger of duplicates since an alive cell shouldnt have a death entry */
		this.deaths.push([row, column])
		return this
	}

	setDimensions(x: number = this.x, y: number = this.y)
	{
		this.x = x
		this.y = y
		return this
	}

	overCells(fn: (r: number, c: number) => any)
	{
		for (const [row, columns] of this)
		{
			for (const [column] of columns)
			{
				fn(row, column)
			}
		}
	}
	overNeighbors(row: number, column: number, fn: (r: number, c: number) => any)
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
					if (
						(c < 0 || c === y)
						|| (a === row && c === column)
					) continue
					fn(a, c)
				}
			}
		}
	}

	getCellFate(row: number, column: number, previous: boolean)
	{
		// let neighborCount = 0
		// this.overNeighbors(
		// 	row, column,
		// 	(r, c) => neighborCount += +this.hasCell(r, c)
		// )
		// return CellMap.GetCellTransition(previous, neighborCount)
		return CellMap.GetCellTransition(
			previous,
			this.getNeighborCount(row, column)
		)
	}

	getNeighborCount(row: number, column: number)
	{
		let neighborCount = 0
		this.overNeighbors(
			row, column,
			(r, c) => neighborCount += +this.hasCell(r, c)
		)
		return neighborCount
	}

	tick()
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

	getBoundaries()
	{
		const x = _([...this.values()]).flatMap(m => [...m.keys()]).thru(
			a => [_.min(a), _.max(a)]
		).value()
		const y = _([...this.keys()]).thru(a => [_.min(a), _.max(a)]).value()
		return { x, y }
	}

	center()
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

	translate(a = 0, b = a)
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

	serialize()
	{
		const { x, y, deaths } = this
		return {
			x, y,
			deaths: _.cloneDeep(deaths),
			cells: _.mapValues(
				Object.fromEntries(this),
				m => Object.fromEntries(m)
			)
		}
	}

	log()
	{
		const array = _.times(this.x, () => _.times(this.y, () => ' '))
		this.overCells((r, c) => array[r][c] = 'X')
		console.log('%s', array.map(a => a.join('')).join('\n'))
	}
}
export default CellMap