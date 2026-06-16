const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// 🔗 Aapka naya aur bilkul sahi Atlas link (gmp_database naam ke sath)
const uri = "mongodb+srv://gmpuser:gmp12345@cluster0.k39haau.mongodb.net/gmp_database?retryWrites=true&w=majority";

// 🌐 MongoDB Connection Helper (Mongoose ke zariya)
const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000 
        });
        console.log("✅ JAI HO! CLOUD MONGODB CONNECTED SUCCESSFULLY!");
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
}
run().catch(console.dir);


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