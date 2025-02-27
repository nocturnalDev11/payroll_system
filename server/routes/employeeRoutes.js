// employeeRoutes.js
import express from 'express';
import { verifyEmployeeToken } from '../middleware/employeeAuth.js';
import { loginEmployee, registerEmployee } from '../controllers/employees/auth/employeeAuth.controller.js';
import { getEmployeeById, updateEmployeeDetails, getProfile, getTotalEmployees, getAllEmployees, deleteEmployee, getPendingEmployees } from '../controllers/employees/employee.controller.js';

const router = express.Router();

router.get('/total', getTotalEmployees);
router.get('/', getAllEmployees);
router.get('/pending', getPendingEmployees); // New route for pending employees
router.post('/login', loginEmployee);
router.post('/register', registerEmployee);
router.get('/profile', verifyEmployeeToken, getProfile);
router.get('/:id', getEmployeeById);
router.put('/update/:id', updateEmployeeDetails);
router.delete('/:id', deleteEmployee);

export default router;