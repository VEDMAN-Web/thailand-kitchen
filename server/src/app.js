const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({extended:true}))

app.use(helmet());

app.use(morgan('dev'));


const contactRouter = require('./router/contactRouter');
const errorHandler = require('./middleware/errorMiddleware')

app.use('/api/contact',contactRouter);
app.use(errorHandler);

module.exports = app;