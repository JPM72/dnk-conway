import patternData from './patterns.json'
import type { SerializedCellMap } from './CellMap'
import type { Pattern } from '@/types'

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

	return _(p).split('$').flatMap((line, rowNumber) => decodeLine(line, rowNumber)).value()
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

export const Patterns = _.mapValues(patternData, decodePattern)