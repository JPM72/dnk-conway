import { type ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { createAppStore } from './store'

export function Provider({ children }: { children: ReactNode })
{
	const store = createAppStore()
	Object.assign(window, { store })
	return (
		<ReduxProvider store={store}>
			{children}
		</ReduxProvider>
	)
}
export default Provider