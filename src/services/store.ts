import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  TypedUseSelectorHook,
  useDispatch as dispatchHook,
  useSelector as selectorHook
} from 'react-redux';

import authReducer from './slices/auth-slice';
import ingredientsReducer from './slices/ingredients-slice';
import constructorReducer from './slices/constructor-slice';
import ordersReducer from './slices/orders-slice';
import feedReducer from './slices/feed-slice';

const rootReducer = combineReducers({
  ingredients: ingredientsReducer,
  auth: authReducer,
  burgerConstructor: constructorReducer,
  orders: ordersReducer,
  feed: feedReducer
});

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useDispatch = () => dispatchHook<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = selectorHook;

export default store;
