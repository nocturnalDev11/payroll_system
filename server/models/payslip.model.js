import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const payslipSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    payslipData: {
        baseSalary: { type: Number, required: true, min: 0 },
        deductions: {
            sss: { type: Number, default: 0, min: 0 },
            philhealth: { type: Number, default: 0, min: 0 },
            pagibig: { type: Number, default: 0, min: 0 }
        },
        earnings: {
            travelExpenses: { type: Number, default: 0, min: 0 },
            otherEarnings: { type: Number, default: 0, min: 0 }
        },
        netSalary: { type: Number, required: true, min: 0 }
    },
    salaryMonth: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/ 
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid'],
        default: 'pending',
        required: true
    }
});

export const Payslip = model('Payslip', payslipSchema);