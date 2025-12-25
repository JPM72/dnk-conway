import type { AppThunk } from '@/app'
import type { Coordinates } from '@/types'
import { safeMerge } from '@/util'
import { createAppSelector } from '@/app/creators'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import
	{
		type SerializedCellMap,
		type SerializedCellMapCoordinates,
		CellMap,
	} from './CellMap'
import { createModelSelector } from './createModelSelector'
import { Patterns, encodePattern } from './patterns'
import
	{
		renderingSelectors,
		renderingThunks,
		type RenderingState,
	} from '@/rendering'

const name = 'universe'

export interface UniverseState extends SerializedCellMap
{
	history: number[][]
	generation: number
}

const initialState = (): UniverseState => ({
	history: [],
	x: 10,
	y: 10,
	deaths: [],
	cells: {},
	generation: 0,
})

export const getInitialState = (rendering: RenderingState): UniverseState =>
{
	const { width, height, cellSideLength } = rendering
	const cellDimensions = {
		x: Math.floor(height / cellSideLength),
		y: Math.floor(width / cellSideLength),
	}
	return _.assign(initialState(), cellDimensions)
}

const slice = createSlice({
	name,
	initialState,
	reducers: {
		patternSet(state, { payload: pattern })
		{
			return safeMerge(
				state,
				CellMap.FromSerialized(pattern).center().serialize()
			)
		},
		dimensionsSet(state, { payload })
		{
			let x, y
			if (_.isLength(payload))
			{
				x = payload
				y = payload
			} else
			{
				({ x, y } = payload)
			}
			return { ...state, x, y }
		},
		cellsSet(
			state,
			{ payload: cells }: PayloadAction<SerializedCellMapCoordinates>
		)
		{
			const { cells: current } = state
			const deaths = []

			_.forEach(current, (columns, row) =>
			{
				const r = _.parseInt(row)
				_.forEach(columns, (v, column) =>
				{
					if (!_.get(cells, [row, column]))
					{
						deaths.push([r, _.parseInt(column)])
					}
				})
			})

			return {
				...state,
				cells,
				deaths,
			}
		},
		cellAdded(state, { payload: coordinates }: PayloadAction<Coordinates>)
		{
			return {
				...state,
				...CellMap.FromSerialized(state)
					.clone()
					.addCell(...coordinates)
					.serialize(),
			}
		},
		cellRemoved(
			state,
			{ payload: coordinates }: PayloadAction<Coordinates>
		)
		{
			return {
				...state,
				...CellMap.FromSerialized(state)
					.clone()
					.removeCell(...coordinates)
					.serialize(),
			}
		},
		tick: (state) =>
		{
			return {
				...state,
				...CellMap.FromSerialized(state).tick().serialize(),
			}
		},
		reset: (
			state,
			{ payload: newState }: PayloadAction<Partial<UniverseState>>
		) =>
		{
			return _.assign(initialState(), newState)
		},
		generationSet: (
			state,
			{ payload: generation }: PayloadAction<number>
		) =>
		{
			return { ...state, generation }
		},
		historyPushed(
			state,
			{ payload: history }: PayloadAction<number[]>
		)
		{
			return {
				...state,
				history: [...state.history, history],
			}
		},
		historyPopped(state)
		{
			return {
				...state,
				history: state.history.toSpliced(-1, 1),
			}
		},
	},
})
const { actions } = slice
export const universeRootSelector = createModelSelector<UniverseState>(name)

const selectCells = createAppSelector(
	[universeRootSelector],
	({ cells }) => cells
)
const selectHistory = createAppSelector(
	[universeRootSelector],
	({ history }) => history
)
const selectDimensions = createAppSelector(
	[universeRootSelector],
	({ x, y }) => [x, y]
)
const selectCellMap = createAppSelector([universeRootSelector], (state) =>
	CellMap.FromSerialized(state)
)

export const universeSelectors = {
	cells: selectCells,
	dimensions: selectDimensions,
	cellMap: selectCellMap,
	generation: createAppSelector(
		[universeRootSelector],
		({ generation }) => generation
	),
	delta: createAppSelector([universeRootSelector], ({ cells, deaths }) =>
		_.merge({}, { cells, deaths })
	),
	patternRle: createAppSelector([selectCellMap], (cellMap) =>
	{
		const a = []
		cellMap.overCells((r, c) => a.push([r, c]))
		return encodePattern(a)
	}),
	isSteadyState: createAppSelector([selectHistory], (history) =>
		_.isEqual(history.at(-1), history.at(-2))
	),
}

const setGeneration = (): AppThunk => (dispatch, getState) =>
{
	const history = selectHistory(getState())
	dispatch(actions.generationSet(history.length))
}
const reset = (): AppThunk => (dispatch, getState) =>
{
	dispatch(renderingThunks.ticking.stop())
	const rendering = renderingSelectors.root(getState())
	dispatch(actions.reset(getInitialState(rendering)))
}
const saveSnapshot = (): AppThunk => (dispatch, getState) =>
{
	const cells = selectCells(getState())
	dispatch(actions.historyPushed(CellMap.CellsToArray(cells)))
	dispatch(setGeneration())
}

const tick = (): AppThunk => (dispatch) =>
{
	dispatch(saveSnapshot())
	dispatch(actions.tick())
}
const untick = (): AppThunk => (dispatch, getState) =>
{
	const history = selectHistory(getState())
	if (!history.length) return
	const cells = CellMap.Uint8ArrayToCells(history.at(-1))
	dispatch(actions.historyPopped())
	dispatch(setGeneration())
	dispatch(actions.cellsSet(cells))
}
const setPattern =
	(patternKey: keyof typeof Patterns): AppThunk =>
		(dispatch, getState) =>
		{
			dispatch(reset())
			const pattern = Patterns[patternKey]
			if (!pattern) return
			const state = getState()
			const dimensions = renderingSelectors.cellDimensions(state)
			dispatch(
				actions.patternSet(_.assign({}, pattern, dimensions))
			)
		}

const addCell =
	(coordinates: Coordinates): AppThunk =>
		(dispatch, getState) =>
		{
			const cells = selectCells(getState())
			if (_.get(cells, coordinates)) return
			dispatch(saveSnapshot())
			dispatch(actions.cellAdded(coordinates))
		}
const removeCell =
	(coordinates: Coordinates): AppThunk =>
		(dispatch, getState) =>
		{
			const cells = selectCells(getState())
			console.log({
				coordinates,
				cells,
				has: _.get(cells, coordinates)
			})
			if (!_.get(cells, coordinates)) return
			dispatch(saveSnapshot())
			dispatch(actions.cellRemoved(coordinates))
		}

export const universeThunks = {
	reset,
	tick,
	untick,
	setPattern,
	setDimensions:
		(dimensions): AppThunk =>
			(dispatch) =>
			{
				dispatch(actions.dimensionsSet(dimensions))
			},
	addCell,
	removeCell,
}

export { slice as universeSlice }
