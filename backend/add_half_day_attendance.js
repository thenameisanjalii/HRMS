const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Attendance = require("./models/Attendance");
const connectDB = require("./config/db");

dotenv.config();

const addHalfDayAttendance = async () => {
    try {
        await connectDB();

        const sunil = await User.findOne({
            $or: [
                { username: "sunil" },
                { "profile.firstName": "Sunil" }
            ]
        });

        if (!sunil) {
            console.log("User 'sunil' or with profile.firstName 'Sunil' not found. Listing all users:");
            const allUsers = await User.find({}, "username profile.firstName profile.lastName");
            console.log(allUsers);
            process.exit(1);
        }

        // Set a past date (e.g., Dec 20, 2025)
        const targetDate = new Date("2025-12-20");
        targetDate.setUTCHours(0, 0, 0, 0);

        // Create half-day attendance
        const attendance = await Attendance.findOneAndUpdate(
            { user: sunil._id, date: targetDate },
            {
                user: sunil._id,
                date: targetDate,
                status: "half-day",
                checkIn: {
                    time: new Date("2025-12-20T10:00:00"),
                    ip: "127.0.0.1"
                },
                checkOut: {
                    time: new Date("2025-12-20T14:00:00"),
                    ip: "127.0.0.1"
                },
                workingHours: 4,
                isLate: false
            },
            { upsert: true, new: true }
        );

        // Update leave balance manually to reflect the half day if needed
        // Assuming backend logic usually handles this, but since we are seeding directly:
        // We update CL balance -0.5 and availed +0.5
        await User.findByIdAndUpdate(sunil._id, {
            $inc: {
                'leaveBalance.casualLeave': -0.5,
                'leaveBalance.casualLeaveAvailed': 0.5
            }
        });

        console.log("Added half-day attendance for Sunil on 2025-12-20");
        console.log(attendance);

        process.exit(0);
    } catch (error) {
        console.error("Error adding attendance:", error);
        process.exit(1);
    }
};

addHalfDayAttendance();
