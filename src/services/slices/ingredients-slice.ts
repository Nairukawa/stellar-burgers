import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { getIngredientsApi } from '@api';
import type { TIngredient } from '@utils-types';
import type { TRequestStatus, TThunkConfig } from '../types';

type TIngredientsState = {
  items: TIngredient[];
  status: TRequestStatus;
  error: string | null;
};

const initialState: TIngredientsState = {
  items: [],
  status: 'idle',
  error: null
};

export const fetchIngredients = createAsyncThunk<
  TIngredient[],
  void,
  TThunkConfig
>('ingredients/fetchIngredients', async () => getIngredientsApi());

const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIngredients.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchIngredients.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          action.error.message || 'Не удалось загрузить ингредиенты';
      });
  }
});

const ingredientsReducer: Reducer<TIngredientsState> = ingredientsSlice.reducer;
export default ingredientsReducer;
