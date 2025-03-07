import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';
import { Employee } from '../../models/employee.model.js'; 
import { Payslip } from '../../models/payslip.model.js';
import {
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculateWithholdingTax,
    calculatePagIBIGContribution
} from '../../utils/payrollCalculations.js';

export const generatePayslip = async (req, res) => {
    const { employeeId, salaryMonth } = req.body;

    try {
        const employee = await Employee.findById(employeeId).populate('payHeads');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const baseSalary = employee.salary || 0;
        const sssContribution = calculateSSSContribution(baseSalary);
        const philHealthContribution = calculatePhilHealthContribution(baseSalary);
        const pagIbigContribution = calculatePagIBIGContribution(baseSalary);
        
        const earnings = employee.payHeads.filter(p => p.type === 'Earnings');
        const totalEarningsFromPayHeads = earnings.reduce((sum, p) => sum + p.amount, 0);
        const totalEarnings = baseSalary + totalEarningsFromPayHeads;

        const deductions = employee.payHeads.filter(p => p.type === 'Deductions');
        const totalCustomDeductions = deductions.reduce((sum, p) => sum + p.amount, 0);
        const withholdingTax = calculateWithholdingTax(totalEarnings);
        const totalDeductions = totalCustomDeductions + sssContribution + philHealthContribution + pagIbigContribution + withholdingTax;

        const netSalary = totalEarnings - totalDeductions;

        // Return raw data instead of generating PDF here
        const payslipData = {
            employeeIdNumber: employee.employeeIdNumber,
            firstName: employee.firstName,
            lastName: employee.lastName,
            middleName: employee.middleName || '',
            birthDate: employee.birthDate,
            hireDate: employee.hireDate,
            civilStatus: employee.civilStatus,
            dependents: employee.dependents || 0,
            sss: employee.sssNumber || 'N/A',
            tin: employee.tin || 'N/A',
            philHeath: employee.philHealthNumber || 'N/A',
            pagIbig: employee.pagIbigNumber || 'N/A',
            position: employee.position || 'N/A',
            salary: baseSalary,
            salaryMonth,
            totalSalary: netSalary,
            payHeads: employee.payHeads,
            deductions: {
                sss: sssContribution,
                philHealth: philHealthContribution,
                pagIbig: pagIbigContribution,
                tax: withholdingTax,
                customDeductions: deductions.map(d => ({ name: d.name, amount: d.amount }))
            },
            earnings: {
                travelExpenses: earnings.find(p => p.name.toLowerCase().includes('travel'))?.amount || 0,
                otherEarnings: earnings.filter(p => !p.name.toLowerCase().includes('travel'))
                    .reduce((sum, p) => sum + p.amount, 0)
            }
        };

        // Optionally save payslip (remove PDF generation here if not needed)
        const payslip = new Payslip({
            employeeId: employee._id,
            payslipData: {
                baseSalary,
                earnings: payslipData.earnings,
                deductions: payslipData.deductions,
                netSalary
            },
            salaryMonth
        });
        await payslip.save();

        res.status(200).json(payslipData);
    } catch (error) {
        console.error('Error generating payslip:', error);
        res.status(500).json({ message: 'Failed to generate payslip', error: error.message });
    }
};

export const sendPayslipEmail = async (req, res) => {
    const { employeeId, employeeEmail, payslipData, salaryMonth } = req.body;

    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
        });

        const mailOptions = {
        from: process.env.EMAIL_USER,
        to: employeeEmail,
        subject: `Payslip for ${salaryMonth}`,
        text: `Dear ${employee.firstName},\n\nAttached is your payslip for ${salaryMonth}.\n\nBest regards,\nHR Team`,
        attachments: [{
            filename: `payslip-${employee.firstName}-${salaryMonth}.pdf`,
            content: payslipData.split(',')[1],
            encoding: 'base64'
        }]
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Payslip email sent successfully' });
    } catch (error) {
        console.error('Error sending payslip email:', error);
        res.status(500).json({ message: 'Failed to send payslip email', error: error.message });
    }
};