const express = require("express");
const validateMiddleWare = require("../middleware/validateMiddle");
const contactUsController = require('../controller/contactUsController');
const router = express.Router();



router.post('/post',validateMiddleWare,contactUsController.createContact);
router.get('/get',contactUsController.getContacts);
router.get('/getByID/:id',contactUsController.getContactById);
router.delete('/delete/:id',contactUsController.deleteContact);
router.put('/put/:id',validateMiddleWare,contactUsController.updateContact);


module.exports = router;