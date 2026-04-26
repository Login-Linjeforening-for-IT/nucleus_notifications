# Nucleus Notifications
Nucleus notifications is a collection of functions to automate management of
notifications for the Login app.

## How it works
The repository fetches the API every minute, or 30 minutes depending on how
important the change is. Specifically, the link has high priority. Events coming
soon without a link posted yet has a high priority, and will be fetched every
minute, to make sure the user does not miss the link being posted. Otherwise,
the event will be fetched every 30 minutes, as we are not expecting any changes,
except possibly a location or time change. These are usually changed far in
advance, therefore this half hour wait time has no negative impact.

Startup first runs the internal stability check. Cron jobs are only registered
after that check has completed, so notification sends do not race ahead while
the service is still marked as unstable.

Local tests run that stability path once in dry-run mode. Set
`NUCLEUS_NOTIFICATIONS_DRY_RUN=1` manually when validating behavior without
posting to App API. Set `NUCLEUS_NOTIFICATIONS_DATA_DIR` to redirect the JSON
state files into a disposable directory during tests.

## How to set in production
1. Verify that the service runs correctly locally using `npm run test`
2. Verify that the service runs correctly in docker using `docker compose up`
3. Send the service to production using the `/deploy` command followed by the `/release` command of the TekKom Bot.
