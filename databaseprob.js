var MongoClient = require('mongodb').MongoClient;
var dburl = "mongodb://localhost:27017/";



MongoClient.connect(dburl+"mydb", function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});

MongoClient.connect(dburl, function(err, db) {       // collection Doctors
    if (err) throw err;
    var dbo=db.db('mydb');
    dbo.createCollection("Doctors", function(err, res) {
      if (err) throw err;
      console.log("Collection Products created!");
      db.close();
    });
});

MongoClient.connect(dburl, function(err, db) {    // collection categories
    if (err) throw err;
    var dbo=db.db('mydb');
    dbo.createCollection("Categories", function(err, res) {
      if (err) throw err;
      console.log("Collection Categories created!");
      db.close();
    });
});

MongoClient.connect(dburl, function(err, db) {    // collection reserves
    if (err) throw err;
    var dbo=db.db('mydb');
    dbo.createCollection("Reservations", function(err, res) {
      if (err) throw err;
      console.log("Collection Categories created!");
      db.close();
    });
});

MongoClient.connect(dburl, function(err, db) {    // collection categories
    if (err) throw err;
    var dbo=db.db('mydb');
    dbo.createCollection("Users", function(err, res) {
      if (err) throw err;
      console.log("Collection Users created!");
      db.close();
    });
});

MongoClient.connect(dburl, function(err, db) {    // collection signupcode
  if (err) throw err;
  var dbo=db.db('mydb');
  dbo.createCollection("signupcode", function(err, res) {
    if (err) throw err;
    console.log("Collection Users created!");
    dbo.collection("signupcode").createIndex({},{expireAfterSeconds:60});
    db.close();
  });
});



