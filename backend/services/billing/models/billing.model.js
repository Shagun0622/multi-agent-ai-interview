import mongoose from "../../../shared/mongoose.js";
import { databaseConnections } from "../../../shared/databaseConnections.js";

const billingSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },

    interviewCoins: {
      type: Number,
      required: true,
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
},{timestamps:true})


const Billing = databaseConnections.billing.model("Billing",billingSchema)


export default Billing
