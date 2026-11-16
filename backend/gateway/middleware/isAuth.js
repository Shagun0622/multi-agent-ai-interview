import redis from "../../shared/redis/redis.js"



export const isAuth = async (req,res,next) => {
    try {
        const sessionId = req.cookies?.session

        if(!sessionId){
            return res.status(401).json({message:"Unauthorized"})
        }

        const session =await redis.get(`session:${sessionId}`)

        if(!session){
            return res.status(401).json({message:"Session Expired"})
        }

        req.user = JSON.parse(session);
        // Preserve the identity header the Gateway previously injected upstream.
        req.headers["x-user-id"] = String(req.user.userId);

        next();

    } catch (error) {
         return res.status(500).json({message:error.message});
    }
}
