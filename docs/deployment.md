# Initial setup
[Pre-read](https://github.com/epicweb-dev/epic-stack/blob/main/docs/deployment.md) epic stack deployment

First add secrets (via flyctl or Fly web)
- INTERNAL_COMMAND_TOKEN
- RESEND_API_KEY
- SESSION_SECRET

To create a new app, use the following two commands:
```
fly launch --name evs-production --org opportunity-hack -r sjc
fly consul attach --app evs-production
fly deploy --app evs-production
```

# Deployment

## First time setup

Most of the necessary configuration for this application to be continuously
deployed is already encoded in the `Dockerfile`, the `fly.toml` configuration
file, and `.github/workflows/deploy.yml`. 

This setup should be sufficient for pushing application changes and database
migrations to deployments without much manual intervention; however, for
the application to function properly, the database must be seeded with some role
and permission data that is not defined by the database schema, as well as an
initial admin user.

To do this:

1. Run `fly ssh console -a <YOUR_APP_NAME>` to connect to your deployment

2. After connecting to your server, run the command `sqlite3 /litefs/data/sqlite.db < /evs/prisma/deployment_seed.sql`

This sql script will create instructor, admin, and necessary volunteer user
roles, as well as an initial admin user with the username "admin" and a
hardcoded password `au1pui2OBjJdTzGS5c0F`. It will also create a default signup
secret with the value of "horses are cool" At this point, you should create a
user of your own, use this default admin account to give your new user account
admin rights through the UI, and then delete the default admin account.

If you want to customize the seeding process, see the instructions here: <https://github.com/epicweb-dev/epic-stack/blob/main/docs/deployment.md#seeding-production>

At this point you should be all set!
