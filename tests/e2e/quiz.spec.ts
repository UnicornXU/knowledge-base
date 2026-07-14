import {expect, test} from '@playwright/test';

test('user can start a five-question quiz with the keyboard', async ({page}) => {
  await page.goto('/quiz');
  const category = page.getByRole('button', {name: /JavaScript.*道题/});
  await category.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', {name: /JavaScript/})).toBeVisible();
  await page.getByRole('button', {name: /5 题.*快速练习/}).click();
  await page.getByRole('button', {name: /开始答题/}).click();
  await expect(page.getByText('第 1 / 5 题')).toBeVisible();
});
