import type { ReactNode } from 'react';
import { TOrder } from '@utils-types';

export type ProfileOrdersUIProps = {
  orders: TOrder[];
  content?: ReactNode;
};
