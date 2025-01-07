import { produce } from 'immer'
import type { CaseReducerActions, SliceCaseReducers } from '@reduxjs/toolkit'

export const safeMerge = <T extends object = {}>(destination: T, ...sources): T => produce(
	destination, draft => _.merge(draft, ...sources)
)

/* revise */
export const createActionThunks = <T>(
	actions: CaseReducerActions<SliceCaseReducers<T>, any>
) => _.mapValues(
	actions,
	reducer => (...args: any[]) => dispatch => { dispatch(reducer.apply(args)) }
)


