const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();

// ==========================================
// --- ULTIMATE CORS BYPASS CONFIGURATION ---
// ==========================================
// Official cors middleware jo har origin aur x-admin-pass header ko automatic pass karega
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-admin-pass'],
    credentials: true
}));

app.use(express.json());

// --- HOME PAGE WELCOME ROUTE ---
app.get('/', (req, res) => {
    res.send("🚀 GMP Viral Backend Engine is Live and Running, Ansh Bhai!");
});

// ==========================================
// --- 1. DATABASE CONNECTION & CONFIG ---
// ==========================================
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gmp_viral";
mongoose.connect(MONGO_URI)
    .then(() => console.log("📡 Connected to MongoDB Vault Securely"))
    .catch(err => console.error("💥 MongoDB Connection Error:", err));


// ==========================================
// --- 2. SCHEMAS & DATABASE MODELS ---
// ==========================================
const userSchema = new mongoose.Schema({
    name: String,
    phone: { type: String, unique: true, required: true },
    role: String, 
    extraDetails: mongoose.Schema.Types.Mixed
});
const User = mongoose.model('User', userSchema);

const campaignSchema = new mongoose.Schema({
    name: String,
    budget: Number,
    pricePerThousand: Number,
    desc: String,
    owner: String, 
    transactionId: String,
    status: { type: String, default: "Pending" } 
});
const Campaign = mongoose.model('Campaign', campaignSchema);

const submissionSchema = new mongoose.Schema({
    id: String,
    creator: String, 
    creatorName: String,
    insta: String,
    brand: String,
    link: String,
    views: { type: Number, default: 0 },
    status: { type: String, default: "Pending" }
});
const Submission = mongoose.model('Submission', submissionSchema);

const tempUsers = {};

// ==========================================
// --- AUTOMATIC REAL VIEWS FETCH FUNCTION ---
// ==========================================
async function getRealViews(reelUrl) {
    try {
        const matches = reelUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
        if (!matches || !matches[1]) return 0;
        
        const shortcode = matches[1];
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        
        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = response.data;
        const videoMatches = html.match(/"video_view_count":\s*([0-9]+)/);
        if (videoMatches && videoMatches[1]) {
            return parseInt(videoMatches[1], 10);
        }
        
        const altMatches = html.match(/([0-9,]+)\s*views/i);
        if (altMatches && altMatches[1]) {
            return parseInt(altMatches[1].replace(/,/g, ''), 10);
        }
        return 0;
    } catch (error) {
        console.error("Error fetching real Instagram views:", error.message);
        return 0;
    }
}

// ==========================================
// --- 3. AUTHENTICATION & LOGIN FLOW ---
// ==========================================
app.post('/send-otp', async (req, res) => {
    const { name, phone, role, extraDetails } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone number required." });

    const generatedOtp = "123456"; 
    tempUsers[phone] = { name, role, extraDetails, otp: generatedOtp };
    console.log(`🔑 OTP for ${phone} is [${generatedOtp}] | Mode: ${role}`);
    return res.status(200).json({ success: true, message: "OTP sent successfully." });
});

app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const tempData = tempUsers[phone];
    if (!tempData) return res.status(400).json({ success: false, message: "OTP expired." });

    if (tempData.otp === otp) {
        try {
            let existingUser = await User.findOne({ phone });
            if (existingUser) {
                if (existingUser.role !== tempData.role) {
                    existingUser.role = tempData.role;
                    if (tempData.extraDetails) existingUser.extraDetails = { ...existingUser.extraDetails, ...tempData.extraDetails };
                    await existingUser.save();
                }
                delete tempUsers[phone];
                return res.status(200).json({ success: true, user: existingUser });
            }
            const newUser = new User({ role: tempData.role, name: tempData.name, phone: phone, extraDetails: tempData.extraDetails });
            await newUser.save();
            delete tempUsers[phone];
            return res.status(201).json({ success: true, user: newUser });
        } catch (err) { 
            return res.status(500).json({ success: false, error: err.message }); 
        }
    } else { 
        return res.status(400).json({ success: false, message: "Invalid code." }); 
    }
});

