import type { RootState } from '../store';

export const selectOrderSubmission = (state: RootState) =>
  state.orderSubmission;
export const selectProfileOrders = (state: RootState) => state.profileOrders;
export const selectOrderDetails = (state: RootState) => state.orderDetails;
