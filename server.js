// MongoDB Connection Helper
const connectDB = async () => {
    try {
        // Humne timeout 5 second kar diya taaki aapka page 10 second tak na ghoome
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