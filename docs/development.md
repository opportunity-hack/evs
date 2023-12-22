# Development

## Local Development

To run this application locally:

1. Clone the git repo
2. In the project root, copy `.env.example` to `.env`
3. Run `npm i`, and then `npm run setup` to perform initial setup
4. Start a dev server using `npm run dev`

## If there is a database schema update

If you're getting an error that looks like this:

```
Invalid `prisma.user.findFirst()` invocation:


The column `main.User.mailingList` does not exist in the current database.
```

There's a new DB update and you'll need to trigger a Prisma schema update via
`prisma migrate deploy`. This looks at `prisma/migrations` and will update your
local database.

## Add a new admin user

To do this, it's easiest to use Prisma studio, which gives you access to the
sqlite database through a web UI.

1. `npx prisma studio`
2. Head over to http://localhost:5555/
3. Select the `User` table
4. Look for the `roles[]` column and the row for your user
5. Click the `[0|Role]` button, then select the admin role checkbox
6. Click the Green save button to save changes
7. Profit
