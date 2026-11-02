import type { RootState } from '../store';

export const selectOrderSubmission = (state: RootState) =>
  state.orders.submission;
export const selectProfileOrders = (state: RootState) => state.orders.history;
export const selectOrderDetails = (state: RootState) => state.orders.details;
