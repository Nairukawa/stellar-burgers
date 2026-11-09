import ingredientsReducer, { fetchIngredients } from '../ingredients-slice';
import type { TIngredient } from '@utils-types';

jest.mock('@api', () => ({
  getIngredientsApi: jest.fn()
}));

const ingredient: TIngredient = {
  _id: 'ingredient-1',
  name: 'Test ingredient',
  type: 'main',
  proteins: 1,
  fat: 2,
  carbohydrates: 3,
  calories: 4,
  price: 50,
  image: 'test-image',
  image_large: 'test-image-large',
  image_mobile: 'test-image-mobile'
};

describe('ingredients reducer', () => {
  it('возвращает начальное состояние для неизвестного действия', () => {
    expect(ingredientsReducer(undefined, { type: 'UNKNOWN' })).toEqual({
      items: [],
      status: 'idle',
      error: null
    });
  });

  it('сохраняет существующее состояние при неизвестном действии', () => {
    const state: ReturnType<typeof ingredientsReducer> = {
      items: [ingredient],
      status: 'succeeded',
      error: null
    };

    expect(ingredientsReducer(state, { type: 'UNKNOWN' })).toBe(state);
  });

  it('включает загрузку и очищает старую ошибку', () => {
    const state: ReturnType<typeof ingredientsReducer> = {
      items: [ingredient],
      status: 'failed',
      error: 'Previous error'
    };

    expect(
      ingredientsReducer(
        state,
        fetchIngredients.pending('request-1', undefined)
      )
    ).toEqual({
      items: [ingredient],
      status: 'loading',
      error: null
    });
  });

  it('сохраняет полученные ингредиенты и очищает ошибку', () => {
    const state: ReturnType<typeof ingredientsReducer> = {
      items: [],
      status: 'failed',
      error: 'Previous error'
    };

    expect(
      ingredientsReducer(
        state,
        fetchIngredients.fulfilled([ingredient], 'request-1', undefined)
      )
    ).toEqual({
      items: [ingredient],
      status: 'succeeded',
      error: null
    });
  });

  it('сохраняет ошибку и завершает загрузку', () => {
    const state: ReturnType<typeof ingredientsReducer> = {
      items: [ingredient],
      status: 'loading',
      error: null
    };

    expect(
      ingredientsReducer(
        state,
        fetchIngredients.rejected(new Error('Offline'), 'request-1', undefined)
      )
    ).toEqual({
      items: [ingredient],
      status: 'failed',
      error: 'Offline'
    });
  });

  it('использует запасной текст ошибки, если сообщения нет', () => {
    const action = {
      ...fetchIngredients.rejected(null, 'request-1', undefined),
      error: {}
    };

    expect(ingredientsReducer(undefined, action)).toEqual({
      items: [],
      status: 'failed',
      error: 'Не удалось загрузить ингредиенты'
    });
  });
});
