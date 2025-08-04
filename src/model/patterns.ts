import patternData from './patterns.json'
import type { SerializedCellMap } from './CellMap'
import type { Pattern } from '@/types'

const encodeRun = (runCount: number, alive: boolean) =>
{
	if (!runCount) return ''
	return `${runCount > 1 ? runCount : ''}${alive ? 'o' : 'b'}`
}

const encodeRow = (columns: number[], rowLength: number) =>
{
	if (columns.length === rowLength) return encodeRun(rowLength, true)
	const colSet = new Set(columns)

	let
		i = -1,
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
export const encodePattern = (cells: number[][]) =>
{
	const rowLength = _(cells).map(c => c[1]).max() + 1
	const rows = _(cells).groupBy(_.first).mapValues(
		a => a.map(n => n[1])
	).value()
	return _(rows).map(r => encodeRow(r, rowLength)).join('$') + '!'
}

const decodeLine = (line: string, rowNumber: number) =>
{
	const runs = _.words(line, /(\d+)?\w/g)
	const cells = []

	let cursor = 0
	for (const run of runs)
	{
		const runLength = Number.parseFloat(run) || 1
		if (run.at(-1) === 'o')
		{
			let column = cursor, runEnd = cursor + runLength
			while (column < runEnd)
			{
				cells.push([rowNumber, column++])
			}
		}
		cursor += runLength
	}
	return cells
}

const decodePatternRLE = ({ pattern }: { pattern: string }) =>
{
	let p = pattern
	if (p.endsWith('!')) p = p.slice(0, -1)

	return _(p).split('$').flatMap(decodeLine).value()
}

const decodePattern = (pattern) =>
{
	const cellMap = {}
	for (const [row, column] of decodePatternRLE(pattern)) _.setWith(cellMap, [row, column], true, Object)
	return {
		...pattern,
		cells: cellMap
	} as Pattern & SerializedCellMap
}

export const Patterns = _.mapValues(patternData, (p, k) =>
{
	const decoded = decodePattern(p)
	decoded.name ??= k
	return decoded
})
export type PatternKey = keyof typeof Patterns