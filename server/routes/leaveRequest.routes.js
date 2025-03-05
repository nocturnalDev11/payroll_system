import express from 'express';
import {
    getAllLeaveRequests,
    getLeaveRequestsByEmployee,
    createLeaveRequest,
    approveLeaveRequest,
    disapproveLeaveRequest,
    deleteLeaveRequest
} from '../controllers/employees/leaveRequest.controller.js';

const router = express.Router();

// Routes
router.get('/all', getAllLeaveRequests);
router.get('/employee/:id', getLeaveRequestsByEmployee);
router.post('/', createLeaveRequest);
router.put('/:id/approve', approveLeaveRequest);
router.put('/:id/disapprove', disapproveLeaveRequest);
router.delete('/:id', deleteLeaveRequest);

export default router;