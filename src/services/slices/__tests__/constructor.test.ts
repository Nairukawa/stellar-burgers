import constructorReducer, {
  addIngredient,
  clearConstructor,
  moveIngredient,
  removeIngredient
} from '../constructor-slice';
import { submitOrder } from '../order-submission-slice';
import { loginUser, logoutUser, registerUser } from '../auth-slice';
import {
  selectConstructorCounters,
  selectConstructorPrice
} from '../../selectors/constructor-selectors';
import type { TIngredient, TOrder } from '@utils-types';

jest.mock('@api', () => ({
  getOrderByNumberApi: jest.fn(),
  getOrdersApi: jest.fn(),
  orderBurgerApi: jest.fn(),
  getUserApi: jest.fn(),
  loginUserApi: jest.fn(),
  registerUserApi: jest.fn(),
  logoutApi: jest.fn(),
  refreshToken: jest.fn()
}));

const ingredient = (
  id: string,
  type: string = 'main',
  price: number = 50
): TIngredient => ({
  _id: id,
  name: `Ingredient ${id}`,
  type,
  proteins: 1,
  fat: 2,
  carbohydrates: 3,
  calories: 4,
  price,
  image: 'test-image',
  image_large: 'test-image-large',
  image_mobile: 'test-image-mobile'
});

const buildBurger = () => {
  const state = constructorReducer(
    undefined,
    addIngredient(ingredient('bun', 'bun'))
  );

  return constructorReducer(state, addIngredient(ingredient('filling')));
};

const order: TOrder = {
  _id: 'order-1',
  number: 101,
  name: 'Test burger',
  status: 'done',
  ingredients: ['bun', 'filling', 'bun'],
  createdAt: '2026-11-02T10:00:00.000Z',
  updatedAt: '2026-11-02T10:00:00.000Z'
};

