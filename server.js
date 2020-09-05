const express = require('express');
const app = express();
const router = require('./Router/router.js');  
const bodyParser = require('body-parser');   //for parsing and getting data from http post request
var cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const session = require('express-session');
var http = require('http');
const https = require('https');
var fs = require('fs');



app.use(express.static('public'));    // files on the public path are downloadable
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(fileUpload({useTempFiles : true}))
app.use(session({secret: 'tajviz'}));

app.set('views','./htmls');
app.engine('html', require('ejs').renderFile);
app.use('/',router);

var privateKey  = fs.readFileSync('ssl/keys/server.key', 'utf8');
var certificate = fs.readFileSync('ssl/certs/server.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};
console.log(credentials)
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
console.log("http started")
httpsServer.listen(443);
console.log("https started")


// const port = process.env.port || 80;   // server port for listen
// app.listen(port, () => console.log(`Run on port ${port}`));   //listen