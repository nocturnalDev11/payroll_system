import asyncHandler from 'express-async-handler';
import { Attendance } from '../models/attendance.model.js';
import { Employee } from '../models/employee.model.js';

/**
 * @desc Create a new attendance record
 * @route POST /api/attendance/time-in
 */
export const timeIn = async (req, res) => {
    try {
        const { employeeId } = req.body;
        const currentDate = new Date();
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

        const lateTime = "08:15:00";
        let status = currentTime > lateTime ? "Late" : "Present";

        let attendance = await Attendance.findOne({ 
            employeeId, 
            date: { $gte: new Date(currentDate.setHours(0, 0, 0, 0)), $lte: new Date(currentDate.setHours(23, 59, 59, 999)) }
        });

        if (attendance) {
            return res.status(400).json({ message: 'Already Timed In Today' });
        }

        attendance = new Attendance({
            employeeId,
            date: currentDate,
            timeIn: currentTime,
            status
        });

        await attendance.save();
        res.status(200).json(attendance);
    } catch (error) {
        console.error('Error in timeIn:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

/**
 * @desc Update attendance record with time out
 * @route POST /api/attendance/time-out
 */
export const timeOut = async (req, res) => {
    try {
        const { employeeId } = req.body;
        const currentDate = new Date();
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

        // Find existing attendance record for today
        let attendance = await Attendance.findOne({ 
            employeeId, 
            date: { $gte: new Date(currentDate.setHours(0, 0, 0, 0)), $lte: new Date(currentDate.setHours(23, 59, 59, 999)) }
        });

        if (!attendance) {
            return res.status(400).json({ message: 'Time In Required Before Time Out' });
        }

        if (attendance.timeOut) {
            return res.status(400).json({ message: 'Already Timed Out Today' });
        }

        // Update time out
        attendance.timeOut = currentTime;
        await attendance.save();

        res.status(200).json(attendance);
    } catch (error) {
        console.error('Error in timeOut:', error);
        res.status(500).json({ message: error.message });
    }
};

export const createAttendance = async (req, res) => {
    try {
        const { employeeId, date, status } = req.body;

        // Check if the employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Create a new attendance record
        const newAttendance = new Attendance({
            employeeId,
            date,
            status
        });

        await newAttendance.save();

        // Populate the employee details
        const populatedAttendance = await Attendance.findById(newAttendance._id)
            .populate('employeeId', 'name position employeeIdNumber');

        res.status(201).json(populatedAttendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/**
 * @desc Get all attendance records
 * @route GET /api/attendance
 */
export const getAllAttendance = async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find().populate('employeeId', 'firstName lastName position employeeIdNumber');
        res.status(200).json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/**
 * @desc Get attendance by employee ID
 * @route GET /api/attendance/:employeeId
//  */
// export const getAttendanceByEmployee = async (req, res) => {
//     try {
//         const { employeeId } = req.params;

//         // Validate employeeId
//         if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
//             return res.status(400).json({ message: 'Invalid or missing employee ID' });
//         }

//         const attendanceRecords = await Attendance.find({ employeeId })
//             .populate('employeeId', 'name position employeeIdNumber');

//         if (!attendanceRecords.length) {
//             return res.status(404).json({ message: 'No attendance records found for this employee' });
//         }

//         res.status(200).json(attendanceRecords);
//     } catch (error) {
//         console.error('Error in getAttendanceByEmployee:', error);
//         res.status(500).json({ message: 'Internal Server Error', error: error.message });
//     }
// };

export const getAttendanceByEmployeeId = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    try {
        const attendanceRecords = await Attendance.find({ employeeId });
        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.status(404).json({ message: 'No attendance records found' });
        }
        res.status(200).json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @desc Delete an attendance record
 * @route DELETE /api/attendance/:id
 */
export const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.findByIdAndDelete(id);

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        res.status(200).json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
