const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Local Connection (No Internet Needed, No Network Error!)
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gmp_database";
mongoose.connect(uri)
  .then(() => console.log("✅ JAI HO! LOCAL MONGODB CONNECTED SUCCESSFULLY!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Creator Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number
});
const User = mongoose.model('User', UserSchema);

// Campaign Schema
const CampaignSchema = new mongoose.Schema({
    title: { type: String, required: true },
    brandName: { type: String, required: true },
    budget: { type: Number, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});
const Campaign = mongoose.model('Campaign', CampaignSchema);

// --- ROUTES ---
app.post('/add-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json({ message: "🎉 User data saved successfully on Local!", data: newUser });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/run-campaign', async (req, res) => {
    try {
        const newCampaign = new Campaign(req.body);
        await newCampaign.save();
        res.status(201).json({ message: "🚀 Campaign Live on Local!", campaign: newCampaign });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/get-campaigns', async (req, res) => {
    try {
        const allCampaigns = await Campaign.find().sort({ createdAt: -1 });
        res.status(200).json({ totalCampaigns: allCampaigns.length, campaigns: allCampaigns });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));