/**
 * Main entry point of the application. Each file and feature is defined where
 * its used and at the start of the file. The project has been updated to be 
 * easy to onboard, as it is one of the simpler to understand, but more complex 
 * to use and maintain.
 */

import nucleusNotifications from "./nucleusNotifications.ts"
import slowMonitored from "./slowMonitored.ts"
import { schedule } from "node-cron"
import test from "./test.ts"

await bootstrap()

async function bootstrap() {
    // Internal test of the application before allowing it to send notifications to end users.
    await test()

    // Schedules nucleusNotifications to run every minute.
    schedule("* * * * *", nucleusNotifications)

    // Schedules slowMonitored to run every 30 minutes.
    schedule("*/30 * * * *", slowMonitored)
}
