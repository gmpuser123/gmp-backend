const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); // Fast2SMS ko request bhejne ke liye

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

// Fast2SMS Configuration (Aapki API Key)
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "ETW0QN9HOpsKAVbPdgDtIBRqMC5XhaSclZz1Gn8wJv72ouF3jytYpofzVTsldAWwrb2HuZ0Ok47hQBIj";

// Temporary memory to store OTPs before saving user to MongoDB
let tempUsers = {};

// MongoDB Schema for Verified Creators/Brands
const userSchema = new mongoose.Schema({
    role: { type: String, required: true }, // 'creator' or 'brand'
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    extraDetails: { type: Object, default: {} } // Insta link, Budget, etc.
});
const User = mongoose.model('User', userSchema);

// ---- OTP ROUTES ----

// 1. Send OTP Route
app.post('/send-otp', async (req, res) => {
    const { phone, name, role, extraDetails } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // 6-digit random OTP generate karo
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Temp memory me save karo data
    tempUsers[phone] = { name, role, extraDetails, otp, createdAt: Date.now() };

    try {
        // Fast2SMS API Call (Quick SMS Method)
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
            res.status(500).json({ success: false, message: "Fast2SMS failed to send SMS" });
        }
    } catch (error) {
        console.error("SMS Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Server error while sending OTP" });
    }
});

// 2. Verify OTP Route
app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;

    const tempData = tempUsers[phone];

    if (!tempData) {
        return res.status(400).json({ success: false, message: "OTP expired or not requested. Try again." });
    }

    if (tempData.otp === otp) {
        try {
            // Check karo agar user pehle se register to nahi hai
            let existingUser = await User.findOne({ phone });
            if (existingUser) {
                delete tempUsers[phone]; // memory clear karo
                return res.status(200).json({ success: true, message: "Welcome back! Logged in successfully.", user: existingUser });
            }

            // Naya user MongoDB me save karo
            const newUser = new User({
                role: tempData.role,
                name: tempData.name,
                phone: phone,
                extraDetails: tempData.extraDetails
            });

            await newUser.save();
            delete tempUsers[phone]; // Verify hone ke baad temp data delete karo

            res.status(201).json({ success: true, message: "Registration successful!", user: newUser });
        } catch (err) {
            res.status(500).json({ success: false, message: "Database saving failed" });
        }
    } else {
        res.status(400).json({ success: false, message: "Invalid OTP! Please try again." });
    }
});

// Baaki aapki purani Campaign routes (Yahin par retain rahengi)
// [Baki ka aapka get-campaigns, submit-reel routes intact rahega...]

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});