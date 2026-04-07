require('dotenv').config();
const mongoose = require('mongoose');
console.log('Connecting to:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
.then(() => { console.log('Connected!'); process.exit(0); })
.catch(err => { console.error('Error:', err.message); process.exit(1); });
