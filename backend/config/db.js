import mongoose from "mongoose";

export const connectDB = async () => {
    //await mongoose.connect("mongodb+srv://rachitsrivastava0406_db_user:YftseUzxHxFI5b0n@cluster0.2kdxl3r.mongodb.net/Chat")
    await mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("DB CONNECTED")
    })
}