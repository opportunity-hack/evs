# Development

## Local Development

To run this application locally:

1. Clone the git repo
2. In the project root, copy `.env.example` to `.env`
3. Run `npm i`, and then `npm run setup` to perform initial setup
4. Start a dev server using `npm run dev`

## Add a new admin user

To do this, it's easiest to use Prisma studio, which gives you access to the sqlite database through a web UI.

1. `npx prisma studio`
2. Head over to http://localhost:5555/
3. Select the `User` table
4. Look for the `roles[]` column and the row for your user
5. Click the `[0|Role]` button, then select the admin role checkbox
6. Click the Green save button to save changes
7. Profit
