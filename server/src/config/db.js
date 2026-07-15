const mongoose = require('mongoose');

const ConnectDB = async () =>{
    try {
        await mongoose.connect(process.env.MONGO_URI).then(()=>{
            console.log("Database is Connected...");
            
        }).catch(()=>{
            console.log("Database is Not Connected... ");
            
        })
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

module.exports = ConnectDB;