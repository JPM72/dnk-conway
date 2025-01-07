import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, AppState } from './store'

// https://redux.js.org/usage/usage-with-typescript#define-typed-hooks
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<AppState>()