describe('burger constructor', () => {
  it('replaces the bun while keeping the selected fillings', () => {
    let state = constructorReducer(
      undefined,
      addIngredient(ingredient('bun-a', 'bun'))
    );
    state = constructorReducer(state, addIngredient(ingredient('filling')));
    state = constructorReducer(
      state,
      addIngredient(ingredient('bun-b', 'bun'))
    );

    expect(state.bun).toMatchObject({ _id: 'bun-b', type: 'bun' });
    expect(state.ingredients.map((item) => item._id)).toEqual(['filling']);
  });

  it('gives repeated fillings independent identities and removes only the selected copy', () => {
    const filling = ingredient('same-filling');
    let state = constructorReducer(undefined, addIngredient(filling));
    state = constructorReducer(state, addIngredient(filling));

    const [first, second] = state.ingredients;
    expect(first.id).not.toBe(second.id);

    state = constructorReducer(state, removeIngredient(first.id));
    expect(state.ingredients).toEqual([second]);
    expect(filling).not.toHaveProperty('id');
  });

  it('counts both bun halves and each filling copy in the price and ingredient counters', () => {
    let state = constructorReducer(
      undefined,
      addIngredient(ingredient('bun-a', 'bun', 100))
    );
    state = constructorReducer(
      state,
      addIngredient(ingredient('filling', 'main', 50))
    );
    state = constructorReducer(
      state,
      addIngredient(ingredient('filling', 'main', 50))
    );

    expect(selectConstructorCounters.resultFunc(state)).toEqual({
      'bun-a': 2,
      filling: 2
    });
    expect(selectConstructorPrice.resultFunc(state)).toBe(300);

    state = constructorReducer(
      state,
      addIngredient(ingredient('bun-b', 'bun', 150))
    );
    expect(selectConstructorCounters.resultFunc(state)).toEqual({
      'bun-b': 2,
      filling: 2
    });
    expect(selectConstructorPrice.resultFunc(state)).toBe(400);
  });

  it('moves the chosen filling and safely ignores moves beyond the ends', () => {
    let state = constructorReducer(
      undefined,
      addIngredient(ingredient('first'))
    );
    state = constructorReducer(state, addIngredient(ingredient('second')));
    state = constructorReducer(state, addIngredient(ingredient('third')));
    const secondId = state.ingredients[1].id;

    state = constructorReducer(
      state,
      moveIngredient({ id: secondId, direction: 'up' })
    );
    expect(state.ingredients.map((item) => item._id)).toEqual([
      'second',
      'first',
      'third'
    ]);

    state = constructorReducer(
      state,
      moveIngredient({ id: secondId, direction: 'up' })
    );
    expect(state.ingredients.map((item) => item._id)).toEqual([
      'second',
      'first',
      'third'
    ]);

    state = constructorReducer(
      state,
      moveIngredient({ id: secondId, direction: 'down' })
    );
    state = constructorReducer(
      state,
      moveIngredient({ id: secondId, direction: 'down' })
    );
    state = constructorReducer(
      state,
      moveIngredient({ id: secondId, direction: 'down' })
    );
    state = constructorReducer(
      state,
      moveIngredient({ id: 'missing', direction: 'up' })
    );
    expect(state.ingredients.map((item) => item._id)).toEqual([
      'first',
      'third',
      'second'
    ]);
  });

  it('keeps the submitted composition unchanged until the request finishes', () => {
    let state = constructorReducer(
      undefined,
      addIngredient(ingredient('bun', 'bun'))
    );
    state = constructorReducer(state, addIngredient(ingredient('filling')));
    const original = state;
    const fillingId = state.ingredients[0].id;
    state = constructorReducer(
      state,
      submitOrder.pending('request-1', undefined)
    );

    state = constructorReducer(state, addIngredient(ingredient('other')));
    state = constructorReducer(state, removeIngredient(fillingId));
    state = constructorReducer(state, clearConstructor());
    expect(state.bun).toEqual(original.bun);
    expect(state.ingredients).toEqual(original.ingredients);

    state = constructorReducer(
      state,
      submitOrder.rejected(new Error('Offline'), 'request-1', undefined)
    );
    expect(state.requestId).toBeNull();
    expect(state.ingredients).toEqual(original.ingredients);

    state = constructorReducer(state, removeIngredient(fillingId));
    expect(state.ingredients).toEqual([]);
  });

  it('clears the burger only after its own successful submission', () => {
    let state = constructorReducer(
      undefined,
      addIngredient(ingredient('bun', 'bun'))
    );
    state = constructorReducer(state, addIngredient(ingredient('filling')));
    state = constructorReducer(
      state,
      submitOrder.pending('current-request', undefined)
    );

    state = constructorReducer(
      state,
      submitOrder.fulfilled(order, 'older-request', undefined)
    );
    expect(state.bun?._id).toBe('bun');
    expect(state.ingredients).toHaveLength(1);

    state = constructorReducer(
      state,
      submitOrder.fulfilled(order, 'current-request', undefined)
    );
    expect(state).toEqual({ bun: null, ingredients: [], requestId: null });
  });

  it('preserves a guest burger through login and ignores the old request after a session change', () => {
    let state = constructorReducer(
      undefined,
      addIngredient(ingredient('bun', 'bun'))
    );
    state = constructorReducer(state, addIngredient(ingredient('filling')));
    state = constructorReducer(
      state,
      submitOrder.pending('old-request', undefined)
    );
    state = constructorReducer(
      state,
      loginUser.pending('login-request', {
        email: 'test@example.com',
        password: 'test-password'
      })
    );

    expect(state.bun?._id).toBe('bun');
    expect(state.ingredients).toHaveLength(1);
    expect(state.requestId).toBeNull();

    state = constructorReducer(state, addIngredient(ingredient('new-filling')));
    state = constructorReducer(
      state,
      submitOrder.fulfilled(order, 'old-request', undefined)
    );
    expect(state.ingredients.map((item) => item._id)).toEqual([
      'filling',
      'new-filling'
    ]);

    state = constructorReducer(
      state,
      logoutUser.fulfilled(undefined, 'logout-request', undefined)
    );
    expect(state).toEqual({ bun: null, ingredients: [], requestId: null });
  });

  it('returns the initial state for an unknown action', () => {
    expect(constructorReducer(undefined, { type: 'UNKNOWN' })).toEqual({
      bun: null,
      ingredients: [],
      requestId: null
    });
  });

  it('preserves the burger for an unknown action', () => {
    const state = constructorReducer(
      undefined,
      addIngredient(ingredient('filling'))
    );

    expect(constructorReducer(state, { type: 'UNKNOWN' })).toBe(state);
  });

  it('clears the constructor when no request is in progress', () => {
    const state = buildBurger();

    expect(constructorReducer(state, clearConstructor())).toEqual({
      bun: null,
      ingredients: [],
      requestId: null
    });
  });

  it('stores the request ID when order submission starts', () => {
    const state = buildBurger();

    expect(
      constructorReducer(state, submitOrder.pending('request-1', undefined))
    ).toEqual({
      ...state,
      requestId: 'request-1'
    });
  });

  it('preserves the burger and clears the request ID when registration starts', () => {
    let state = buildBurger();
    const original = state;

    state = constructorReducer(
      state,
      submitOrder.pending('old-request', undefined)
    );

    expect(
      constructorReducer(
        state,
        registerUser.pending('register-request', {
          name: 'Test user',
          email: 'test@example.com',
          password: 'test-password'
        })
      )
    ).toEqual(original);
  });
});
