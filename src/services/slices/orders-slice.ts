import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { getOrderByNumberApi, getOrdersApi, orderBurgerApi } from '@api';
import type { TOrder, TUser } from '@utils-types';
import type { TConstructorState } from './constructor-slice';
import { checkAuth, loginUser, logoutUser, registerUser } from './auth-slice';

type TRequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type TSubmissionState = {
  order: TOrder | null;
  status: TRequestStatus;
  error: string | null;
  requestId: string | null;
};

type THistoryState = {
  items: TOrder[];
  status: TRequestStatus;
  error: string | null;
  requestId: string | null;
};

type TDetailsState = TSubmissionState & {
  number: number | null;
  isPrivate: boolean;
};

export type TOrdersState = {
  submission: TSubmissionState;
  history: THistoryState;
  details: TDetailsState;
};

type TOrdersThunkConfig = {
  state: {
    orders: TOrdersState;
    burgerConstructor: TConstructorState;
    auth: {
      user: TUser | null;
      isAuthChecked: boolean;
      isLoading: boolean;
    };
  };
  rejectValue: string;
};

const initialState: TOrdersState = {
  submission: {
    order: null,
    status: 'idle',
    error: null,
    requestId: null
  },
  history: { items: [], status: 'idle', error: null, requestId: null },
  details: {
    order: null,
    status: 'idle',
    error: null,
    requestId: null,
    number: null,
    isPrivate: false
  }
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'string' && error) return error;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
};

export const submitOrder = createAsyncThunk<TOrder, void, TOrdersThunkConfig>(
  'orders/submit',
  async (_, { getState, rejectWithValue }) => {
    const { burgerConstructor, auth } = getState();
    if (!auth.user) return rejectWithValue('Войдите, чтобы оформить заказ');
    if (!burgerConstructor.bun)
      return rejectWithValue('Добавьте булку в бургер');

    const ingredientIds = [
      burgerConstructor.bun._id,
      ...burgerConstructor.ingredients.map((ingredient) => ingredient._id),
      burgerConstructor.bun._id
    ];

    try {
      const { order } = await orderBurgerApi(ingredientIds);
      return {
        _id: order._id,
        number: order.number,
        name: order.name,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        ingredients: ingredientIds
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Не удалось оформить заказ')
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { auth, orders } = getState();
      return (
        auth.isAuthChecked &&
        Boolean(auth.user) &&
        !auth.isLoading &&
        orders.submission.status !== 'loading'
      );
    }
  }
);

export const fetchProfileOrders = createAsyncThunk<
  TOrder[],
  void,
  TOrdersThunkConfig
>(
  'orders/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await getOrdersApi();
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Не удалось загрузить историю заказов')
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { auth, orders } = getState();
      return (
        auth.isAuthChecked &&
        Boolean(auth.user) &&
        !auth.isLoading &&
        orders.history.status !== 'loading'
      );
    }
  }
);

export const fetchOrderDetails = createAsyncThunk<
  TOrder | null,
  { number: number; isPrivate: boolean },
  TOrdersThunkConfig
>(
  'orders/fetchDetails',
  async ({ number, isPrivate }, { rejectWithValue }) => {
    if (!Number.isSafeInteger(number) || number <= 0) return null;
    try {
      if (isPrivate) {
        const orders = await getOrdersApi();
        return orders.find((order) => order.number === number) ?? null;
      }
      const response = await getOrderByNumberApi(number);
      if (!response.success) throw new Error('Не удалось получить заказ');
      return response.orders.find((order) => order.number === number) ?? null;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Не удалось загрузить информацию о заказе')
      );
    }
  },
  {
    condition: ({ number, isPrivate }, { getState }) => {
      const { auth, orders } = getState();
      if (isPrivate && (!auth.isAuthChecked || !auth.user || auth.isLoading)) {
        return false;
      }
      const details = orders.details;
      return !(
        details.status === 'loading' &&
        details.number === number &&
        details.isPrivate === isPrivate
      );
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderSubmission: (state) => {
      if (state.submission.status !== 'loading') {
        state.submission = { ...initialState.submission };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending, (state, action) => {
        state.submission = {
          order: null,
          status: 'loading',
          error: null,
          requestId: action.meta.requestId
        };
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        if (state.submission.requestId !== action.meta.requestId) return;
        state.submission = {
          order: action.payload,
          status: 'succeeded',
          error: null,
          requestId: null
        };
        state.history.items = [
          action.payload,
          ...state.history.items.filter(
            (order) => order.number !== action.payload.number
          )
        ];
        if (state.history.status !== 'loading') {
          state.history.status = 'succeeded';
        }
        state.history.error = null;
      })
      .addCase(submitOrder.rejected, (state, action) => {
        if (state.submission.requestId !== action.meta.requestId) return;
        state.submission.status = 'failed';
        state.submission.error =
          action.payload || action.error.message || 'Не удалось оформить заказ';
        state.submission.requestId = null;
      })
      .addCase(fetchProfileOrders.pending, (state, action) => {
        state.history.status = 'loading';
        state.history.error = null;
        state.history.requestId = action.meta.requestId;
      })
      .addCase(fetchProfileOrders.fulfilled, (state, action) => {
        if (state.history.requestId !== action.meta.requestId) return;
        const receivedNumbers = new Set(
          action.payload.map((order) => order.number)
        );
        state.history.items = [
          ...action.payload,
          ...state.history.items.filter(
            (order) => !receivedNumbers.has(order.number)
          )
        ].sort((first, second) => second.number - first.number);
        state.history.status = 'succeeded';
        state.history.requestId = null;
      })
      .addCase(fetchProfileOrders.rejected, (state, action) => {
        if (state.history.requestId !== action.meta.requestId) return;
        state.history.status = 'failed';
        state.history.error =
          action.payload ||
          action.error.message ||
          'Не удалось загрузить заказы';
        state.history.requestId = null;
      })
      .addCase(fetchOrderDetails.pending, (state, action) => {
        state.details = {
          order: null,
          status: 'loading',
          error: null,
          requestId: action.meta.requestId,
          number: action.meta.arg.number,
          isPrivate: action.meta.arg.isPrivate
        };
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        if (state.details.requestId !== action.meta.requestId) return;
        state.details.order = action.payload;
        state.details.status = 'succeeded';
        state.details.requestId = null;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        if (state.details.requestId !== action.meta.requestId) return;
        state.details.status = 'failed';
        state.details.error =
          action.payload ||
          action.error.message ||
          'Не удалось загрузить заказ';
        state.details.requestId = null;
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

export const { clearOrderSubmission } = ordersSlice.actions;
export default ordersSlice.reducer;
