import type { RootState } from '../store';

export const selectIngredients = (state: RootState) => state.ingredients.items;

export const selectIngredientsStatus = (state: RootState) =>
  state.ingredients.status;

export const selectIngredientsError = (state: RootState) =>
  state.ingredients.error;
