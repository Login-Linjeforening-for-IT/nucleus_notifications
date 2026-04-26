import handleError, { fixJSONContent } from "./error.ts"
import fs, { promises } from 'fs'
import path from "node:path"

type writeFileProps = {
    fileName: string
    content: any
    removeBrackets?: boolean
}

type createPath = {
    path: string
}

type createFileOrFolderProps = {
    entry: string
}

type createPathProps = {
    path: string
}

/**
 * Function for returning path to specified. Error if unknown argument.
 * 
 * @param {filename} file   File argument to find full path for
 * 
 * @see handleError(...)    Notifies the maintenance team of any error
 * 
 * @returns {string} Full file path
 */
export default function file(file: string): string {
    const dataRoot = process.env.NUCLEUS_NOTIFICATIONS_DATA_DIR
    const resolveDataFile = (relativePath: string) => dataRoot
        ? path.join(dataRoot, relativePath.replace(/^data\//, ""))
        : relativePath

    switch (file) {
        case "10m":         return resolveDataFile('data/intervals/events/10m.json')
        case "30m":         return resolveDataFile('data/intervals/events/30m.json')
        case "1h":          return resolveDataFile('data/intervals/events/1h.json')
        case "2h":          return resolveDataFile('data/intervals/events/2h.json')
        case "3h":          return resolveDataFile('data/intervals/events/3h.json')
        case "6h":          return resolveDataFile('data/intervals/events/6h.json')
        case "1d":          return resolveDataFile('data/intervals/events/1d.json')
        case "2d":          return resolveDataFile('data/intervals/events/2d.json')
        case "1w":          return resolveDataFile('data/intervals/events/1w.json')
        case "a2h":         return resolveDataFile('data/intervals/ads/2h.json')
        case "a6h":         return resolveDataFile('data/intervals/ads/6h.json')
        case "a24h":        return resolveDataFile('data/intervals/ads/24h.json')
        case "notified":    return resolveDataFile('data/notifiedEvents.json')
        case "slow":        return resolveDataFile('data/slowMonitored.json')

        default: {
            handleError({file: "file", error: `Invalid file argument in file.ts: ${file}`})
            return ""
        }
    }
}

/**
 * Writes content to file
 * 
 * @param fileName       Filename to write to
 * @param content        Content to write to file
 * 
 * @see handleError(...) Notifies the maintenance team of any error
 * @see file(...)        Returns full file path of given argument
 */
export function writeFile({fileName, content, removeBrackets}: writeFileProps) {
    // Fetches full file path for the array to write to file
    const File = file(fileName)

    // Stringifies content to write to file
    let stringifiedContent = content ? JSON.stringify(content) : "[]"
    
    if (removeBrackets) {
        stringifiedContent = content
    }

    // Writes content or empty brackets to file 
    fs.writeFile(File, stringifiedContent, (error) => {
        // Returns and handles any errors while writing
        if (error) {
            return handleError({file: "writeFile", error: JSON.stringify(error)})
        }

        // Logs success
        console.log(`Overwrote ${fileName}. Content: ${content ? true : false}.`)
    })
}

/**
 * Fetches interval files 
 *
 * @param {string} arg      Time interval for the specified file
 * 
 * @see handleError(...)    Notifies the maintenance team of any error
 * @see fixJSONContent(...) Tries to fix malformed json content in input file
 * 
 * @returns                 Contents of given file
 */
export async function readFile(arg: string, stop?: boolean): Promise<unknown> {
    // Defines file to read from
    const File = file(arg)

    await createPath({path: `/${File}`})

    // Returns a promise
    return new Promise((res) => {
        // Reads file
        fs.readFile(File, async (error, data) => {
            
            // Handles potential error
            if (error) {
                if (error?.errno === -2) {
                    createPath({path: File})
                    
                    const content = JSON.parse(data.toString())
                    if (content) res(content)
                }

                res(handleError({file: "readFile", error: JSON.stringify(error)}))
            }

            try {
                // Tries to parse the json to string
                const content = JSON.parse(data.toString())

                // If the content is defined resolves successfully
                if (content) res(content)

                // Otherwise resolves with error, and handles the error
                else res(handleError({file: File, error: JSON.stringify(error)}))
            
            // Handles case where the json cannot be parsed
            } catch (error) {
                // Stopping the process if the file has already been fixed unsuccessfully
                if (stop) return handleError({file: "readFile", error: JSON.stringify(error)})

                // Most likely there is an error with the json. Trying to fix malformed json content
                await fixJSONContent(arg, error)
                await readFile(arg, true)
            }
        })
    })
}

export async function createPath({ path: requestedPath }: createPathProps) {
    const cwd = process.cwd()
    const normalizedPath = requestedPath.startsWith("/")
        ? requestedPath.slice(1)
        : requestedPath
    const fullPath = path.join(cwd, normalizedPath)
    const entries = fullPath.split('/')
    let currentPath = ''

    for (let i = 1; i < entries.length; i++) {
        currentPath += `/${entries[i]}`
        try {
            await createFileOrFolder({ entry: currentPath })
        } catch (error) {
            console.error(`Failed to create entry ${currentPath}:`, error)
            return
        }
    }
}

async function createFileOrFolder({ entry }: createFileOrFolderProps) {
    try {
        if (entry.includes('.')) {
            try {
                await promises.access(entry)
            } catch (error) {
                await promises.writeFile(entry, '[]')
                console.log(`File created: ${entry}`)
            }
        } else {
            try {
                await promises.access(entry)
            } catch (error) {
                await promises.mkdir(entry, { recursive: true })
                console.log(`Folder created: ${entry}`)
            }
        }
    } catch (error) {
        throw new Error(`Failed to create ${entry}: ${error}`)
    }
}

export function removeHealthyFile() {
    const healthyFilePath = './tmp/healthy.txt'
    
    fs.unlink(healthyFilePath, (err) => {
        if (err) {
            throw err
        }

        console.log('Healthy file removed successfully.')
    })
}
