import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';
import { Employee } from '../../models/employee.model.js'; 
import { Payslip } from '../../models/payslip.model.js';

export const generatePayslip = async (req, res) => {
    const { employeeId, salaryMonth } = req.body;

    try {
        const employee = await Employee.findOne({ employeeIdNumber: employeeId }).populate('payheads');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Payslip', 20, 20);
        doc.setFontSize(12);
        doc.text(`Employee ID: ${employee.employeeIdNumber}`, 20, 30);
        doc.text(`Name: ${employee.firstName} ${employee.lastName}`, 20, 40);
        doc.text(`Position: ${employee.position || 'Not provided'}`, 20, 50);
        doc.text(`Salary Month: ${salaryMonth}`, 20, 60);
        doc.text(`SSS ID: ${employee.sss || 'Not provided'}`, 20, 70);
        doc.text(`PhilHealth ID: ${employee.philhealth || 'Not provided'}`, 20, 80);
        doc.text(`Pag-IBIG ID: ${employee.hdmf || 'Not provided'}`, 20, 90);

        let yPos = 110;
        doc.text('Earnings:', 20, yPos);
        yPos += 10;
        doc.text(`Base Salary: ₱${(employee.salary || 0).toLocaleString()}`, 20, yPos);
        yPos += 10;

        const payheadEarnings = employee.payheads
            .filter(p => p.type === 'Earnings')
            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        employee.payheads
            .filter(p => p.type === 'Earnings')
            .forEach(payhead => {
                doc.text(`${payhead.name}: ₱${(payhead.amount || 0).toLocaleString()}`, 20, yPos);
                yPos += 10;
            });

        const totalEarnings = (employee.salary || 0) + payheadEarnings;
        doc.text(`Total Earnings: ₱${totalEarnings.toLocaleString()}`, 20, yPos);
        yPos += 20;

        doc.text('Deductions:', 20, yPos);
        yPos += 10;
        const totalDeductions = employee.payheads
            .filter(p => p.type === 'Deductions')
            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        employee.payheads
            .filter(p => p.type === 'Deductions')
            .forEach(payhead => {
                doc.text(`${payhead.name}: ₱${(payhead.amount || 0).toLocaleString()}`, 20, yPos);
                yPos += 10;
            });

        doc.text(`Total Deductions: ₱${totalDeductions.toLocaleString()}`, 20, yPos);
        yPos += 20;

        const netSalary = totalEarnings - totalDeductions;
        doc.text(`Net Salary: ₱${netSalary.toLocaleString()}`, 20, yPos);
        yPos += 10;
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos);

        const pdfBase64 = doc.output('datauristring');

        // Optionally save to Payslip model
        const payslip = new Payslip({
            employeeId: employee._id,
            payslipData: {
            baseSalary: employee.salary || 0,
            deductions: {
                sss: employee.deductions?.sss || 0,
                philhealth: employee.deductions?.philhealth || 0,
                pagibig: employee.deductions?.pagibig || 0
            },
            earnings: {
                travelExpenses: employee.earnings?.travelExpenses || 0,
                otherEarnings: employee.earnings?.otherEarnings || 0
            },
            netSalary
        },
        salaryMonth
    });
    await payslip.save();

    res.status(200).json({ payslipData: pdfBase64 });
    } catch (error) {
        console.error('Error generating payslip:', error);
        res.status(500).json({ 
            message: 'Failed to generate payslip',
            error: error.message,
            stack: error.stack
        });
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
                user: 'your-email@gmail.com',
                pass: 'your-app-specific-password'
            }
        });

        const mailOptions = {
            from: 'your-email@gmail.com',
            to: employeeEmail,
            subject: `Payslip for ${salaryMonth}`,
            text: `Dear ${employee.firstName},\n\nPlease find your payslip for ${salaryMonth} attached.\n\nBest regards,\nYour HR Team`,
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
        res.status(500).json({ message: 'Failed to send payslip email' });
    }
};
