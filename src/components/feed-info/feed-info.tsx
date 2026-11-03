import { FC } from 'react';
import type { TOrder } from '@utils-types';
import { FeedInfoUI } from '../ui/feed-info';
import { useSelector } from '../../services/store';
import { selectFeed } from '../../services/selectors/feed-selectors';

const MAX_ORDERS_PER_STATUS = 20;

const getOrderNumbers = (orders: TOrder[], status: string): number[] =>
  orders
    .filter((order) => order.status === status)
    .map((order) => order.number)
    .slice(0, MAX_ORDERS_PER_STATUS);

export const FeedInfo: FC = () => {
  const feed = useSelector(selectFeed);

  const readyOrders = getOrderNumbers(feed.orders, 'done');
  const pendingOrders = getOrderNumbers(feed.orders, 'pending');

  return (
    <FeedInfoUI
      readyOrders={readyOrders}
      pendingOrders={pendingOrders}
      feed={feed}
    />
  );
};
