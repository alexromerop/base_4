#!/usr/bin/node

const http = require("http");
const node_static = require("node-static");

const mongo = require("mongodb").MongoClient; 
//nos conecta a mongo

let server_url = "mongodb://localhost:27017"; 

let chat_db; 
//global para poder acceder

mongo.connect(server_url, (error, server) => {
	if (error){
		console.log("Error en la conexion a MongoDB");
		throw error; 
//return error
		}
		
		console.log("Dentro de MongoDB");
	
		chat_db = server.db("amongmeme"); 
//escogemos la base de datos concreta
});




console.log("Inicializando servidor chat");


let public_files = new node_static.Server("pub"); 

http.createServer( (request, response) => {
	console.log("Archivo "+request.url);
	if (request.url == "/chat"){
		let info = request.url.split("=");
		console.log(info[1]);
		let query = {
			date : { $gt : parseInt(info[1]) }
		};

		console.log("Entrando en el chat");
		let cursor= chat_db.collection("chat").find({});

		cursor.toArray().then( (data) =>{
		console.log(data);
		response.writeHead(200, {'Content-Type':'text/plain'});
		response.write( JSON.stringify(data) );
		response.end();
	});

	return;
	}

	if (request.url == "/recent"){

	const estimated_count = chat_db.collection("chat").estimatedDocumentCount();

	estimated_count.then( (count) => {
	 console.log(count);

	const MAX = 5;



		let cursor= chat_db.collection("chat").find({},{
		skip: count - MAX,
		limit: MAX,
		sort:{ $natural:1} }
		);

		cursor.toArray().then( (data) => {
		response.writeHead(200, {'Content-Type':'text/plain'});
		response.write( JSON.stringify(data) );
		response.end();
	});

	});
	return;
	}



	if (request.url=="/submit"){
	console.log("Envio de datos");

	let body =[];
	request.on('data', chunk =>{

	 body.push(chunk);

	}).on('end', () =>{

	let chat_data= JSON.parse(Buffer.concat(body).toString());

			chat_db.collection("chat").insertOne({
				user: chat_data.chat_user,
				msg: chat_data.chat_msg,
				date: Date.now()
			});

		});


	response.end();

	return;
	}

if(request.url == "/history"){
        response.writeHead(200,{"Content-Type":"text/html"});
        let cursor = chat_db.collection("chat").find({},{
            sort:{ date: -1}
        });

        let chat = cursor.toArray();
        let show ="";
        chat.then((data) =>{
            for(let i = 0; i<data.length;i++){
                let date = data[i].date;
                date = new Date(date);

                let showdate = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() +" "+
                date.getHours() + ":" + date.getMinutes();

                show = "<p>" + "[" +  showdate + "] " + data[i].user + ": " + data[i].msg + "<p/>";

                response.write(show);
            }

            response.end();

        })
    }



	public_files.serve(request, response); 


}).listen(6891);

