var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";

MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("test").updateMany({},{$addToSet:{'cats.$[].kos':"asdfa"}})
})