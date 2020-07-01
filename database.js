var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";


MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Categories").insertOne({name:"جراحی فک و صورت",image:"/catphotos/جراحی-فک-و-صورت.png"});
    dbo.collection("Categories").insertOne({name:"متخصص طب ورزشی و بازتوانی",image:"/catphotos/متخصص-طب-ورزشی-و-بازتوانی.png"});
    dbo.collection("Categories").insertOne({name:"درمان ریشه",image:"/catphotos/درمان-ریشه.png"});
})