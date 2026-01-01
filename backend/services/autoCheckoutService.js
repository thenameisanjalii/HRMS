const Attendance = require('../models/Attendance');
const User = require('../models/User');

/**
 * Automatically check out users who have checked in but haven't checked out
 * This function runs daily at 8 PM
 */
const autoCheckoutUsers = async () => {
    try {
        console.log('Running automatic checkout at 8 PM...');

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // Find all attendance records for today where:
        // 1. User has checked in (checkIn.time exists)
        // 2. User hasn't checked out yet (checkOut.time is null/undefined)
        const attendanceRecords = await Attendance.find({
            date: today,
            'checkIn.time': { $exists: true, $ne: null },
            $or: [
                { 'checkOut.time': { $exists: false } },
                { 'checkOut.time': null }
            ]
        });

        if (attendanceRecords.length === 0) {
            console.log('No users need automatic checkout');
            return { success: true, message: 'No users need automatic checkout', count: 0 };
        }

        const checkoutTime = new Date();
        checkoutTime.setHours(20, 0, 0, 0); // Set to 8 PM

        let updatedCount = 0;

        // Process each attendance record
        for (const attendance of attendanceRecords) {
            try {
                // Set checkout time to 8 PM
                attendance.checkOut = {
                    time: checkoutTime,
                    ip: 'auto-system'
                };

                // Calculate working hours
                const diffMs = checkoutTime - attendance.checkIn.time;
                attendance.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

                // Update status based on working hours
                if (attendance.workingHours < 4) {
                    attendance.status = 'half-day';
                } else if (attendance.status === 'late') {
                    // Keep the late status if already marked as late
                    attendance.status = 'late';
                } else {
                    attendance.status = 'present';
                }

                // Add remark about automatic checkout
                attendance.remarks = attendance.remarks 
                    ? `${attendance.remarks} | Auto checkout at 8 PM` 
                    : 'Auto checkout at 8 PM';

                await attendance.save();
                updatedCount++;

                console.log(`Auto checkout completed for user: ${attendance.userName || attendance.user}`);
            } catch (error) {
                console.error(`Error processing attendance for user ${attendance.user}:`, error.message);
            }
        }

        console.log(`Automatic checkout completed. ${updatedCount} users checked out.`);
        return { 
            success: true, 
            message: `Automatic checkout completed for ${updatedCount} users`, 
            count: updatedCount 
        };

    } catch (error) {
        console.error('Error in automatic checkout service:', error);
        return { success: false, message: error.message, count: 0 };
    }
};

module.exports = { autoCheckoutUsers };
