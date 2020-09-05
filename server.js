const express = require('express');
const app = express();
const router = require('./Router/router.js');  
const bodyParser = require('body-parser');   //for parsing and getting data from http post request
var cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const session = require('express-session');
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

const httpsServer = https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app);


httpsServer.listen(443, () => console.log(`HTTPS server listening: https://localhost`));

// const port = process.env.port || 80;   // server port for listen
// app.listen(port, () => console.log(`Run on port ${port}`));   //listen