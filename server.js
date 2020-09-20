const express = require('express');
const app = express();
const apphttp=express();
const router = require('./Router/router.js');  
const bodyParser = require('body-parser');   //for parsing and getting data from http post request
var cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const session = require('express-session');
var http = require('http');
const https = require('https');
var fs = require('fs');


apphttp.get("*",function(req, res) {  
    res.redirect('https://' + req.headers.host + req.url);
})

app.use(express.static('public'));    // files on the public path are downloadable
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(fileUpload({useTempFiles : true}))
app.use(session({secret: 'tajviz'}));

app.set('views','./htmls');
app.engine('html', require('ejs').renderFile);
app.use('/',router);

var privateKey  = fs.readFileSync('/etc/letsencrypt/live/reservation.drtajviz.com/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/reservation.drtajviz.com/fullchain.pem', 'utf8');

// var privateKey  = fs.readFileSync('letsencrypt/live/reservation.drtajviz.com/privkey.pem', 'utf8');
// var certificate = fs.readFileSync('letsencrypt/live/reservation.drtajviz.com/fullchain.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};
var httpServer = http.createServer(apphttp);
var httpsServer = https.createServer(credentials, app);


httpServer.listen(80);
console.log("http started")
httpsServer.listen(443);
console.log("https started")