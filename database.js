var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";


MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Categories").updateOne({name:"ارتپدی"},{$set:{name:"ارتوپدی"}});
    dbo.collection("Categories").deleteOne({name:"اورولوژی"});
    dbo.collection("Categories").insertOne({name:"بیماری های عفونی و تب دار",image:"/catphotos/ofoni.png"}); 
    dbo.collection("Categories").insertOne({name:"جراح کلیه و مجاری ادراری",image:"/catphotos/kolie.png"});
    dbo.collection("Categories").insertOne({name:"قلب و عروق",image:"/catphotos/qalb.png"});
    dbo.collection("Categories").insertOne({name:"چشم",image:"/catphotos/cheshm.png"});
    dbo.collection("Categories").insertOne({name:"اطفال",image:"/catphotos/atfal.png"});
    dbo.collection("Categories").insertOne({name:"روانپرشک(اعصاب و روان)",image:"/catphotos/ravan.png"});
    dbo.collection("Categories").insertOne({name:"گوش حلق بینی",image:"/catphotos/goshhalq.png"});
    dbo.collection("Categories").insertOne({name:"تغذیه",image:"/catphotos/taqzie.png"});
    dbo.collection("Categories").insertOne({name:"جراحی مغز و اعصاب",image:"/catphotos/maqz.png"});
    dbo.collection("Categories").insertOne({name:"جراحی و متخصص زنان",image:"/catphotos/jarahizanan.png"});
    dbo.collection("Categories").insertOne({name:"دندانپزشک",image:"/catphotos/dandan.png"});
    dbo.collection("Categories").insertOne({name:"غدد و متابولیسم",image:"/catphotos/qodad.png"});
    dbo.collection("Categories").insertOne({name:"جراحی عمومی",image:"jarahi.png"});
})