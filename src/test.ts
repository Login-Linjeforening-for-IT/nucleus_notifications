import nucleusNotifications from "./nucleusNotifications.ts"
import slowMonitored from "./slowMonitored.ts"
import { createPath } from "./utils/file.ts"
import { pathToFileURL } from "node:url"

/**
 * Test function for the repository. Will run for 5 minutes then put the
 * repository into production if no errors are found.
 * 
 * @see nucleusNotifications()    Main entry point of application, running every minute
 * @see slowMonitored()             Entry point for events that does not need to be checked often
 * @see writeFile()                 Writes given content to given file
 */
export default async function test() {
    // Defines test count
    let testCount = 0
    const testRuns = readNumberEnv("NUCLEUS_NOTIFICATIONS_TEST_RUNS", 5)
    const intervalMs = readNumberEnv("NUCLEUS_NOTIFICATIONS_TEST_INTERVAL_MS", 60000)

    // Writes start time to file
    const time = new Date()
    const hoursToUTC = time.getTimezoneOffset() / 60

    time.setHours(hoursToUTC < 0
        ? time.getHours() + Math.abs(hoursToUTC)
        : time.getHours() + hoursToUTC
    )

    // Writes startTime to file
    globalThis.stable = false
    globalThis.startTime = time.toISOString()

    // Runs the two entry points of the application 5 times to ensure stability
    do {
        // Runs main application entry points
        await nucleusNotifications()
        await slowMonitored()

        // Increases count
        testCount++

        // Times out between runs to ensure stability.
        if (testCount < testRuns && intervalMs > 0) {
            await new Promise(resolve => setTimeout(resolve, intervalMs))
        }

        // Runs 5 times before continuing
    } while (testCount < testRuns)

    // Sets stable as true as it has run both functions 5 times without issues.
    globalThis.stable = true

    // Logs success
    createPath({ path: '/tmp/ready.txt' })
    createPath({ path: '/tmp/healthy.txt' })
    console.log("No errors found. Putting repository into production.")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await test()
}

function readNumberEnv(name: string, fallback: number) {
    const value = Number(process.env[name])

    if (!Number.isFinite(value) || value < 0) {
        return fallback
    }

    return value
}
