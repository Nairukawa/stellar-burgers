import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export const selectConstructor = (state: RootState) => state.burgerConstructor;

export const selectIsConstructorLocked = (state: RootState) =>
  state.burgerConstructor.requestId !== null;

export const selectConstructorPrice = createSelector(
  [selectConstructor],
  ({ bun, ingredients }) =>
    (bun ? bun.price * 2 : 0) +
    ingredients.reduce((total, ingredient) => total + ingredient.price, 0)
);

export const selectConstructorCounters = createSelector(
  [selectConstructor],
  ({ bun, ingredients }) => {
    const counters: Record<string, number> = {};
    ingredients.forEach((ingredient) => {
      counters[ingredient._id] = (counters[ingredient._id] || 0) + 1;
    });
    if (bun) counters[bun._id] = 2;
    return counters;
  }
);
