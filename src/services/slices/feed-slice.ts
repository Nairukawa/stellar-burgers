import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { getFeedsApi } from '@api';
import type { TOrdersData } from '@utils-types';
import type { TRequestStatus, TThunkConfig } from '../types';

type TFeedState = TOrdersData & {
  status: TRequestStatus;
  error: string | null;
};

const initialState: TFeedState = {
  orders: [],
  total: 0,
  totalToday: 0,
  status: 'idle',
  error: null
};

export const fetchFeed = createAsyncThunk<TOrdersData, void, TThunkConfig>(
  'feed/fetch',
  async () => getFeedsApi(),
  {
    condition: (_, { getState }) => getState().feed.status !== 'loading'
  }
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.orders = action.payload.orders;
        state.total = action.payload.total;
        state.totalToday = action.payload.totalToday;
        state.status = 'succeeded';
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          action.error.message || 'Не удалось загрузить ленту заказов';
      });
  }
});

const feedReducer: Reducer<TFeedState> = feedSlice.reducer;
export default feedReducer;
