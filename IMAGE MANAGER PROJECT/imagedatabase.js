var mongo=require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
mongo.connect(url,function(err,db){
	if(err)
		throw err;
	db.collection("imagedatabase").remove({});
	db.createCollection("imagedatabase",function(err,res){
		if(err)
			throw err;
		db.close();
	});
	
});