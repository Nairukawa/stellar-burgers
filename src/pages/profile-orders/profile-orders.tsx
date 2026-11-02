import { FC, ReactNode, useEffect } from 'react';
import { Button } from '@zlden/react-developer-burger-ui-components';
import { Preloader } from '@ui';
import { ProfileOrdersUI } from '@ui-pages';
import { useDispatch, useSelector } from '../../services/store';
import { selectAuth } from '../../services/selectors/auth-selectors';
import { selectProfileOrders } from '../../services/selectors/orders-selectors';
import {
  selectIngredientsError,
  selectIngredientsStatus
} from '../../services/selectors/ingredients-selectors';
import { fetchProfileOrders } from '../../services/slices/orders-slice';
import { fetchIngredients } from '../../services/slices/ingredients-slice';

export const ProfileOrders: FC = () => {
  const dispatch = useDispatch();
  const { user, isLoading: isAuthLoading } = useSelector(selectAuth);
  const orders = useSelector(selectProfileOrders);
  const ingredientsStatus = useSelector(selectIngredientsStatus);
  const ingredientsError = useSelector(selectIngredientsError);
  const email = user?.email;

  useEffect(() => {
    if (email && !isAuthLoading) {
      dispatch(fetchProfileOrders());
    }
  }, [dispatch, email, isAuthLoading]);

  let content: ReactNode;

  if (!email || isAuthLoading) {
    content = <Preloader />;
  } else if (orders.status === 'failed') {
    content = (
      <div>
        <p role='alert' className='text text_type_main-default mb-4'>
          {orders.error || 'Не удалось загрузить историю заказов'}
        </p>
        <Button
          htmlType='button'
          type='secondary'
          onClick={() => dispatch(fetchProfileOrders())}
        >
          Повторить загрузку
        </Button>
      </div>
    );
  } else if (orders.status === 'idle' || orders.status === 'loading') {
    content = <Preloader />;
  } else if (!orders.items.length) {
    content = (
      <p className='text text_type_main-default'>
        У вас пока нет заказов. Соберите свой первый бургер!
      </p>
    );
  } else if (ingredientsStatus === 'failed') {
    content = (
      <div>
        <p role='alert' className='text text_type_main-default mb-4'>
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
  } else if (ingredientsStatus === 'idle' || ingredientsStatus === 'loading') {
    content = <Preloader />;
  }

  return <ProfileOrdersUI orders={orders.items} content={content} />;
};
