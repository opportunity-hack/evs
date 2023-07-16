# Equestrian Volunteer Scheduler 🐎

EVS is a web application intended to help equestrian non-profit organizations to
coordinate volunteers in their day-to-day operations. It is in ongoing
development with the support and supervision of
[Opportunity Hack](https://www.ohack.org/home).

## Development

EVS is built on Kent C. Dodd's [Epic Stack](https://www.epicweb.dev/epic-stack)
starter project. Most of the Epic Stack's
[docs](https://github.com/epicweb-dev/epic-stack/tree/main/docs) are applicable
to this application with a few minor deviations.

To run this application locally:

- Clone the git repo
- In the project root, copy `.env.example` to `.env`
- Run `npm i`, and then `npm run setup` to perform initial setup
- Start a dev server using `npm run dev`

## Admin Setup
To do this, it's easiest to use the Prisma UI to give yourself admin
1. `npx prisma studio`
2. Head over to http://localhost:5555/
3. Select the `User` table
4. Look for the `roles[]` column and the row for your user
5. Click the `[0|Role]` button, then select the admin role checkbox
6. Click the Green save button to save changes
7. Profit