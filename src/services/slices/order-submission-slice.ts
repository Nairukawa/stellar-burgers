import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { orderBurgerApi } from '@api';
import type { TOrder } from '@utils-types';
import type { TRequestState, TThunkConfig } from '../types';
import { checkAuth, loginUser, logoutUser, registerUser } from './auth-slice';

export type TOrderSubmissionState = TRequestState & {
  order: TOrder | null;
  isModalOpen: boolean;
};

const initialState: TOrderSubmissionState = {
  order: null,
  status: 'idle',
  error: null,
  requestId: null,
  isModalOpen: false
};

export const submitOrder = createAsyncThunk<TOrder, void, TThunkConfig>(
  'orderSubmission/submit',
  async (_, { getState }) => {
    const { burgerConstructor, auth } = getState();
    if (!auth.user) throw new Error('Войдите, чтобы оформить заказ');
    if (!burgerConstructor.bun) throw new Error('Добавьте булку в бургер');

    const ingredientIds = [
      burgerConstructor.bun._id,
      ...burgerConstructor.ingredients.map((ingredient) => ingredient._id),
      burgerConstructor.bun._id
    ];

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
  },
  {
    condition: (_, { getState }) => {
      const { auth, orderSubmission } = getState();
      return (
        auth.isAuthChecked &&
        Boolean(auth.user) &&
        !auth.isLoading &&
        orderSubmission.status !== 'loading'
      );
    }
  }
);

const orderSubmissionSlice = createSlice({
  name: 'orderSubmission',
  initialState,
  reducers: {
    clearOrderSubmission: (state) => {
      if (state.status === 'loading') {
        state.isModalOpen = false;
      } else {
        return initialState;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending, (state, action) => {
        state.order = null;
        state.status = 'loading';
        state.error = null;
        state.requestId = action.meta.requestId;
        state.isModalOpen = true;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.order = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.requestId = null;
        state.isModalOpen = true;
      })
      .addCase(submitOrder.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'failed';
        state.error = action.error.message || 'Не удалось оформить заказ';
        state.requestId = null;
        state.isModalOpen = false;
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

export const { clearOrderSubmission } = orderSubmissionSlice.actions;
const orderSubmissionReducer: Reducer<TOrderSubmissionState> =
  orderSubmissionSlice.reducer;
export default orderSubmissionReducer;
