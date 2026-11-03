import { FC, memo, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { OrderCardProps } from './type';
import { TIngredient } from '@utils-types';
import { OrderCardUI } from '../ui/order-card';
import { useSelector } from '../../services/store';
import { selectIngredients } from '../../services/selectors/ingredients-selectors';

const maxIngredients = 6;

export const OrderCard: FC<OrderCardProps> = memo(({ order }) => {
  const location = useLocation();
  const ingredients = useSelector(selectIngredients);

  const orderInfo = useMemo(() => {
    const ingredientsById = new Map(
      ingredients.map((ingredient) => [ingredient._id, ingredient])
    );
    const ingredientsInfo = order.ingredients.reduce<TIngredient[]>(
      (result, id) => {
        const ingredient = ingredientsById.get(id);
        if (ingredient) result.push(ingredient);
        return result;
      },
      []
    );

    return {
      ...order,
      ingredientsInfo,
      ingredientsToShow: ingredientsInfo.slice(0, maxIngredients),
      remains: Math.max(ingredientsInfo.length - maxIngredients, 0),
      total: ingredientsInfo.reduce((sum, item) => sum + item.price, 0),
      date: new Date(order.createdAt)
    };
  }, [order, ingredients]);

  return (
    <OrderCardUI
      orderInfo={orderInfo}
      maxIngredients={maxIngredients}
      locationState={{ background: location }}
    />
  );
});
