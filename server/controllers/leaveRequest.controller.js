import asyncHandler from 'express-async-handler';
import { LeaveRequest } from '../models/leaveRequest.model.js';
import { Employee } from '../models/employee.model.js';
/**
 * @desc Get all leave requests
 * @route GET /api/leaves/all
 */
export const getAllLeaveRequests = asyncHandler(async (req, res) => {
    const requests = await LeaveRequest.find().populate('employeeId', 'firstName lastName');

    const formattedRequests = requests.map(req => ({
        ...req._doc,
        employeeName: req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : 'Unknown'
    }));

    res.status(200).json(formattedRequests);
});

/**
 * @desc Get leave requests by employee ID
 * @route GET /api/leaves/employee/:id
 */
export const getLeaveRequestsByEmployee = asyncHandler(async (req, res) => {
    const requests = await LeaveRequest.find({ employeeId: req.params.id })
        .populate('employeeId', 'firstName lastName');

    // Ensure employeeName is set properly
    const formattedRequests = requests.map(req => ({
        ...req._doc,
        employeeName: req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : 'Unknown'
    }));

    res.status(200).json(formattedRequests);
});

/**
 * @desc Create a new leave request
 * @route POST /api/leaves/
 */
export const createLeaveRequest = asyncHandler(async (req, res) => {
    const { employeeId, startDate, endDate, reason } = req.body;

    // Fetch employee name from Employee model
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
    }

    const leaveRequest = new LeaveRequest({
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        startDate,
        endDate,
        reason,
        status: 'Pending'
    });

    await leaveRequest.save();
    res.status(201).json(leaveRequest);
});

/**
 * @desc Approve a leave request
 * @route PUT /api/leaves/:id/approve
 */
export const approveLeaveRequest = asyncHandler(async (req, res) => {
    const request = await LeaveRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'Approved' },
        { new: true }
    );
    if (!request) {
        return res.status(404).json({ message: 'Leave request not found' });
    }
    res.status(200).json({ success: true, updatedRequest: request });
});

/**
 * @desc Disapprove a leave request
 * @route PUT /api/leaves/:id/disapprove
 */
export const disapproveLeaveRequest = asyncHandler(async (req, res) => {
    const request = await LeaveRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'Disapproved' },
        { new: true }
    );
    if (!request) {
        return res.status(404).json({ message: 'Leave request not found' });
    }
    res.status(200).json({ success: true, updatedRequest: request });
});

/**
 * @desc Delete a leave request
 * @route DELETE /api/leaves/:id
 */
export const deleteLeaveRequest = asyncHandler(async (req, res) => {
    const result = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!result) {
        return res.status(404).json({ message: 'Leave request not found' });
    }
    res.status(204).send();
});