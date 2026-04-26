import { fetchAdDetails, fetchAds } from "./fetch.ts"
import { readFile, writeFile } from "./file.ts"
import sendNotification from "./sendNotification.ts"
import { pathToFileURL } from "node:url"

type hasAdProps = {
    ads: DetailedAd[]
    ad: DetailedAd
}

export default async function handleAds() {
    const APIundetailedAds = await fetchAds()
    const APIads = [] as DetailedAd[]
    const a2h = await readFile("a2h") as DetailedAd[]
    const a6h = await readFile("a6h") as DetailedAd[]
    const a24h = await readFile("a24h") as DetailedAd[]

    const newA2H = [] as DetailedAd[]
    const newA6H = [] as DetailedAd[]
    const newA24H = [] as DetailedAd[]

    for (const ad of APIundetailedAds) {
        const response = await fetchAdDetails(ad)
        if (response) {
            APIads.push(response)
        }
    }

    for (const APIad of APIads) {
        const deadline = new Date(APIad.application_deadline).getTime() - new Date().getTime()

        if (deadline < 0) {
            console.log(`Ad ${APIad.id} has already passed. Ignoring.`)
            continue
        }

        if (deadline < 7200000 && !hasAd({ ads: a2h, ad: APIad })) {
            console.log(`Ad ${APIad.id} is less than 2 hours away. Scheduling notification.`)
            sendNotification({ title: APIad.title_no, body: "Søknadsfrist om 2 timer!", topic: `a${APIad.id}`, screen: APIad })
            sendNotification({ title: APIad.title_en, body: "Application deadline in 2 hours!", topic: `a${APIad.id}`, screen: APIad })
            newA2H.push(APIad)
            continue
        }

        if (deadline < 21600000 && !hasAd({ ads: a6h, ad: APIad })) {
            console.log(`Ad ${APIad.id} is less than 6 hours away. Scheduling notification.`)
            sendNotification({ title: APIad.title_no, body: "Søknadsfrist om 6 timer!", topic: `a${APIad.id}`, screen: APIad })
            sendNotification({ title: APIad.title_en, body: "Application deadline in 6 hours!", topic: `a${APIad.id}`, screen: APIad })
            newA6H.push(APIad)
            continue
        }

        if (deadline < 86400000 && !hasAd({ ads: a24h, ad: APIad })) {
            console.log(`Ad ${APIad.id} is less than 24 hours away. Scheduling notification.`)
            const deadline = new Date()
            const localTime = deadline.toLocaleString('en-US', { timeZone: 'Europe/Oslo' })
            const localDeadline = new Date(localTime)
            const ampmDeadline = localDeadline.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })

            sendNotification({ title: APIad.title_no, body: `Søknadsfrist i morgen kl ${localDeadline.getHours()}:${localDeadline.getMinutes()}!`, topic: `a${APIad.id}`, screen: APIad })
            sendNotification({ title: APIad.title_no, body: `Application deadline tomorrow at ${ampmDeadline}!`, topic: `a${APIad.id}`, screen: APIad })
            newA24H.push(APIad)
        }

        if (deadline >= 86400000) {
            console.log(`Ad ${APIad.id} is ${deadline - 86400000} seconds away from being notified (24h left).`)
        }
    }

    writeFile({ fileName: "a2h", content: newA2H })
    writeFile({ fileName: "a6h", content: newA6H })
    writeFile({ fileName: "a24h", content: newA24H })
    console.log(`Wrote ${newA24H.length + newA2H.length + newA6H.length} ads to files.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await handleAds()
}

function hasAd({ ads, ad }: hasAdProps) {
    const ids: number[] = []

    for (let i = 0; i < ads.length; i++) {
        ids.push(ads[i].id)
    }

    if (ids.includes(ad.id)) {
        return true
    }

    return false
}
