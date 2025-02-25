import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Admin } from '../models/admin.model.js';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
    try {
        await connectDB();

        const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            mongoose.connection.close();
            return;
        }

        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        const admin = new Admin({
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
        });

        await admin.save();
        console.log('Admin user seeded successfully.');
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        mongoose.connection.close();
    }
})();
