import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';

const bunName = 'Тестовая булка';
const fillingName = 'Тестовая начинка';

const expectEmptyConstructor = async (page: Page) => {
  const constructor = page.getByTestId('burger-constructor');

  await expect(constructor).toBeVisible();
  await expect(
    constructor.getByText('Выберите булки', { exact: true })
  ).toHaveCount(2);
  await expect(
    constructor.getByText('Выберите начинку', { exact: true })
  ).toBeVisible();
  await expect(
    constructor.getByText(`${bunName} (верх)`, { exact: true })
  ).toHaveCount(0);
  await expect(
    constructor.getByText(`${bunName} (низ)`, { exact: true })
  ).toHaveCount(0);
  await expect(constructor.getByText(fillingName, { exact: true })).toHaveCount(
    0
  );
};

const expectBurger = async (page: Page) => {
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
};

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
  const card = page.getByTestId('ingredient-bun-test');
  const modal = page.getByTestId('modal');

  await expect(card).toBeVisible();
  await expect(modal).toHaveCount(0);
  await card.getByRole('link').click();
  await expect(modal).toBeVisible();
  await expect(
    modal.getByText('Детали ингредиента', { exact: true })
  ).toBeVisible();
  await expect(modal.getByText(bunName, { exact: true })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await page.routeFromHAR(path.join(__dirname, 'hars', 'burger-api.har'), {
    url: '**/api/**',
    update: false,
    notFound: 'abort'
  });
});

test.describe('Добавление ингредиентов в конструктор', () => {
  test('Добавление булки и начинки', async ({ page }) => {
    await page.goto('/');
    await expectEmptyConstructor(page);
    await addBurger(page);
    await expectBurger(page);
  });
});

test.describe('Модальное окно ингредиента', () => {
  test('Открытие и закрытие крестиком', async ({ page }) => {
    await openIngredient(page);
    const modal = page.getByTestId('modal');

    await modal.locator('button svg').click();

    await expect(modal).toHaveCount(0);
    await expect(page.getByTestId('modal-overlay')).toHaveCount(0);
    await expect(page).toHaveURL('/');
  });

  test('Закрытие нажатием на фон', async ({ page }) => {
    await openIngredient(page);

    await page
      .getByTestId('modal-overlay')
      .click({ position: { x: 10, y: 10 } });

    await expect(page.getByTestId('modal')).toHaveCount(0);
    await expect(page.getByTestId('modal-overlay')).toHaveCount(0);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Оформление заказа', () => {
  test('Показ номера заказа и очистка конструктора', async ({
    page,
    context
  }) => {
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

    await page.goto('/');
    await expect(
      page.getByRole('link', { name: 'Тестовый пользователь', exact: true })
    ).toBeVisible();
    await expectEmptyConstructor(page);
    await addBurger(page);
    await expectBurger(page);

    const modal = page.getByTestId('modal');
    await expect(modal).toHaveCount(0);

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

    await expect(modal).toBeVisible();
    await expect(
      modal.getByRole('heading', { name: '12345', exact: true })
    ).toBeVisible();
    await expectEmptyConstructor(page);

    await modal.locator('button svg').click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByTestId('modal-overlay')).toHaveCount(0);
  });
});
