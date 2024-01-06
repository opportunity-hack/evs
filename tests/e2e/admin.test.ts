import { faker } from '@faker-js/faker'
import invariant from 'tiny-invariant'
import { expect, test, insertNewAdmin } from '../playwright-utils.ts'

test('login as admin', async ({ page }) => {
	const password = faker.internet.password()
	const adminUser = await insertNewAdmin({ password })
	invariant(adminUser.name, 'User name not found')
	await page.goto('/login')
	await page
		.getByRole('textbox', { name: /username/i })
		.fill(adminUser.username)
	await page.getByLabel(/^password$/i).fill(password)
	await page.getByRole('button', { name: /log in/i }).click()
	await expect(page).toHaveURL(`/`)

	await expect(page.getByRole('link', { name: /admin/i })).toBeVisible()

	// Navigate to users page
	await page.getByRole('link', { name: /admin/i }).click()
	await page.getByRole('menuitem', { name: 'Users' }).click()
	await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()

	// Open Edit user page
	await page.getByText('open menu').first().click()
	await page.getByRole('menuitem', { name: 'Edit' }).click()
	await expect(page.getByRole('heading', { name: /edit user:/i })).toBeVisible()

	// Test validation for feet
	await page.getByLabel('feet').fill('-1')
	await page.getByRole('button', { name: 'Save' }).click()
	await expect(page.getByText('Feet must be between 0 and 8')).toBeVisible()

	await page.getByLabel('feet').fill('text not allowed')
	await page.getByRole('button', { name: 'Save' }).click()
	await expect(page.getByText('Feet must be a number')).toBeVisible()

	await page.getByLabel('feet').fill('')
	await page.getByLabel('inches').fill('6')
	await page.getByRole('button', { name: 'Save' }).click()
	await expect(
		page.getByText('You must enter both feet and inches for height'),
	).toBeVisible()

	// Heights are saved to database and displayed
	await page.getByLabel('feet').fill('4')
	await page.getByLabel('inches').fill('5')
	await page.getByRole('button', { name: 'Save' }).click()
	await page.getByText('open menu').first().click()
	await page.getByRole('menuitem', { name: 'Edit' }).click()
	await expect(page.getByLabel('feet')).toHaveValue('4')
	await expect(page.getByLabel('inches')).toHaveValue('5')

	// Blank values are saved as null
	await page.getByLabel('feet').fill('')
	await page.getByLabel('inches').fill('')
	await page.getByRole('button', { name: 'Save' }).click()
	await page.getByText('open menu').first().click()
	await page.getByRole('menuitem', { name: 'Edit' }).click()
	await expect(page.getByLabel('feet')).toHaveValue('')
	await expect(page.getByLabel('inches')).toHaveValue('')
})
