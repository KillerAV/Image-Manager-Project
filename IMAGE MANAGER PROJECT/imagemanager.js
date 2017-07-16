var express=require('express');
var app=express();
var formidable=require('formidable');
var http=require('http').Server(app);
var io=require('socket.io')(http);
var fs=require('fs');
var mongo=require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";

///INTRO PAGE
app.get("/",function(req,res){
	res.sendFile(__dirname + '/intro.html');
});

///UPLOAD IMAGE PAGE

///TO ACCESS STATIC ELEMENTS
app.use(express.static('public'));

app.get("/uploadimage",function(req,res){
	res.sendFile(__dirname + '/uploadimage.html');
});

var str="";
io.on('connection',function(socket){
	console.log(str);
	socket.emit('finalpage',str);
});
app.post("/uploadimage",function(req,res){
	var form=new formidable.IncomingForm();
	form.parse(req,function(err,fields,files){
		if(err)
			throw err;
		var oldpath=files.filename.path;
		var newpath='C:/Users/ABHISHEK/IMAGE MANAGER PROJECT/public/' + files.filename.name;
		
		///ADDING IT TO DATABASE
		var currentTime=new Date();
		var obj={	"source": "/" + files.filename.name, 
				"details": fields.details,
				"division": fields.category,
				"date": currentTime
			};
		mongo.connect(url,function(err,db){
			if(err)
				throw err;
			db.collection("imagedatabase").insertOne(obj,function(err,result){
				if(err)
					throw err;
				console.log("ADDED TO DATABASE");
			});
			db.collection("imagedatabase").find({}).toArray(function(err,result){
				if(err)
					throw err;
				db.close();
			});
		});
		
		///moving file from temp folder to current directory
		fs.rename(oldpath,newpath,function(err){
			if(err)
				throw err;
			console.log("FILE UPLOADED AND MOVED");
			res.sendFile(__dirname + "/thankyoupage.html");
			str="IMAGE UPLOADED";
		});		
	});
});

///DELETE IMAGE PAGE
app.get("/deleteimage",function(req,res){
	res.sendFile(__dirname + '/delete.html');
});

app.post("/deleteimage",function(req,res){
	var form=new formidable.IncomingForm();
	form.parse(req,function(err,fields,files){
		if(err)
			throw err;
		var obj={"source": fields.source};
		mongo.connect(url,function(err,db){
			if(err)
				throw err;	
			db.collection("imagedatabase").deleteOne(obj,function(err,result){
				if(err)
					throw err;
				console.log("DELETED");
				str="IMAGE DELETED";
				res.sendFile(__dirname + "/thankyoupage.html");
				db.close();
			});
		});
	});
});

///VIEW IMAGES PAGE
///DIVISION SELECT
var datewise;
io.on('connection', function(socket){
	socket.emit('divselect',JSON.stringify(datewise));
});
app.get("/viewimage",function(req,res){
	mongo.connect(url,function(err,db){
		db.collection("imagedatabase").find({}).sort({"date": -1}).toArray(function(err,result){
			if(err)
				throw err;
			datewise={"array": result};
			res.sendFile(__dirname + "/viewimage.html");
			db.close();
		});
	});
});

///VIEW SELECTED DIVISION
var data;
io.on('connection',function(socket){
	socket.emit('viewimage',JSON.stringify(data));
});

app.get("/viewimage/:id",function(req,res){
	var choice=req.params.id;
	var query={"division": choice};
	mongo.connect(url,function(err,db){
		if(err)
			throw err;
		db.collection("imagedatabase").find(query).toArray(function(err,result){
			if(err)
				throw err;
			data={"array": result};
			res.sendFile(__dirname + "/divview.html");
			db.close();
		});
	});	
});

///VIEW FULL SIZE IMAGE
var imagedetails;
io.on('connection',function(socket){
	socket.emit('fullpage',JSON.stringify(imagedetails));
});

app.get("/fullpage/:c/:id",function(req,res){
	var imagetofind=Number(req.params.id);
	var division=req.params.c;
	mongo.connect(url,function(err,db){
		if(err)
			throw err;
		var query={"division": division };
		db.collection("imagedatabase").find(query).toArray(function(err,result){
			if(err)
				throw err;
			///WE WANT INFORMATION OF result[imagetofind]
			imagedetails=result[imagetofind];
			res.sendFile(__dirname + "/fullpage.html");		
			db.close();
		});
	});
});

http.listen(8080);