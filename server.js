const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// 🔗 Render ke liye MONGO_URI priority hai, nahi toh local chalega
const uri = process.env.MONGO_URI || "mongodb+srv://gmpuser:gmp12345@cluster0.k39haau.mongodb.net/gmp_database?retryWrites=true&w=majority";

// 🌐 MongoDB Connection Helper
const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000 
        });
        console.log("✅ MongoDB Connected Successfully!");
    } catch (err) {
        console.log("⚠️ MongoDB Connect Nahi Hua, But Server Is Running!");
        console.error("Database Error Details:", err.message);
    }
};

connectDB();

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number
});
const User = mongoose.model('User', UserSchema);

const CampaignSchema = new mongoose.Schema({
    title: { type: String, required: true },
    brandName: { type: String, required: true },
    budget: { type: Number, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});
const Campaign = mongoose.model('Campaign', CampaignSchema);

// --- ROUTES ---
app.get('/', (req, res) => {
    res.send("🎉 GMP Backend Home Page Is Live!");
});

app.post('/add-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json({ message: "🎉 User data saved successfully!", data: newUser });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/run-campaign', async (req, res) => {
    try {
        const newCampaign = new Campaign(req.body);
        await newCampaign.save();
        res.status(201).json({ message: "🚀 Campaign Live!", campaign: newCampaign });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/get-campaigns', async (req, res) => {
    try {
        const allCampaigns = await Campaign.find().sort({ createdAt: -1 });
        res.status(200).json({ totalCampaigns: allCampaigns.length, campaigns: allCampaigns });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));