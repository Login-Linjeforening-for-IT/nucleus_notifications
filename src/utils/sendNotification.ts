import handleNestedObjects from "./stringifyNestedObjects.ts"
import config from '#config'

type sendNotificationProps = {
    title: string
    body: string
    screen?: GetEventProps | DetailedAd
    topic?: string
}

/**
 * Posts notification to FCM.
 * @param title    Notification title
 * @param body     Notification body
 * @param screen   Event to navigate to in the app, give the full object.
 * @param topic    Notification topic
 */
export default async function sendNotification({ title, body, screen, topic }: sendNotificationProps): Promise<void> {
    try {
        if (!topic || !stable) {
            topic = "maintenance"
        }

        const data = handleNestedObjects(screen) || {}

        if (config.dry_run) {
            console.log(`Dry run: skipped notification "${title}" with body "${body}" to topic "${topic}" at ${new Date().toISOString()}.`)
            return
        }

        const response = await fetch(`${config.app_api}/notifications`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(config.admin_token ? { Authorization: `Bearer ${config.admin_token}` } : {})
            },
            body: JSON.stringify({
                title,
                body,
                topic,
                data,
            })
        })

        if (!response.ok) {
            throw new Error(await response.text())
        }

        console.log(`Sent notification "${title}" with body "${body}" to topic "${topic}" at ${new Date().toISOString()}.`)
    } catch (error) {
        console.error(`Error sending notification "${title}" with body "${body}"${screen ? ` to screen "${screen}"` : ''} to topic "${topic}". The following error occured: `, error)
    }
}

// Examples of direct notifications that can be sent by node sendNotifications.ts
// Topics: nTOPIC, eTOPIC, ...

// sendNotification({title: "Tittel", body: "Beskrivelse", topic: "maintenance"})
// sendNotification("Title", "English description", "", "maintenace")
// sendNotification("Test", "Kontakt tekkom om du mottok denne.")
