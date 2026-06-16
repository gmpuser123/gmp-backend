const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// 🔗 Yeh line zaroori hai! (Render par Cloud uthayega, Laptop par Local)
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gmp_database";

// 🌐 MongoDB Connection Helper
const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000 
        });
        console.log("✅ MongoDB Connected Successfully!");
    } catch (err) {
        console.log("⚠️ MongoDB Connect Nahi Hua, But Server Is Running!");
        console.error("MongoDB Error Details:", err.message);
    }
};

connectDB();

// --- Iske NEECHE aapka purana UserSchema, CampaignSchema aur saare ROUTES waise hi rahenge ---