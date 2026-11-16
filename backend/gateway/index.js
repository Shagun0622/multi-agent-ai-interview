import express from "express"
import dotenv from "dotenv"
dotenv.config()
import proxy from "express-http-proxy"
import cors from "cors"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import { getCurrentUser } from "./controllers/user.controller.js"
import { isAuth } from "./middleware/isAuth.js"
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js"
const app = express()
app.use(express.json())

app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))

app.use(morgan("dev"))
app.use(cookieParser())

const PORT = process.env.PORT || 6000

app.get("/" , (req,res)=>{
    res.send("Hello from Gateway")
})



app.get("/api/warmup", async (req, res) => {
    const services = [
        ["auth", process.env.AUTH_SERVICE_URL],
        ["resume", process.env.RESUME_SERVICE_URL],
        ["interview", process.env.INTERVIEW_SERVICE_URL],
        ["roadmap", process.env.ROADMAP_SERVICE_URL],
        ["billing", process.env.BILLING_SERVICE_URL]
    ]

    const wait = (ms) =>
        new Promise(resolve => setTimeout(resolve, ms))

    const checkService = async (name, url) => {
        if (!url) {
            return {
                service: name,
                ready: false,
                error: "URL missing"
            }
        }

        let status = null
        let error = null

        for (let attempt = 1; attempt <= 6; attempt++) {
            try {
                const response = await fetch(url, {
                    signal: AbortSignal.timeout(20000)
                })

                status = response.status

                // 404 is acceptable: the service is reachable.
                if (status < 500) {
                    return {
                        service: name,
                        ready: true,
                        status
                    }
                }

                error = `HTTP ${status}`

            } catch (err) {
                error = err.message
            }

            if (attempt < 6) {
                await wait(5000)
            }
        }

        return {
            service: name,
            ready: false,
            status,
            error
        }
    }

    const results = await Promise.all(
        services.map(([name, url]) => checkService(name, url))
    )

    const allReady = results.every(service => service.ready)

    res.status(allReady ? 200 : 503).json({
        ready: allReady,
        services: results
    })
})




app.use("/api/auth" , proxy(process.env.AUTH_SERVICE_URL))
app.use("/api/resume" ,isAuth, proxyWithHeaders(process.env.RESUME_SERVICE_URL))
app.use("/api/interview",isAuth ,proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL))
app.use("/api/roadmap",isAuth ,proxyWithHeaders(process.env.ROADMAP_SERVICE_URL))
app.use("/api/billing",isAuth ,proxyWithHeaders(process.env.BILLING_SERVICE_URL))
app.get("/api/me",isAuth,getCurrentUser)





app.listen(PORT , ()=>{
    console.log(`Gateway Started on ${PORT}`)
})