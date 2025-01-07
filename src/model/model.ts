import type { RenderingState } from '@/rendering'
import { combineSlices } from '@reduxjs/toolkit'
import { universeSlice, getInitialState } from './universeSlice'

export const modelSlice = combineSlices({
	[universeSlice.reducerPath]: universeSlice.reducer,
})
export default modelSlice
export type ModelState = ReturnType<typeof modelSlice>
export const getModelInitialState = (rendering: RenderingState): ModelState =>
{
	const state = _.merge({}, universeSlice.getInitialState(), getInitialState(rendering))
	return { universe: state }
}