import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { getOrderByNumberApi, getOrdersApi } from '@api';
import type { TOrder } from '@utils-types';
import type { TRequestState, TThunkConfig } from '../types';
import { checkAuth, loginUser, logoutUser, registerUser } from './auth-slice';

export type TOrderDetailsState = TRequestState & {
  order: TOrder | null;
  number: number | null;
  isPrivate: boolean;
};

const initialState: TOrderDetailsState = {
  order: null,
  status: 'idle',
  error: null,
  requestId: null,
  number: null,
  isPrivate: false
};

export const fetchOrderDetails = createAsyncThunk<
  TOrder | null,
  { number: number; isPrivate: boolean },
  TThunkConfig
>(
  'orderDetails/fetch',
  async ({ number, isPrivate }) => {
    if (!Number.isSafeInteger(number) || number <= 0) return null;
    if (isPrivate) {
      const orders = await getOrdersApi();
      return orders.find((order) => order.number === number) ?? null;
    }
    const response = await getOrderByNumberApi(number);
    if (!response.success) throw new Error('Не удалось получить заказ');
    return response.orders.find((order) => order.number === number) ?? null;
  },
  {
    condition: ({ number, isPrivate }, { getState }) => {
      const { auth, orderDetails } = getState();
      if (isPrivate && (!auth.isAuthChecked || !auth.user || auth.isLoading)) {
        return false;
      }
      return !(
        orderDetails.status === 'loading' &&
        orderDetails.number === number &&
        orderDetails.isPrivate === isPrivate
      );
    }
  }
);

const orderDetailsSlice = createSlice({
  name: 'orderDetails',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderDetails.pending, (state, action) => {
        state.order = null;
        state.status = 'loading';
        state.error = null;
        state.requestId = action.meta.requestId;
        state.number = action.meta.arg.number;
        state.isPrivate = action.meta.arg.isPrivate;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.order = action.payload;
        state.status = 'succeeded';
        state.requestId = null;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'failed';
        state.error = action.error.message || 'Не удалось загрузить заказ';
        state.requestId = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        if (!action.payload && state.isPrivate) return initialState;
      })
      .addMatcher(
        isAnyOf(
          loginUser.pending,
          registerUser.pending,
          logoutUser.fulfilled,
          checkAuth.rejected
        ),
        (state) => {
          if (state.isPrivate) return initialState;
        }
      );
  }
});

const orderDetailsReducer: Reducer<TOrderDetailsState> =
  orderDetailsSlice.reducer;
export default orderDetailsReducer;
