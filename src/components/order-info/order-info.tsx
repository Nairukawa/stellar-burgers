import { FC, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Button } from '@zlden/react-developer-burger-ui-components';
import { Preloader } from '../ui/preloader';
import { OrderInfoUI } from '../ui/order-info';
import { TIngredient } from '@utils-types';
import { useDispatch, useSelector } from '../../services/store';
import { selectAuth } from '../../services/selectors/auth-selectors';
import { selectOrderDetails } from '../../services/selectors/orders-selectors';
import {
  selectIngredients,
  selectIngredientsError,
  selectIngredientsStatus
} from '../../services/selectors/ingredients-selectors';
import { fetchOrderDetails } from '../../services/slices/orders-slice';
import { fetchIngredients } from '../../services/slices/ingredients-slice';

export const OrderInfo: FC = () => {
  const dispatch = useDispatch();
  const { number } = useParams<{ number: string }>();
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useSelector(selectAuth);
  const details = useSelector(selectOrderDetails);
  const ingredients = useSelector(selectIngredients);
  const ingredientsStatus = useSelector(selectIngredientsStatus);
  const ingredientsError = useSelector(selectIngredientsError);

  const orderNumber = Number(number);
  const isValidNumber =
    /^\d+$/.test(number || '') &&
    Number.isSafeInteger(orderNumber) &&
    orderNumber > 0;
  const isPrivate = location.pathname.startsWith('/profile/orders/');
  const ownerEmail = isPrivate ? user?.email : undefined;
  const isWaitingForAuth = isPrivate && (!ownerEmail || isAuthLoading);
  const isCurrentOrder =
    details.number === orderNumber && details.isPrivate === isPrivate;

  useEffect(() => {
    if (isValidNumber && !isWaitingForAuth) {
      dispatch(fetchOrderDetails({ number: orderNumber, isPrivate }));
    }
  }, [
    dispatch,
    orderNumber,
    isPrivate,
    isValidNumber,
    ownerEmail,
    isWaitingForAuth
  ]);

  const orderInfo = useMemo(() => {
    if (!isCurrentOrder || !details.order) return null;

    const ingredientsById = new Map(
      ingredients.map((ingredient) => [ingredient._id, ingredient])
    );
    const ingredientsInfo: Record<string, TIngredient & { count: number }> = {};

    details.order.ingredients.forEach((id) => {
      const ingredient = ingredientsById.get(id);
      if (!ingredient) return;

      if (ingredientsInfo[id]) {
        ingredientsInfo[id].count += 1;
      } else {
        ingredientsInfo[id] = { ...ingredient, count: 1 };
      }
    });

    return {
      ...details.order,
      ingredientsInfo,
      date: new Date(details.order.createdAt),
      total: Object.values(ingredientsInfo).reduce(
        (sum, item) => sum + item.price * item.count,
        0
      )
    };
  }, [details.order, ingredients, isCurrentOrder]);

  if (!isValidNumber) {
    return <p className='text text_type_main-default'>Заказ не найден.</p>;
  }

  if (
    isWaitingForAuth ||
    !isCurrentOrder ||
    details.status === 'idle' ||
    details.status === 'loading'
  ) {
    return <Preloader />;
  }

  if (details.status === 'failed') {
    return (
      <div>
        <p role='alert' className='text text_type_main-default mb-4'>
          {details.error || 'Не удалось загрузить заказ'}
        </p>
        <Button
          htmlType='button'
          type='secondary'
          onClick={() =>
            dispatch(fetchOrderDetails({ number: orderNumber, isPrivate }))
          }
        >
          Повторить загрузку
        </Button>
      </div>
    );
  }

  if (!orderInfo) {
    return <p className='text text_type_main-default'>Заказ не найден.</p>;
  }

  if (ingredientsStatus === 'failed') {
    return (
      <div>
        <p role='alert' className='text text_type_main-default mb-4'>
          {ingredientsError || 'Не удалось загрузить ингредиенты заказа'}
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

  if (ingredientsStatus === 'idle' || ingredientsStatus === 'loading') {
    return <Preloader />;
  }

  const knownIngredientsCount = Object.values(orderInfo.ingredientsInfo).reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <>
      {knownIngredientsCount < orderInfo.ingredients.length && (
        <p className='text text_type_main-small text_color_inactive'>
          Данные части ингредиентов недоступны. Стоимость указана по доступным
          ингредиентам.
        </p>
      )}
      <OrderInfoUI orderInfo={orderInfo} />
    </>
  );
};
