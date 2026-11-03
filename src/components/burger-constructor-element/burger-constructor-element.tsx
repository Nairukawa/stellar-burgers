import { FC, memo } from 'react';
import { BurgerConstructorElementUI } from '@ui';
import { BurgerConstructorElementProps } from './type';
import { useDispatch, useSelector } from '../../services/store';
import {
  moveIngredient,
  removeIngredient
} from '../../services/slices/constructor-slice';
import { selectIsConstructorLocked } from '../../services/selectors/constructor-selectors';

export const BurgerConstructorElement: FC<BurgerConstructorElementProps> = memo(
  ({ ingredient, index, totalItems }) => {
    const dispatch = useDispatch();
    const isLocked = useSelector(selectIsConstructorLocked);

    const handleMoveDown = () => {
      if (!isLocked) {
        dispatch(moveIngredient({ id: ingredient.id, direction: 'down' }));
      }
    };

    const handleMoveUp = () => {
      if (!isLocked) {
        dispatch(moveIngredient({ id: ingredient.id, direction: 'up' }));
      }
    };

    const handleClose = () => {
      if (!isLocked) dispatch(removeIngredient(ingredient.id));
    };

    return (
      <BurgerConstructorElementUI
        ingredient={ingredient}
        index={index}
        totalItems={totalItems}
        handleMoveUp={handleMoveUp}
        handleMoveDown={handleMoveDown}
        handleClose={handleClose}
      />
    );
  }
);
