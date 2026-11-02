import { FC, memo } from 'react';
import clsx from 'clsx';
import { RefreshButton } from '@zlden/react-developer-burger-ui-components';
import { OrdersList, FeedInfo } from '@components';

import styles from './feed.module.css';
import { FeedUIProps } from './type';

export const FeedUI: FC<FeedUIProps> = memo(({ orders, handleGetFeeds }) => (
  <main className={styles.containerMain}>
    <div className={clsx(styles.titleBox, 'mt-10 mb-5')}>
      <h1 className={clsx(styles.title, 'text text_type_main-large')}>
        Лента заказов
      </h1>
      <RefreshButton
        text='Обновить'
        onClick={handleGetFeeds}
        extraClass='ml-30'
      />
    </div>

    <div className={styles.main}>
      <div className={styles.columnOrders}>
        {orders.length > 0 ? (
          <OrdersList orders={orders} />
        ) : (
          <p className='text text_type_main-default'>Заказов пока нет</p>
        )}
      </div>

      <div className={styles.columnInfo}>
        <FeedInfo />
      </div>
    </div>
  </main>
));
