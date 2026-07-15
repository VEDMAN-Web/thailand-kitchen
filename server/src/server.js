require('dotenv').config();
const app = require('./app');
const ConnectDB = require('./config/db');

const PORT = process.env.PORT || 5000;


const startServer = async () =>{
    try {
        await ConnectDB();

        app.listen(PORT, ()=>{
            console.log(`Server is Running at ${PORT}`);
            
        })
    } catch (error) {
        console.log(error.message);
        
    }
}

startServer();