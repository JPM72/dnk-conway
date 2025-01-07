import { useAppDispatch, useAppSelector } from './hooks'
import { renderingSelectors } from '@/rendering'
import { universeSelectors, universeThunks } from '@/model'

export function useConway({
	canvas,
}: {
	canvas: React.MutableRefObject<HTMLCanvasElement>,
})
{
	const rendering = useAppSelector(renderingSelectors.parameters)
	const cellMap = useAppSelector(universeSelectors.cellMap)


}