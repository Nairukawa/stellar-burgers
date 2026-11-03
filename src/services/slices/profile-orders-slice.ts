import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { getOrdersApi } from '@api';
import type { TOrder } from '@utils-types';
import type { TRequestState, TThunkConfig } from '../types';
import { checkAuth, loginUser, logoutUser, registerUser } from './auth-slice';
import { submitOrder } from './order-submission-slice';

export type TProfileOrdersState = TRequestState & {
  items: TOrder[];
  submissionRequestId: string | null;
};

const initialState: TProfileOrdersState = {
  items: [],
  status: 'idle',
  error: null,
  requestId: null,
  submissionRequestId: null
};

export const fetchProfileOrders = createAsyncThunk<
  TOrder[],
  void,
  TThunkConfig
>('profileOrders/fetch', async () => getOrdersApi(), {
  condition: (_, { getState }) => {
    const { auth, profileOrders } = getState();
    return (
      auth.isAuthChecked &&
      Boolean(auth.user) &&
      !auth.isLoading &&
      profileOrders.status !== 'loading'
    );
  }
});

const profileOrdersSlice = createSlice({
  name: 'profileOrders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileOrders.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchProfileOrders.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        const receivedNumbers = new Set(
          action.payload.map((order) => order.number)
        );
        state.items = [
          ...action.payload,
          ...state.items.filter((order) => !receivedNumbers.has(order.number))
        ].sort((first, second) => second.number - first.number);
        state.status = 'succeeded';
        state.error = null;
        state.requestId = null;
      })
      .addCase(fetchProfileOrders.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'failed';
        state.error = action.error.message || 'Не удалось загрузить заказы';
        state.requestId = null;
      })
      .addCase(submitOrder.pending, (state, action) => {
        state.submissionRequestId = action.meta.requestId;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        if (state.submissionRequestId !== action.meta.requestId) return;
        state.items = [
          action.payload,
          ...state.items.filter(
            (order) => order.number !== action.payload.number
          )
        ];
        if (state.status !== 'loading') state.status = 'succeeded';
        state.error = null;
        state.submissionRequestId = null;
      })
      .addCase(submitOrder.rejected, (state, action) => {
        if (state.submissionRequestId === action.meta.requestId) {
          state.submissionRequestId = null;
        }
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        if (!action.payload) return initialState;
      })
      .addMatcher(
        isAnyOf(
          loginUser.pending,
          registerUser.pending,
          logoutUser.fulfilled,
          checkAuth.rejected
        ),
        () => initialState
      );
  }
});

const profileOrdersReducer: Reducer<TProfileOrdersState> =
  profileOrdersSlice.reducer;
export default profileOrdersReducer;
