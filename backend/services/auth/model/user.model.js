import mongoose from "../../../shared/mongoose.js";
import { databaseConnections } from "../../../shared/databaseConnections.js";

const userSchema =
new mongoose.Schema({

   firebaseUid:{
      type:String,
      required:true,
      unique:true
   },

   name:String,

   email:{
      type:String,
      required:true,
      unique:true
   },


   interviewCoin:{
      type:Number,
      default:150
   }

},{
   timestamps:true
});

 const User =
databaseConnections.auth.model(
   "User",
   userSchema
);

export default User;
