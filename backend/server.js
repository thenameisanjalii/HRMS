const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');
const connectDB = require('./config/db');
const { autoCheckoutUsers } = require('./services/autoCheckoutService');

dotenv.config();

connectDB();

const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/efiling', require('./routes/efiling'));
app.use('/api/peer-rating', require('./routes/peerRating'));
app.use('/api/variable-remuneration', require('./routes/variableRemuneration'));
app.use('/api/remuneration', require('./routes/remuneration'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/levels', require('./routes/levels')); // Level-Based Access Control

app.get('/', (req, res) => {
    res.json({ message: 'HRMS API - NITRRFIE' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Initialize cron job for automatic checkout at 8 PM daily
// Cron expression: '0 20 * * *' means: at minute 0 of hour 20 (8 PM) every day
cron.schedule('0 20 * * *', async () => {
    console.log('Cron job triggered: Running automatic checkout at 8 PM');
    await autoCheckoutUsers();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as per your requirement
});

console.log('Automatic checkout cron job scheduled for 8 PM daily');

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
