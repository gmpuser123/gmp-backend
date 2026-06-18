const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS configuration
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Fast2SMS API Key (Render environment variable se uthayega, backup me aapki key hai)
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "ETW0QN9HOpsKAVbPdgDtIBRqMC5XhaSclZz1Gn8wJv72ouF3jytYpofzVTsldAWwrb2HuZ0Ok47hQBIj";

// Temporary object to hold user details before OTP confirmation
let tempUsers = {};

// MongoDB Schema for Users (Creators & Brands)
const userSchema = new mongoose.Schema({
    role: { type: String, required: true }, // 'creator' or 'brand'
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    extraDetails: { type: Object, default: {} }
});
const User = mongoose.model('User', userSchema);

// MongoDB Schema for Campaigns
const campaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    budget: { type: Number, required: true },
    pricePerThousand: { type: Number, required: true },
    desc: { type: String, required: true },
    owner: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Campaign = mongoose.model('Campaign', campaignSchema);

// MongoDB Schema for Submissions
const submissionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    creator: { type: String, required: true },
    insta: { type: String, default: "N/A" },
    brand: { type: String, required: true },
    link: { type: String, required: true },
    views: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});
const Submission = mongoose.model('Submission', submissionSchema);

// ==================== API ROUTES ====================

// 1. Route: Send Live OTP via Fast2SMS
app.post('/send-otp', async (req, res) => {
    const { phone, name, role, extraDetails } = req.body;

    if (!phone || phone.length !== 10) {
        return res.status(400).json({ success: false, message: "Valid 10-digit phone number is required" });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store temporarily in memory
    tempUsers[phone] = { name, role, extraDetails, otp, createdAt: Date.now() };

    try {
        // Fast2SMS Quick SMS API Call
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            route: 'q',
            message: `GMP VIRAL: Your verification OTP is ${otp}. Valid for 5 minutes.`,
            language: 'english',
            numbers: phone
        }, {
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.return) {
            res.status(200).json({ success: true, message: "OTP sent successfully!" });
        } else {
            res.status(500).json({ success: false, message: "Fast2SMS rejected the dispatch." });
        }
    } catch (error) {
        console.error("SMS Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Internal server error while sending SMS." });
    }
});

// 2. Route: Verify OTP and Save User to MongoDB
app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const tempData = tempUsers[phone];

    if (!tempData) {
        return res.status(400).json({ success: false, message: "OTP expired or invalid session. Please try again." });
    }

    if (tempData.otp === otp) {
        try {
            // Check if user already exists
            let existingUser = await User.findOne({ phone });
            if (existingUser) {
                delete tempUsers[phone];
                return res.status(200).json({ success: true, message: "Logged in successfully!", user: existingUser });
            }

            // Create new verified user
            const newUser = new User({
                role: tempData.role,
                name: tempData.name,
                phone: phone,
                extraDetails: tempData.extraDetails
            });

            await newUser.save();
            delete tempUsers[phone]; // Clear temp memory

            res.status(201).json({ success: true, message: "Registration verified and saved!", user: newUser });
        } catch (err) {
            res.status(500).json({ success: false, message: "Failed to save user in MongoDB." });
        }
    } else {
        res.status(400).json({ success: false, message: "Wrong OTP entered. Please check and try again." });
    }
});

// 3. Campaign Routes
app.post('/run-campaign', async (req, res) => {
    try {
        const newCampaign = new Campaign(req.body);
        await newCampaign.save();
        res.status(201).send(newCampaign);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/get-campaigns', async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ createdAt: -1 });
        res.status(200).send(campaigns);
    } catch (err) {
        res.status(500).send(err);
    }
});

// 4. Reel Submission Routes
app.post('/submit-reel', async (req, res) => {
    try {
        const newSubmission = new Submission(req.body);
        await newSubmission.save();
        res.status(201).send(newSubmission);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/get-submissions', async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ createdAt: -1 });
        res.status(200).send(submissions);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running perfectly on port ${PORT}`);
});