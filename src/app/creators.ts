import { createAsyncThunk } from '@reduxjs/toolkit'
import type { PropertyPath } from 'lodash'
import type {
	Selector,
	UnknownMemoizer,
	weakMapMemoize
} from 'reselect'
import { createSelector } from 'reselect'
import type { AppDispatch, AppState } from './store'

// https://redux-toolkit.js.org/usage/usage-with-typescript#defining-a-pre-typed-createasyncthunk
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
	state: AppState
	dispatch: AppDispatch
}>()

// https://reselect.js.org/FAQ#how-can-i-make-a-pre-typed-version-of-createselector-for-my-root-state
export type TypedCreateSelector<
	State,
	MemoizeFunction extends UnknownMemoizer = typeof weakMapMemoize,
	ArgsMemoizeFunction extends UnknownMemoizer = typeof weakMapMemoize
> = <
	InputSelectors extends readonly Selector<State>[],
	Result,
	OverrideMemoizeFunction extends UnknownMemoizer = MemoizeFunction,
	OverrideArgsMemoizeFunction extends UnknownMemoizer = ArgsMemoizeFunction
>(
	...createSelectorArgs: Parameters<
		typeof createSelector<
			InputSelectors,
			Result,
			OverrideMemoizeFunction,
			OverrideArgsMemoizeFunction
		>
	>
) => ReturnType<
	typeof createSelector<
		InputSelectors,
		Result,
		OverrideMemoizeFunction,
		OverrideArgsMemoizeFunction
	>
>

export const createAppSelector: TypedCreateSelector<AppState> = createSelector

const flattenPath = (path) => _.castArray(path).flat(Infinity)
export const createPathSelector = (
	start: PropertyPath
) =>
{
	const $start = _.castArray(start).flat(Infinity)

	return <TResult>(
		path: PropertyPath
	) => _.property<any, TResult>($start.concat(flattenPath(path)) as string[])
}