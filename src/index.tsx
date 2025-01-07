import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { Provider } from 'react-redux'
import { createAppStore, useAppDispatch, useAppSelector, Provider } from './app'
import { universeSelectors, universeThunks, CellMap } from './model'
import { Quadrille, renderingSelectors, renderingThunks } from './rendering'

function View()
{
	const dispatch = useAppDispatch()
	const ticking = useAppSelector(renderingSelectors.ticking)
	const generation = useAppSelector(universeSelectors.generation)

	return (
		<div>
			<Quadrille />
			<div>
				<button
					onClick={() => dispatch(universeThunks.setPattern('testSeed'))}
					disabled={ticking}
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
		</div>
	)
}

// const store = createAppStore()
Object.assign(window, {
	// store,
	// universeSelectors,
	// getCellMap: () => universeSelectors.cellMap(store.getState())
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