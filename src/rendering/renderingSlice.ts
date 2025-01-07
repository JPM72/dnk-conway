import type { RenderingParameters, RenderDimensions } from '@/types'
import { safeMerge } from '@/util'
import type { AppState, AppThunk } from '@/app'
import { createAppSelector } from '@/app/creators'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createRenderingSelector } from './createRenderingSelector'
import { universeThunks } from '@/model'

const name = 'rendering'

export interface RenderingState
{
	width: number
	height: number
	cellSideLength: number
	gridLines: boolean
	ticking: boolean
	interval: number
}

const initialState = (): RenderingState => ({
	width: 800,
	height: 800,
	cellSideLength: 20,
	gridLines: true,
	ticking: false,
	interval: 16,
})

const slice = createSlice({
	name,
	initialState,
	reducers: {
		setDimensions(state, { payload }: PayloadAction<number | RenderDimensions>)
		{
			let width, height
			if (_.isLength(payload))
			{
				width = payload
				height = payload
			} else
			{
				({ width, height } = payload as RenderDimensions)
			}
			return safeMerge(state, { width, height })
		},
		setInterval(state, { payload: interval }: PayloadAction<number>)
		{
			return safeMerge(state, { interval })
		},
		toggleGridLines: (state, { payload: gridLines }) => safeMerge(state, {
			gridLines: !!gridLines,
		}),
		toggleTicking: (state, { payload: ticking }) => safeMerge(state, {
			ticking: !!ticking
		}),
	},
})
const { actions } = slice

// const rootSelector = createRenderingSelector<RenderingState>(name)
const rootSelector = createAppSelector([
	_.identity<AppState>
], _.property<AppState, RenderingState>([name]))

const selectCellDimensions = createAppSelector([
	rootSelector,
], ({ width, height, cellSideLength }) => ({
	x: Math.floor(height / cellSideLength),
	y: Math.floor(width / cellSideLength),
}))

export const renderingSelectors = {
	root: rootSelector,
	dimensions: createAppSelector([rootSelector], ({ width, height }) => ({ width, height })),
	gridLines: createAppSelector([rootSelector], ({ gridLines }) => gridLines),
	cellSideLength: createAppSelector([rootSelector], ({ cellSideLength }) => cellSideLength),
	interval: createAppSelector([rootSelector], ({ interval }) => interval),
	cellDimensions: selectCellDimensions,
	parameters: createAppSelector([
		rootSelector,
		selectCellDimensions,
	], (state, dimensions) => ({ ...state, dimensions } as RenderingParameters)),
	ticking: createAppSelector([rootSelector], ({ ticking }) => ticking)
}

const resolveDimensions = (): AppThunk => (dispatch, getState) =>
{
	const state = getState()
	const cellDimensions = renderingSelectors.cellDimensions(state)
	dispatch(universeThunks.setDimensions(cellDimensions))
}

const setDimensions = (dimensions: number | RenderDimensions): AppThunk => (dispatch) =>
{
	dispatch(actions.setDimensions(dimensions))
	dispatch(resolveDimensions())
}

export const renderingThunks = {
	setInterval: (interval: number): AppThunk => (dispatch) => { dispatch(actions.setInterval(interval)) },
	setDimensions,
	ticking: {
		start: (): AppThunk => dispatch =>
		{
			dispatch(actions.toggleTicking(true))
		},
		stop: (): AppThunk => dispatch => { dispatch(actions.toggleTicking(false)) },
		toggle: (): AppThunk => (dispatch, getState) =>
		{
			const ticking = renderingSelectors.ticking(getState())
			dispatch(actions.toggleTicking(!ticking))
		},
	},
}

export
{
	slice as renderingSlice,
}