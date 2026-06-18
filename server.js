const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <-- Ye lagana zaroori tha, ab add kar diya hai

const app = express();
const PORT = process.env.PORT || 10000;

// CORS settings: Netlify aur baaki sabhi requests ko allow karne ke liye
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// MongoDB Connection Logic
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schemas & Models
const campaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    budget: { type: Number, required: true },
    pricePerThousand: { type: Number, required: true },
    desc: { type: String, required: true },
    owner: { type: String, default: "System" }
});

const submissionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    creator: { type: String, required: true },
    insta: { type: String, required: true },
    brand: { type: String, required: true },
    link: { type: String, required: true },
    views: { type: Number, default: 0 },
    status: { type: String, default: "Pending" }
});

const Campaign = mongoose.model('Campaign', campaignSchema);
const Submission = mongoose.model('Submission', submissionSchema);

// ---- API ROUTES ----

// 1. Welcome Route
app.get('/', (req, res) => {
    res.send('🚀 GMP Viral Backend API is running perfectly!');
});

// 2. Get All Campaigns
app.get('/get-campaigns', async (req, res) => {
    try {
        const campaigns = await Campaign.find({});
        res.status(200).json(campaigns);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

// 3. Launch New Campaign
app.post('/run-campaign', async (req, res) => {
    try {
        const newCampaign = new Campaign(req.body);
        await newCampaign.save();
        res.status(201).json({ success: true, message: 'Campaign launched successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to launch campaign' });
    }
});

// 4. Get All Submissions
app.get('/get-submissions', async (req, res) => {
    try {
        const submissions = await Submission.find({});
        res.status(200).json(submissions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// 5. Submit Reel Link
app.post('/submit-reel', async (req, res) => {
    try {
        const newSubmission = new Submission(req.body);
        await newSubmission.save();
        res.status(201).json({ success: true, message: 'Reel submitted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit reel' });
    }
});

// Dummy Register route to avoid errors
app.post('/register', (req, res) => {
    res.status(200).json({ success: true, message: 'User registered in session' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});