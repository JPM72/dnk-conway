import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { Provider } from 'react-redux'
import { createAppStore, useAppDispatch, useAppSelector, Provider } from './app'
import { universeSelectors, universeThunks, CellMap, Patterns } from './model'
import { Quadrille, renderingSelectors, renderingThunks } from './rendering'

function Controls()
{
	const dispatch = useAppDispatch()
	const ticking = useAppSelector(renderingSelectors.ticking)
	const patternKey = useAppSelector(renderingSelectors.patternKey)
	const generation = useAppSelector(universeSelectors.generation)
	return (
		<div>
			<select
				value={patternKey ?? ""}
				onChange={e => dispatch(renderingThunks.setPattern(e.target.value as any || null))}
			>
				<option value="">none</option>
				{_.map(Patterns, (p, k) => <option key={k} value={k}>{p.name}</option>)}
			</select>
			<button
				onClick={() => dispatch(renderingThunks.setPattern(patternKey))}
				disabled={!patternKey || ticking}
			>set pattern</button>
			<button
				onClick={() => dispatch(renderingThunks.ticking.toggle())}
			>{ticking ? '⏸' : '⏵'}</button>
			<button
				onClick={() => dispatch(universeThunks.untick())}
				disabled={!!!generation}
			>untick</button>
			<button
				onClick={() => dispatch(universeThunks.tick())}
			>tick</button>
			<button
				onClick={() => dispatch(universeThunks.reset())}
			>reset</button>
		</div>
	)
}

function View()
{
	return (
		<div>
			<Quadrille />
			<Controls />
		</div>
	)
}

// const store = createAppStore()
Object.assign(window, {
	// store,
	universeSelectors,
	// @ts-ignore
	getCellMap: () => universeSelectors.cellMap(store.getState()),
	CellMap,
})

const root = createRoot(document.getElementById('root'))
root.render(
	<StrictMode>
		<Provider>
			<View />
		</Provider>
	</StrictMode>
)