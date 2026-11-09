import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';

const bunName = 'Тестовая булка';
const fillingName = 'Тестовая начинка';

const addBurger = async (page: Page) => {
  await page
    .getByTestId('ingredient-bun-test')
    .getByRole('button', { name: 'Добавить', exact: true })
    .click();

  await page
    .getByTestId('ingredient-main-test')
    .getByRole('button', { name: 'Добавить', exact: true })
    .click();
};

const openIngredient = async (page: Page) => {
  await page.goto('/');

  await page
    .getByTestId('ingredient-bun-test')
    .getByRole('link')
    .click();

  await expect(page.getByTestId('modal')).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) => route.abort());

  await page.routeFromHAR(
    path.join(__dirname, 'fixtures', 'ingredients.har'),
    {
      url: '**/api/ingredients',
      update: false,
      notFound: 'abort'
    }
  );
});

test('Добавление булки и начинки в конструктор', async ({ page }) => {
  await page.goto('/');
  await addBurger(page);

  const constructor = page.getByTestId('burger-constructor');

  await expect(
    constructor.getByText(`${bunName} (верх)`, { exact: true })
  ).toBeVisible();

  await expect(
    constructor.getByText(`${bunName} (низ)`, { exact: true })
  ).toBeVisible();

  await expect(
    constructor.getByText(fillingName, { exact: true })
  ).toBeVisible();
});

test('Открытие ингредиента и закрытие крестиком', async ({ page }) => {
  await openIngredient(page);

  const modal = page.getByTestId('modal');

  await expect(
    modal.getByText('Детали ингредиента', { exact: true })
  ).toBeVisible();

  await expect(
    modal.getByText(bunName, { exact: true })
  ).toBeVisible();

  await modal.locator('button svg').click();

  await expect(modal).toHaveCount(0);
  await expect(page).toHaveURL('/');
});

test('Закрытие ингредиента нажатием на фон', async ({ page }) => {
  await openIngredient(page);

  await page.getByTestId('modal-overlay').click({
    position: { x: 10, y: 10 }
  });

  await expect(page.getByTestId('modal')).toHaveCount(0);
  await expect(page).toHaveURL('/');
});

test('Оформление заказа и очистка конструктора', async ({
  page,
  context
}) => {
  const user = {
    name: 'Тестовый пользователь',
    email: 'test@example.com'
  };

  const orderNumber = 12345;
  const date = '2026-01-01T00:00:00.000Z';

  await context.addCookies([
    {
      name: 'accessToken',
      value: 'test-access-token',
      url: 'http://localhost:4000'
    }
  ]);

  await page.addInitScript(() => {
    localStorage.setItem('refreshToken', 'test-refresh-token');
  });

  await page.route('**/api/auth/user', (route) =>
    route.fulfill({
      json: {
        success: true,
        user
      }
    })
  );

  await page.route('**/api/orders', (route) => {
    if (route.request().method() !== 'POST') {
      return route.abort();
    }

    return route.fulfill({
      json: {
        success: true,
        name: 'Тестовый бургер',
        order: {
          _id: 'test-order',
          number: orderNumber,
          name: 'Тестовый бургер',
          status: 'done',
          ingredients: ['bun-test', 'main-test', 'bun-test'],
          createdAt: date,
          updatedAt: date,
          owner: {
            ...user,
            createdAt: date,
            updatedAt: date
          },
          price: 250
        }
      }
    });
  });

  await page.goto('/');

  await expect(
    page.getByRole('link', { name: user.name, exact: true })
  ).toBeVisible();

  await addBurger(page);

  const orderRequest = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/orders' &&
      request.method() === 'POST'
  );

  await page
    .getByRole('button', { name: 'Оформить заказ', exact: true })
    .click();

  expect((await orderRequest).postDataJSON()).toEqual({
    ingredients: ['bun-test', 'main-test', 'bun-test']
  });

  const modal = page.getByTestId('modal');

  await expect(modal).toBeVisible();

  await expect(
    modal.getByRole('heading', {
      name: String(orderNumber),
      exact: true
    })
  ).toBeVisible();

  const constructor = page.getByTestId('burger-constructor');

  await expect(
    constructor.getByText('Выберите булки', { exact: true })
  ).toHaveCount(2);

  await expect(
    constructor.getByText('Выберите начинку', { exact: true })
  ).toBeVisible();

  await expect(
    constructor.getByText(fillingName, { exact: true })
  ).toHaveCount(0);

  await modal.locator('button svg').click();

  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId('modal-overlay')).toHaveCount(0);
});