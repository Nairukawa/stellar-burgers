import { FC, useEffect } from 'react';
import { Button } from '@zlden/react-developer-burger-ui-components';
import { Preloader } from '@ui';
import { FeedUI } from '@ui-pages';

import { useDispatch, useSelector } from '../../services/store';
import { selectFeed } from '../../services/selectors/feed-selectors';
import {
  selectIngredientsError,
  selectIngredientsStatus
} from '../../services/selectors/ingredients-selectors';
import { fetchFeed } from '../../services/slices/feed-slice';
import { fetchIngredients } from '../../services/slices/ingredients-slice';

export const Feed: FC = () => {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector(selectFeed);
  const ingredientsStatus = useSelector(selectIngredientsStatus);
  const ingredientsError = useSelector(selectIngredientsError);

  useEffect(() => {
    dispatch(fetchFeed());
  }, [dispatch]);

  const handleGetFeeds = () => {
    dispatch(fetchFeed());
  };

  if (status === 'idle' || status === 'loading') {
    return <Preloader />;
  }

  if (status === 'failed') {
    return (
      <div>
        <p role='alert'>{error}</p>
        <Button htmlType='button' type='secondary' onClick={handleGetFeeds}>
          Повторить загрузку
        </Button>
      </div>
    );
  }

  if (
    orders.length > 0 &&
    (ingredientsStatus === 'idle' || ingredientsStatus === 'loading')
  ) {
    return <Preloader />;
  }

  if (orders.length > 0 && ingredientsStatus === 'failed') {
    return (
      <div>
        <p role='alert'>
          {ingredientsError || 'Не удалось загрузить ингредиенты заказов'}
        </p>
        <Button
          htmlType='button'
          type='secondary'
          onClick={() => dispatch(fetchIngredients())}
        >
          Повторить загрузку ингредиентов
        </Button>
      </div>
    );
  }

  return <FeedUI orders={orders} handleGetFeeds={handleGetFeeds} />;
};
