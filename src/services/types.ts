import type { RootState } from './store';

export type TRequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type TRequestState = {
  status: TRequestStatus;
  error: string | null;
  requestId: string | null;
};

export type TThunkConfig = {
  state: RootState;
};
