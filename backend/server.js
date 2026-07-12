require('dotenv').config();
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const publicRoutes = require('./routes/publicRoutes');
const issueRoutes = require('./routes/issueRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const historyRoutes = require('./routes/historyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

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
