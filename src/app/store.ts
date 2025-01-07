import type {
	UnknownAction,
	ThunkAction,
	Action,
} from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import listenerMiddleware from './listenerMiddleware'
import { modelSlice, getModelInitialState, } from '../model'
import { renderingSlice } from '../rendering'
import { monitorReducerEnhancer } from '../util'

const getPreloadedState = () =>
{
	const rendering = renderingSlice.getInitialState()
	const model = getModelInitialState(rendering)
	return {
		model,
		[renderingSlice.reducerPath]: rendering,
	}
}

export const createAppStore = () =>
{
	return configureStore({
		preloadedState: getPreloadedState(),
		devTools: process.env.NODE_ENV !== 'production',
		reducer: {
			model: modelSlice,
			[renderingSlice.reducerPath]: renderingSlice.reducer,
		},
		middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(
			listenerMiddleware.middleware
		),
	})
}

// export const store = configureStore({
// 	preloadedState: getPreloadedState(),
// 	devTools: process.env.NODE_ENV !== 'production',
// 	reducer: {
// 		model: modelSlice,
// 		[renderingSlice.reducerPath]: renderingSlice.reducer,
// 	},
// 	middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(
// 		listenerMiddleware.middleware
// 	),
// })
// export const store = createAppStore()

// export type AppState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch
// export type AppThunk<
// 	ReturnType = void,
// 	ExtraThunkArg = unknown,
// 	ActionType extends Action = UnknownAction
// > = ThunkAction<
// 	ReturnType,
// 	AppState,
// 	ExtraThunkArg,
// 	ActionType
// >

export type AppStore = ReturnType<typeof createAppStore>
export type AppState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export type AppThunk<
	ReturnType = void,
	ExtraThunkArg = unknown,
	ActionType extends Action = UnknownAction
> = ThunkAction<
	ReturnType,
	AppState,
	ExtraThunkArg,
	ActionType
>