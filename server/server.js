import express from 'express'
import path from 'path'
import cors from 'cors'
import { corsOptions } from './config/cors.js'
import connectDB from './config/db.js'
import adminRoutes from './routes/adminRoutes.js'
import payslipRoutes from './routes/payslipRoutes.js'
import payheadRoutes from './routes/payheadRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import leaveRequestRoutes from './routes/leaveRequestRoutes.js'

const PORT = process.env.PORT || 5000;

const app = express();

connectDB();

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors(corsOptions));

// admin and employee routes
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);

// attendance routes
app.use('/api/attendance', attendanceRoutes);

// leave request routes
app.use('/api/leaves', leaveRequestRoutes);

// pay slip routes
app.use('/api/payslips', payslipRoutes);

// pay head routes
app.use('/api/payheads', payheadRoutes);

app.use(express.static('public'));

// GET Route for homepage
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/index.html'))
);

app.listen(PORT, () =>
    console.log(`Server listening on port ${PORT}`)
);
