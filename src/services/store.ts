import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  TypedUseSelectorHook,
  useDispatch as dispatchHook,
  useSelector as selectorHook
} from 'react-redux';

import authReducer from './slices/auth-slice';
import ingredientsReducer from './slices/ingredients-slice';
import constructorReducer from './slices/constructor-slice';
import orderSubmissionReducer from './slices/order-submission-slice';
import profileOrdersReducer from './slices/profile-orders-slice';
import orderDetailsReducer from './slices/order-details-slice';
import feedReducer from './slices/feed-slice';

export const rootReducer = combineReducers({
  ingredients: ingredientsReducer,
  auth: authReducer,
  burgerConstructor: constructorReducer,
  orderSubmission: orderSubmissionReducer,
  profileOrders: profileOrdersReducer,
  orderDetails: orderDetailsReducer,
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
