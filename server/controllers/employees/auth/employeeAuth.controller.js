import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Employee } from '../../../models/employee.model.js';

function generateToken(employeeId) {
    return jwt.sign({ employeeId }, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

export const registerEmployee = asyncHandler(async (req, res) => {
    const {
        firstName, lastName, username, email, password, employeeIdNumber,
        birthday, hireDate, contactInfo, civilStatus, position,
        salary, sss, philHealth, hdmf, role
    } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !employeeIdNumber || !salary) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
    }

    const existingEmployee = await Employee.exists({ 
        $or: [
            { username: { $regex: username, $options: 'i' } },
            { email },
            { employeeIdNumber }
        ]
    });
    
    if (existingEmployee) {
        res.status(409).json({ error: 'Username, email, or employee ID already in use' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const employee = await Employee.create({
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        employeeIdNumber,
        birthday: birthday || null,
        hireDate: hireDate || null,
        contactInfo: contactInfo || null,
        civilStatus: civilStatus || null,
        position: position || null, // Could be "position applied for" during signup
        salary: salary || 0, // Default to 0 if pending
        sss: sss || null,
        philHealth: philHealth || null,
        hdmf: hdmf || null,
        role: role || 'employee',
        status: 'pending', // Explicitly set as pending
        deductions: { sss: 0, philhealth: 0, pagibig: 0 }, // Defaults
        earnings: { travelExpenses: 0, otherEarnings: 0 } // Defaults
    });

    const token = generateToken(employee._id);
  
    res.status(201).json({
        message: 'Registration submitted for approval',
        employee: {
            id: employee._id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            username: employee.username,
            email: employee.email,
            employeeIdNumber: employee.employeeIdNumber,
            position: employee.position,
            salary: employee.salary,
            status: employee.status
        },
        token
    });
});

export const loginEmployee = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const employee = await Employee.findOne({ email });
    if (!employee) {
        res.status(401).json({ 'message': 'Unauthorized' });
        return;
    }

    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) {
        res.status(401).json({ 'message': 'Unauthorized' });
        return;
    }

    const token = generateToken(employee._id);

    res.status(201).json({
        message: 'Successfully registered',
        employee: {
            id: employee._id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            username: employee.username,
            email: employee.email,
            employeeIdNumber: employee.employeeIdNumber,
            birthday: employee.birthday,
            hireDate: employee.hireDate,
            contactInfo: employee.contactInfo,
            civilStatus: employee.civilStatus,
            position: employee.position,
            salary: employee.salary,
            sss: employee.sss,
            philHealth: employee.philHealth,
            hdmf: employee.hdmf,
            role: employee.role
        },
        token
    });
});

export const pendingRequest = asyncHandler(async (req, res) => {
    const { name, positionApplied, salary, email, contactNumber, password } = req.body;
    const request = new PendingRequest({
        name, positionApplied, salary, email, contactNumber, password,
        deductions: { sss: 0, philhealth: 0, pagibig: 0 }, // Defaults
        earnings: { travelExpenses: 0, otherEarnings: 0 } // Defaults
    });
    await request.save();
    res.status(201).json(request);
});