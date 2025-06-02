require('dotenv').config();
const express = require('express');
const cors = require('cors');
const updateRoute = require('./routes/updateRoutes');
const pythonRoute=require('./routes/pythonRoutes');
// const jsRoute=require('./routes/jsRoutes');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/update', updateRoute);
app.use('/api/python', pythonRoute);
// app.use('/api/js', jsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
