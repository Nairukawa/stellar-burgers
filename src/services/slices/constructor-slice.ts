import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';
import type { TConstructorIngredient, TIngredient } from '@utils-types';
import { loginUser, logoutUser, registerUser } from './auth-slice';
import { submitOrder } from './orders-slice';

export type TConstructorState = {
  bun: TIngredient | null;
  ingredients: TConstructorIngredient[];
  requestId: string | null;
};

const initialState: TConstructorState = {
  bun: null,
  ingredients: [],
  requestId: null
};

const constructorSlice = createSlice({
  name: 'burgerConstructor',
  initialState,
  reducers: {
    addIngredient: {
      reducer: (state, action: PayloadAction<TConstructorIngredient>) => {
        if (state.requestId) return;

        if (action.payload.type === 'bun') {
          state.bun = action.payload;
        } else {
          state.ingredients.push(action.payload);
        }
      },
      prepare: (ingredient: TIngredient) => ({
        payload: { ...ingredient, id: nanoid() }
      })
    },
    removeIngredient: (state, action: PayloadAction<string>) => {
      if (state.requestId) return;

      const index = state.ingredients.findIndex(
        (ingredient) => ingredient.id === action.payload
      );
      if (index !== -1) state.ingredients.splice(index, 1);
    },
    moveIngredient: (
      state,
      action: PayloadAction<{ id: string; direction: 'up' | 'down' }>
    ) => {
      if (state.requestId) return;

      const index = state.ingredients.findIndex(
        (ingredient) => ingredient.id === action.payload.id
      );
      if (index === -1) return;

      const nextIndex = index + (action.payload.direction === 'up' ? -1 : 1);
      if (nextIndex < 0 || nextIndex >= state.ingredients.length) return;

      const [ingredient] = state.ingredients.splice(index, 1);
      state.ingredients.splice(nextIndex, 0, ingredient);
    },
    clearConstructor: (state) => {
      if (!state.requestId) return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending, (state, action) => {
        state.requestId = action.meta.requestId;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        if (state.requestId === action.meta.requestId) return initialState;
      })
      .addCase(submitOrder.rejected, (state, action) => {
        if (state.requestId === action.meta.requestId) state.requestId = null;
      })
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(loginUser.pending, (state) => {
        state.requestId = null;
      })
      .addCase(registerUser.pending, (state) => {
        state.requestId = null;
      });
  }
});

export const {
  addIngredient,
  removeIngredient,
  moveIngredient,
  clearConstructor
} = constructorSlice.actions;

export default constructorSlice.reducer;
