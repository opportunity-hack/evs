import { faker } from '@faker-js/faker'
import invariant from 'tiny-invariant'
import {
    expect,
    hideCurrentMonthEvents,
    insertNewUser,
    test
} from '../playwright-utils.ts'
import { createEvent } from 'tests/db-utils.ts'
import { prisma } from '~/utils/db.server.ts'
import { readEmail } from 'tests/mocks/utils.ts'
import { siteEmailAddress } from '~/data.ts'

const dateRegex = /On: (?<date>[A-Z][a-z]+ [0-9]+[a-z]+, [0-9]+)/
function extractDate (text: string) {
    const match = text.match(dateRegex)
    return match?.groups?.date
}

test('registering for an event', async ({ page }) => {

    // Create fake user
    const password = faker.internet.password()
    const user = await insertNewUser({password})
    invariant(user.name, 'User name not found')

    //email
    const confirmationEmail = {
        name: `${user.name}`,
        username: `${user.username}`,
        email: `${user.email}`,
    }

    // Event Creation setup
    hideCurrentMonthEvents()

    const eventDate = new Date()
    eventDate.setDate(eventDate.getDate() + 2)
    const eventData = await createEvent(eventDate)

    const event = await prisma.event.create({
        data: {
            ...eventData,
        },
    })

    // Login to page
    await page.goto('/login')
    await page.getByRole('textbox', { name: /username/i })
    .fill(user.username)
    await page.getByLabel(/^password$/i).fill(password)
    await page.getByRole('button', { name: /log in/i })
    .click()
    
    await expect(page).toHaveURL(`/`)
    await expect(page.getByRole('link', { name: user.name }))
    .toBeVisible()

    // Navigate to calendar
    await page.getByRole('link', { name: 'Calendar', exact: true })
    .click()
    await expect(page).toHaveURL(`/calendar`)
    await expect(page.getByRole('link', { name: user.name }))
    .toBeVisible()

    // Navigate to event
    // @TODO: select event drop when +3 or more events
    await page.getByRole('row')
    .filter({has: page.getByRole('cell', { name: event.start.getDate().toString()})})
    .getByTitle(event.title)
    .click()
    await expect(page.getByRole('button', { name: 'Register', exact: true}))
    .toBeVisible()

    // Register for event
    // @TODO: select an avaliable role
    await page.getByRole('button', { name: 'Register', exact: true})
    .click()
    await expect(page.getByRole('button', { name: 'Unregister', exact: true}))
    .toBeVisible()

    // intercept mock email
    const email = await readEmail(confirmationEmail.email)
    invariant(email, 'Email not found')
    expect(email.to).toBe(confirmationEmail.email)
    expect(email.from).toBe(siteEmailAddress)
    expect(email.subject).toBe('Event Registration Notification')
    
    const reservationDate = extractDate(email.text)
    invariant(reservationDate, 'Date not found')

    //TODO: check reseveration date against event.Start?

    //Clean up
    await prisma.event.delete({
        where: {
            id: event.id,
        },
    })
})