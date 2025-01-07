import type { StoreEnhancer } from '@reduxjs/toolkit'
const round = Math.round
export const monitorReducerEnhancer: StoreEnhancer = createStore => (reducer, initialState) =>
{
	const monitoredReducer = (state, action) =>
	{
		const t0 = performance.now()
		const newState = reducer(state, action)
		console.log(
			'reducer process time:',
			round(performance.now() - t0)
		)
		return newState
	}
	return createStore(monitoredReducer, initialState)
}

export default monitorReducerEnhancer