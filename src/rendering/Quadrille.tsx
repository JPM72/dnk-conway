import { useRef, useEffect, type MouseEventHandler } from 'react'
import { universeSelectors, universeThunks } from '../model'
import { renderingSelectors } from './renderingSlice'
import type { RenderingParameters, CellMap, Coordinates } from '@/types'
import draw from './draw'
import { useAppDispatch, useAppSelector } from '@/app'

const onMouseMove = _.throttle(({ nativeEvent: event }) =>
{
	console.log({
		..._.pick(event, [
			'offsetX',
			'offsetY',
		])
	})
}, 16)

const offsetToCoordinates = ({ nativeEvent: { offsetX, offsetY } }, cellSideLength: number) =>
{
	return [offsetY, offsetX].map(n => Math.floor(n / cellSideLength)) as Coordinates
}

const onCanvasClick = (parameters: RenderingParameters) =>
{
	const dispatch = useAppDispatch()
	const { cellSideLength } = parameters
	const onClick = (event): React.MouseEvent<HTMLCanvasElement, MouseEvent> =>
	{
		const coordinates = offsetToCoordinates(event, cellSideLength)
		dispatch(universeThunks.addCell(coordinates))
		return
	}
	const onContextMenu = (event): React.MouseEvent<HTMLCanvasElement> =>
	{
		const { altKey } = event
		if (altKey) return
		event.preventDefault()
		const coordinates = offsetToCoordinates(event, cellSideLength)
		dispatch(universeThunks.removeCell(coordinates))
		return
	}
	return {
		onClick,
		onContextMenu,
	}
}

function useQuadrille({
	canvas,
}: {
	canvas: React.MutableRefObject<HTMLCanvasElement>,
})
{
	const rendering = useAppSelector(renderingSelectors.parameters)
	const cellMap = useAppSelector(universeSelectors.cellMap)
	const { ticking, interval } = rendering
	const dispatch = useAppDispatch()
	useEffect(() =>
	{
		const context = canvas.current.getContext('2d')
		const isEmpty = !cellMap.size

		draw.cells(context, rendering, cellMap)

		if (!isEmpty && ticking)
		{
			const id = setInterval(() =>
			{
				dispatch(universeThunks.tick())
			}, interval)
			return () => clearInterval(id)
		}
	}, [cellMap, ticking, interval])
}

export function Quadrille()
{
	const parameters = useAppSelector(renderingSelectors.parameters)
	const { width, height } = parameters

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const cellMap = useAppSelector(universeSelectors.cellMap)

	const hasDrawn = useRef({ frame: false, gridLines: false })

	useEffect(() =>
	{
		const context = canvasRef.current.getContext('2d')

		const isEmpty = !cellMap.size

		for (const k of ['frame', 'gridLines'])
		{
			if (!hasDrawn.current[k] || isEmpty)
			{
				draw[k](context, parameters)
				hasDrawn.current[k] = true
			}
		}
	}, [cellMap])

	useQuadrille({ canvas: canvasRef })

	return <canvas {...{
		id: 'canvas',
		ref: canvasRef,
		width, height,
		style: {
			width, height,
			margin: '1rem',
			border: '1px solid #2F343C'
		},
		...onCanvasClick(parameters),
	}} />
}