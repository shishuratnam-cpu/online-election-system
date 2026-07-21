const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.43.200:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve candidate upload files statically (photo, govt ID, manifestos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const organizerRoutes = require('./routes/organizerRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const voteRoutes = require('./routes/voteRoutes');
const contactRoutes = require('./routes/contactRoutes');
const electionRoutes = require("./routes/electionRoutes");

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/contact-settings', contactRoutes);
app.use("/api/elections", electionRoutes);

// Root test route
app.get('/', (req, res) => {
  res.json({ message: 'Online Election Management System Server is running.' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || 'An internal server error occurred.' 
  });
});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
