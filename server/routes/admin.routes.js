import express from 'express';
import { loginAdmin } from '../controllers/admins/auth/adminAuth.controller.js';

const router = express.Router();

router.post('/login', loginAdmin);

router.get('/api/admin', (req, res) => {
    res.json({ message: "Admin API endpoint" });
});

export default router;