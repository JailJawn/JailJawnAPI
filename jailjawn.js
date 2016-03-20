"use strict";
var http = require('http'),
	url = require('url'),
	Firebase = require('firebase'),
	port = process.env.PORT || 8080,
	host = process.env.PORT ? '0.0.0.0' : '127.0.0.1',
	data;
	
var firebase = new Firebase("https://burning-heat-7610.firebaseio.com/")
firebase.on("value", function(snapshot){
	data = snapshot.val()
})

http.createServer(function(req,res){
	var reqUrl = url.parse(req.url), 
		formattedUrl = reqUrl.path.replace('/',""),
		response;
	
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
		res.writeHeader(200, {'Access-Control-Allow-Origin': "*", 'Access-Control-Allow-Methods': 'GET', "Content-Type" : "text/html"});
		res.write(JSON.stringify(response));
		res.end();
	
}).listen(port, host)

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