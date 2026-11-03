import { TIngredient, TOrder } from '@utils-types';

export type OrderInfoUIProps = {
  orderInfo: TOrderInfo;
};

type TOrderInfo = TOrder & {
  ingredientsInfo: {
    [key: string]: TIngredient & { count: number };
  };
  date: Date;
  total: number;
};
