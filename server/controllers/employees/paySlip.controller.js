import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';
import { Employee } from '../../models/employee.model.js'; 
import { Payslip } from '../../models/payslip.model.js';

export const generatePayslip = async (req, res) => {
    const { employeeId, salaryMonth } = req.body;

    try {
        const employee = await Employee.findById(employeeId).populate('payHeads');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const doc = new jsPDF();
        doc.text(`Payslip for ${salaryMonth}`, 10, 10);
        doc.text(`Employee: ${employee.firstName} ${employee.lastName}`, 10, 20);
        doc.text(`ID: ${employee.employeeIdNumber}`, 10, 30);
        doc.text(`Base Salary: ₱${(employee.salary || 0).toLocaleString()}`, 10, 40);

        let yPos = 50;
        const earnings = employee.payHeads.filter(p => p.type === 'Earnings');
        earnings.forEach(payHead => {
            doc.text(`${payHead.name}: ₱${payHead.amount.toLocaleString()}`, 10, yPos);
            yPos += 10;
        });
        const totalEarnings = employee.salary + earnings.reduce((sum, p) => sum + p.amount, 0);
        doc.text(`Total Earnings: ₱${totalEarnings.toLocaleString()}`, 10, yPos);
        yPos += 10;

        const deductions = employee.payHeads.filter(p => p.type === 'Deductions');
        deductions.forEach(payHead => {
            doc.text(`${payHead.name}: ₱${payHead.amount.toLocaleString()}`, 10, yPos);
            yPos += 10;
        });
        const totalDeductions = deductions.reduce((sum, p) => sum + p.amount, 0);
        doc.text(`Total Deductions: ₱${totalDeductions.toLocaleString()}`, 10, yPos);
        yPos += 10;

        const netSalary = totalEarnings - totalDeductions;
        doc.text(`Net Salary: ₱${netSalary.toLocaleString()}`, 10, yPos);

        const pdfBase64 = doc.output('datauristring');

        const payslip = new Payslip({
            employeeId: employee._id,
            payslipData: {
                baseSalary: employee.salary,
                earnings: { travelExpenses: 0, otherEarnings: 0 },
                netSalary
            },
            salaryMonth
        });
        await payslip.save();

        res.status(200).json({ payslipData: pdfBase64 });
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