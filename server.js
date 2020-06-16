const express = require('express');
const app = express();
const router = require('./Router/router.js');  
const bodyParser = require('body-parser');   //for parsing and getting data from http post request
var cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');


app.use(express.static('public'));    // files on the public path are downloadable
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(fileUpload())

app.set('views','./htmls');
app.engine('html', require('ejs').renderFile);
app.use('/',router);

const port = process.env.port || 8080;   // server port for listen
app.listen(port, () => console.log(`Run on port ${port}`));   //listen