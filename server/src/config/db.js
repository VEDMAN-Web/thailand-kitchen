const mongoose = require('mongoose');

const ConnectDB = async () =>{
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MONGO_URI is not defined');
        }
        await mongoose.connect(uri);
        console.log("Database is Connected...");
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

module.exports = ConnectDB;
