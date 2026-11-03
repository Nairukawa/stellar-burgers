import type { Location } from 'react-router-dom';
import type { TIngredient, TOrder } from '@utils-types';

export type OrderCardUIProps = {
  orderInfo: TOrderInfo;
  maxIngredients: number;
  locationState: { background: Location };
};

type TOrderInfo = TOrder & {
  ingredientsInfo: TIngredient[];
  ingredientsToShow: TIngredient[];
  remains: number;
  total: number;
  date: Date;
};
