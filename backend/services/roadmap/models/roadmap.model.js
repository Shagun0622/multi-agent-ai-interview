import mongoose from "../../../shared/mongoose.js";
import { databaseConnections } from "../../../shared/databaseConnections.js";

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    duration: {
        type: String,
        required: true,
    },

    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    youtube: {
        type: String,
        default: "",
    },

    article: {
        type: String,
        default: "",
    },
},
    {
        _id: false,
    })

const roadmapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    title: {
        type: String,
        required: true,
    },

    targetPackage: {
        type: String,
        required: true,
    },

    duration: {
        type: String,
        required: true,
    },

    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        required: true,
    },

    modules: {
        type: [moduleSchema],
        default: [],
    },

}, { timestamps: true })


const Roadmap = databaseConnections.roadmap.model("Roadmap",roadmapSchema)

export default Roadmap
