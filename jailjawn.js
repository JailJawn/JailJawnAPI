"use strict";
//Node (Also ES6) introduces the idea of modules 
//HTTP and URL are first party libraries
var http = require('http'),
	url = require('url'),
	Firebase = require('firebase'),	//Firebase node API
	port = process.env.PORT || 8080, //.env package keeps configuration variables out of source code (heroku also uses them to set config)
	host = process.env.PORT ? '0.0.0.0' : '127.0.0.1',	//some heroku config
	data; //initalize data var to store database info 
	
var firebase = new Firebase("https://burning-heat-7610.firebaseio.com/"); //connect to firebase
firebase.on("value", function(snapshot){ // when it recieves a response, execute this anon. function
	data = snapshot.val() // set data var to the value returned by firebase
})
//create server... creates a server. It takes a request and a response
http.createServer(function(req,res){
	var reqUrl = url.parse(req.url), //parse the URL (it shows what comes after the host name eg: /login)
		formattedUrl = reqUrl.path.replace('/',""), //replace / with nothing ""
		response; // instantiate response variable 
		
		//decide what response to send
		switch(formattedUrl){
			case "all":
				response = data;
				break;
			case "daily_totals":
				response = formatDateChart(data);
				break;
			case "prison_totals":
				response = separatePrisons(data);
				break;
			default:
				response = "Usage: /all, /daily_totals, /prison_totals";
				break;
		}
		//need to write CORS header
		res.writeHeader(200, {'Access-Control-Allow-Origin': "*", 'Access-Control-Allow-Methods': 'GET', "Access-Control-Allow-Headers": "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept", "Content-Type" : "text/html"});
		//res has to send a string -- stringify the json
		res.write(JSON.stringify(response));
		res.end();
	
}).listen(port, host)
//format functions copied from the front-end app 
function formatDateChart(data){
    //type checking
    if(!data){
        return "error, data is undefined";
    }
    else if(typeof(data) !== "object"){
        return "error, argument should be an object";
    }
    else{
        //instantiate array
        var formatted = new Array;
        //iterate through the data
        for(var prop in data){
            // send each object literal to the formatted array
            formatted.push({
                "date": prop,
                "value": data[prop]["Total "]["Juvenile Male"]
                //currently the API displays total as "Juvenile Male", this will be fixed in future iterations
            });
        }
        //return array
        return formatted;
    }
}

function separatePrisons(data){
    if(!data){
        return "Error, data is undefined"
    }
    else if(typeof(data) !== "object"){
        return "error, data should be an object"
    }else{
        var prisons = {};
        /*
            The JavaScript Object prototype doesn't include an iterator method.
            It does include the keys() method which take an object as an argument and returns
            the keys.

            Arrays have iterative methods like .forEach, .map, and to a lesser extent: .every and .filter

            JavaScript object literals are kind of like associative arrays, maps, or key-value pairs
         */
        Object.keys(data).forEach(function(key){  //Iterate through each value in the data set (each value is an object that contains an object)
            Object.keys(data[key]).forEach(function(prop){ //Iterate through each value's value (again, each is an object)
                if(!prisons.hasOwnProperty(prop)){ //If prisons doesn't have a property that is equal to the name of a prison, make it a property
                    prisons[prop] = [{
                        date: new Date(key),
                        inmates: data[key][prop]["Total Count"]
                    }]
                }else{//else add a new object literal to the end of the array
                    prisons[prop].push({
                        date: new Date(key),
                        inmates: data[key][prop]["Total Count"]
                    })
                }
            })
        });
        return prisons;
    }
}