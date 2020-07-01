var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";


MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Categories").updateOne({name:"روانپرشک(اعصاب و روان)"},{$set:{image:"/catphotos/روانپزشک(اعصاب-و-روان).png"}},function(err,result){
        console.log(result)
    })
})