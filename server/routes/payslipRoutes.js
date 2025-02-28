import express from 'express';
import { verifyEmployeeToken } from '../middleware/employeeAuth.js';
import { generatePayslip, sendPayslipEmail } from '../controllers/employees/payslip.controller.js';

const router = express.Router();

router.post('/generate', verifyEmployeeToken, generatePayslip);
router.post('/send-email', verifyEmployeeToken, sendPayslipEmail);

export default router;
