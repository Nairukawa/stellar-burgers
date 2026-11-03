import { FC } from 'react';
import { useParams } from 'react-router-dom';

import { useSelector } from '../../services/store';
import {
  selectIngredients,
  selectIngredientsStatus,
  selectIngredientsError
} from '../../services/selectors/ingredients-selectors';

import { Preloader } from '../ui/preloader';
import { IngredientDetailsUI } from '../ui/ingredient-details';

export const IngredientDetails: FC = () => {
  const { id } = useParams<{ id: string }>();

  const ingredients = useSelector(selectIngredients);
  const status = useSelector(selectIngredientsStatus);
  const error = useSelector(selectIngredientsError);

  if (status === 'idle' || status === 'loading') {
    return <Preloader />;
  }

  if (status === 'failed') {
    return (
      <p className='text text_type_main-default'>
        {error || 'Не удалось загрузить ингредиенты'}
      </p>
    );
  }

  const ingredientData = ingredients.find(
    (ingredient) => ingredient._id === id
  );

  if (!ingredientData) {
    return <p className='text text_type_main-default'>Ингредиент не найден</p>;
  }

  return <IngredientDetailsUI ingredientData={ingredientData} />;
};
