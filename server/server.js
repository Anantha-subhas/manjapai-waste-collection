require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { registerUser, findUserByEmail, savePickupRequest } = require('./database');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Validate environment variables
if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set in .env file');
}
if (!process.env.EMAIL_FROM) {
    console.error('EMAIL_FROM is not set in .env file');
}
if (!process.env.OWNER_EMAIL) {
    console.error('OWNER_EMAIL is not set in .env file');
}

// Default route to redirect to login page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Nodemailer setup with SendGrid SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: 'apikey', // SendGrid requires 'apikey' as the username
        pass: process.env.SENDGRID_API_KEY, // Your SendGrid API key
    },
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        await registerUser(username, email, password);
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Send email notification to website owner
        const mailOptions = {
            from: `Manja Pai Team <${process.env.EMAIL_FROM}>`,
            to: process.env.OWNER_EMAIL,
            subject: 'Manja Pai: New User Login Notification',
            html: `
                <h2>New User Login</h2>
                <p><strong>User:</strong> ${user.username} (${user.email})</p>
                <p><strong>Logged in at:</strong> ${new Date().toISOString()}</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                    This email was sent by Manja Pai. If you no longer wish to receive these notifications, please contact our support team.
                </p>
            `,
        };

        console.log('Sending login notification email:', {
            to: process.env.OWNER_EMAIL,
            subject: mailOptions.subject,
        });

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending login notification email:', error.message);
            } else {
                console.log(`Login notification email sent to ${process.env.OWNER_EMAIL}:`, info.response);
            }
        });

        res.status(200).json({ message: 'Login successful', email: user.email });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Pickup form submission endpoint
app.post('/api/pickup', async (req, res) => {
    const { user_email, fullname, email, address, city, pickup_date, agree } = req.body;

    try {
        const user = await findUserByEmail(user_email);
        if (!user) {
            console.error(`User not found for email: ${user_email}`);
            return res.status(400).json({ message: 'User not found' });
        }

        await savePickupRequest(user_email, fullname, email, address, city, pickup_date, agree);
        console.log(`Pickup request saved for user: ${user_email}`);

        // Respond immediately to the client
        res.status(201).json({ message: 'Pickup request submitted successfully' });

        // Send email notification to website owner in the background
        const mailOptions = {
            from: `Manja Pai Team <${process.env.EMAIL_FROM}>`,
            to: process.env.OWNER_EMAIL,
            subject: 'Manja Pai: New Pickup Request Received',
            html: `
                <h2>New Pickup Request</h2>
                <p><strong>From:</strong> ${fullname} (${email})</p>
                <p><strong>User Account:</strong> ${user_email}</p>
                <p><strong>Address:</strong> ${address}, ${city}</p>
                <p><strong>Pickup Date:</strong> ${pickup_date}</p>
                <p><strong>Agreed to Terms:</strong> ${agree ? 'Yes' : 'No'}</p>
                <p><strong>Submitted at:</strong> ${new Date().toISOString()}</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                    This email was sent by Manja Pai. If you no longer wish to receive these notifications, please contact our support team.
                </p>
            `,
        };

        console.log('Sending pickup notification email:', {
            to: process.env.OWNER_EMAIL,
            subject: mailOptions.subject,
            content: mailOptions.html,
        });

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending pickup notification email:', error.message);
            } else {
                console.log(`Pickup notification email sent to ${process.env.OWNER_EMAIL}:`, info.response);
            }
        });
    } catch (err) {
        console.error('Error processing pickup request:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});