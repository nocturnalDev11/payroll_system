import asyncHandler from 'express-async-handler'
import { Employee } from '../../models/employee.model.js'

// Get all employees
export const getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const employees = await Employee.find().select('-password'); // Exclude password field
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
});

// Get pending employees
export const getPendingEmployees = asyncHandler(async (req, res) => {
    try {
        const pending = await Employee.find({ status: 'pending' }).select('-password');
        res.status(200).json(pending);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending employees', error: error.message });
    }
});

// Get total number of employees
export const getTotalEmployees = asyncHandler(async (req, res) => {
    try {
        const total = await Employee.countDocuments();
        res.status(200).json({ total });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching total employees', error: error.message });
    }
});

export const getProfile = asyncHandler(async (req, res) => {
    console.log('req.employeeId:', req.employeeId); // Debug log
    const employee = await Employee.findById(req.employeeId).select('-password');
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeObj = employee.toObject();
    res.status(200).json({
        id: employeeObj._id,
        firstName: employeeObj.firstName,
        lastName: employeeObj.lastName,
        username: employeeObj.username,
        email: employeeObj.email,
        employeeIdNumber: employeeObj.employeeIdNumber,
        birthday: employeeObj.birthday,
        hireDate: employeeObj.hireDate,
        contactInfo: employeeObj.contactInfo,
        civilStatus: employeeObj.civilStatus,
        salary: employeeObj.salary,
        sss: employeeObj.sss,
        philHealth: employeeObj.philHealth,
        hdmf: employeeObj.hdmf,
        position: employeeObj.position,
        role: employeeObj.role,
    });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await Employee.findById(id).select('-password');
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(employee);
});

export const updateEmployeeDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { position, ...otherDetails } = req.body;

        // Find employee and update all fields
        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            { ...otherDetails, position },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee details updated successfully', updatedEmployee });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee deleted successfully' });
});