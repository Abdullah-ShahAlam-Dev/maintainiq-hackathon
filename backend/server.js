require('dotenv').config();
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const seedSuperAdmin = require('./config/seedSuperAdmin');

const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const publicRoutes = require('./routes/publicRoutes');
const issueRoutes = require('./routes/issueRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const historyRoutes = require('./routes/historyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// credentials:true + an explicit origin are required for the httpOnly cookie
// to be sent/accepted cross-site (frontend on Vercel, backend on Render).
// cors() with no options (wildcard) will NOT work once cookies are involved.
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

connectDB().then(seedSuperAdmin);

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('MaintainIQ API running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
