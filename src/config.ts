import dotenv from 'dotenv'

dotenv.config()

const config = {
    api: "https://workerbee.login.no/api/v2",
    test_api: "https://dev.workerbee.login.no/api/v2",
    app_api: process.env.APP_API_URL || "https://app.login.no/api",
    admin_token: process.env.APP_API_ADMIN_TOKEN || "",
    dry_run: process.env.NUCLEUS_NOTIFICATIONS_DRY_RUN === "1",
}

export default config
