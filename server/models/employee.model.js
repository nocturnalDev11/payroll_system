import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const USERNAME_INVALID_CHARACTERS = ' ?;:,.`\'"(){}[]|\\/';

function usernameValidator(value) {
    for (let i = 0; i < USERNAME_INVALID_CHARACTERS.length; i++) {
        if (value.includes(USERNAME_INVALID_CHARACTERS[i])) {
            return false;
        }
    }
    return true;
}

const employeeSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: [4, 'Username must be at least 4 characters long'],
        validate: [usernameValidator, 'Invalid username'],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    password: {
        type: String,
        required: true,
        minLength: [8, 'Password must be at least 8 characters long'],
    },
    employeeIdNumber: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true
    },
    birthday: { 
        type: Date, 
        required: false, 
        default: null 
    },
    hireDate: { type: Date, required: false, default: null },
    contactInfo: { type: String, required: false, default: null },
    civilStatus: { type: String, required: false, default: null },
    position: { type: String, required: false, default: null },
    salary: { type: Number, required: true, min: 0 },
    deductions: {
        sss: { type: Number, default: 0 },
        philhealth: { type: Number, default: 0 },
        pagibig: { type: Number, default: 0 }
    },
    earnings: {
        travelExpenses: { type: Number, default: 0 },
        otherEarnings: { type: Number, default: 0 }
    },
    payheads: [{
        id: { type: Number, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, enum: ['Earnings', 'Deductions'], required: true }
    }],
    role: { type: String, default: 'employee' },
    sss: { type: String, required: false, default: null },
    philHealth: { type: String, required: false, default: null },
    hdmf: { type: String, required: false, default: null },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
});

export const Employee = model('Employee', employeeSchema);