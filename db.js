const mongoose = require('mongoose');

let connected = false;

async function connectDB() {
    if (connected) return mongoose.connection;

    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI is not set. Please set it in your .env or Heroku config vars.');
    }

    mongoose.set('strictQuery', true);

    await mongoose.connect(uri, {
        dbName: process.env.MONGO_DB_NAME || 'darkxmd'
    });

    connected = true;
    console.log('[DB] MongoDB connected');
    return mongoose.connection;
}

module.exports = { connectDB, mongoose };
