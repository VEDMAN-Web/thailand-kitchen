const mongoose = require('mongoose');


const validatePhoneNumber = function (phoneNumber) {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phoneNumber);
};

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true
    },
    whatsappNumber:{
        type:Number,
        required:true
    },
    phoneNumber:{
        type:Number,
        required:true,
    },
    cityName:{
        type:String,
        required:true
    },
    countryName:{
        type:String,
        required:true
    },
    message:{
        type:String
    }
},{timestamps:true});

module.exports = mongoose.model('User',userSchema);