// ==========================================
// --- 4. BRAND & CAMPAIGN MANAGEMENT ---
// ==========================================
app.post('/run-campaign', async (req, res) => {
    try {
        const { name, budget, pricePerThousand, desc, owner, transactionId } = req.body;
        const newCampaign = new Campaign({ name, budget, pricePerThousand, desc, owner, transactionId, status: "Pending" });
        await newCampaign.save();
        return res.sendStatus(200);
    } catch (err) {
        return res.status(500).send("Failed.");
    }
});

app.get('/get-campaigns', async (req, res) => {
    try {
        const activeCampaigns = await Campaign.find({ status: "Active" });
        return res.status(200).json(activeCampaigns);
    } catch (err) {
        return res.status(500).json([]);
    }
});

app.get('/brand-campaigns/:phone', async (req, res) => {
    try {
        const campaigns = await Campaign.find({ owner: req.params.phone });
        return res.status(200).json(campaigns);
    } catch (err) {
        return res.status(500).json([]);
    }
});

// ==========================================
// --- 5. SECURE ADMIN PANEL CONTROL HOOKS ---
// ==========================================
app.get('/get-all-campaigns-admin', async (req, res) => {
    const adminPass = req.headers['x-admin-pass'];
    if (adminPass !== "roshan99") return res.status(401).send("Unauthorized");

    try {
        const allCampaigns = await Campaign.find({});
        return res.status(200).json(allCampaigns);
    } catch (err) {
        return res.status(500).json([]);
    }
});

app.post('/approve-campaign', async (req, res) => {
    const adminPass = req.headers['x-admin-pass'];
    if (adminPass !== "roshan99") return res.status(401).send("Unauthorized");

    try {
        const { campaignId } = req.body;
        await Campaign.findByIdAndUpdate(campaignId, { status: "Active" });
        return res.sendStatus(200);
    } catch (err) {
        return res.status(500).send("Failed.");
    }
});

app.post('/update-submission-status', async (req, res) => {
    const adminPass = req.headers['x-admin-pass'];
    if (adminPass !== "roshan99") return res.status(401).send("Unauthorized");

    try {
        const { submissionId, status } = req.body;
        
        if (!submissionId || !status) {
            return res.status(400).send("Missing parameters");
        }

        let updatedDoc;
        // Standard MongoDB _id checking
        if (mongoose.Types.ObjectId.isValid(submissionId)) {
            updatedDoc = await Submission.findByIdAndUpdate(submissionId, { status: status }, { new: true });
        }
        
        // Custom string id checking fallback
        if (!updatedDoc) {
            updatedDoc = await Submission.findOneAndUpdate({ id: submissionId }, { status: status }, { new: true });
        }

        if (!updatedDoc) {
            return res.status(404).send("Submission not found in Database.");
        }

        return res.sendStatus(200);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed.");
    }
});

// ==========================================
// --- 6. CREATOR SUBMISSIONS & ANALYTICS ---
// ==========================================
app.post('/submit-reel', async (req, res) => {
    try {
        const { id, creator, creatorName, insta, brand, link } = req.body;
        const realViewsCount = await getRealViews(link);
        const newSubmission = new Submission({ id, creator, creatorName, insta, brand, link, views: realViewsCount });
        await newSubmission.save();
        return res.sendStatus(200);
    } catch (err) {
        return res.status(500).send("Failed.");
    }
});

app.get('/get-submissions', async (req, res) => {
    try {
        const submissions = await Submission.find({});
        const updatedSubmissions = await Promise.all(submissions.map(async (sub) => {
            const freshViews = await getRealViews(sub.link);
            if (freshViews > sub.views) { 
                sub.views = freshViews;
                await sub.save();
            }
            return sub;
        }));
        return res.status(200).json(updatedSubmissions);
    } catch (err) {
        return res.status(500).json([]);
    }
});

app.get('/creator-submissions/:phone', async (req, res) => {
    try {
        const submissions = await Submission.find({ creator: req.params.phone });
        return res.status(200).json(submissions);
    } catch (err) {
        return res.status(500).json([]);
    }
});

// ==========================================
// --- 7. START PORT LISTENER ---
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Node Server running actively on network port: ${PORT}`);
});