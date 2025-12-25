import type { Pattern } from './types'

const encodeRun = (runCount: number, alive: boolean): string =>
{
	if (!runCount) return ''
	return `${runCount > 1 ? runCount : ''}${alive ? 'o' : 'b'}`
}

const encodeRow = (columns: number[], rowLength: number): string =>
{
	if (columns.length === rowLength) return encodeRun(rowLength, true)
	const colSet = new Set(columns)

	let i = -1,
		s = '',
		runCount = 1
	while (++i < rowLength)
	{
		const alive = colSet.has(i)
		const nextAlive = i + 1 >= rowLength ? !alive : colSet.has(i + 1)
		if (alive === nextAlive)
		{
			runCount++
			continue
		} else
		{
			s += encodeRun(runCount, alive)
			runCount = 1
		}
	}
	return s
}

export function encodePattern(cells: number[][]): string
{
	const maxCol = Math.max(...cells.map((c) => c[1]))
	const rowLength = maxCol + 1

	const rowMap = new Map<number, number[]>()
	for (const [row, col] of cells)
	{
		if (!rowMap.has(row)) rowMap.set(row, [])
		rowMap.get(row)!.push(col)
	}

	const rows = Array.from(rowMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([_, cols]) => encodeRow(cols, rowLength))

	return rows.join('$') + '!'
}

const decodeLine = (line: string, rowNumber: number): number[][] =>
{
	const runs = line.match(/(\d+)?\w/g) || []
	const cells: number[][] = []

	let cursor = 0
	for (const run of runs)
	{
		const runLength = parseInt(run) || 1
		if (run[run.length - 1] === 'o')
		{
			let column = cursor,
				runEnd = cursor + runLength
			while (column < runEnd)
			{
				cells.push([rowNumber, column++])
			}
		}
		cursor += runLength
	}
	return cells
}

export function decodePattern(pattern: string | Pattern): number[][]
{
	const rle = typeof pattern === 'string' ? pattern : pattern.pattern
	let p = rle
	if (p.endsWith('!')) p = p.slice(0, -1)

	return p
		.split('$')
		.flatMap((line, index) => decodeLine(line, index))
}

export function loadPatterns(patternsData: Record<string, Pattern>): Record<string, Pattern>
{
	return patternsData
}
