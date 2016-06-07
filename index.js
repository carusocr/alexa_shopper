var alexa = require('alexa-app');
var mysql = require('mysql');
var iniparser = require('iniparser')
var config = iniparser.parseSync('db.ini')
//var env = process.env.NODE_ENV || 'dev'; //startup nodejs with e.g:  NODE_ENV= node server.js

con = mysql.createConnection({
    host        : config.host,
    user        : config.user,
    password    : config.password,
    database    : config.database
});

con.connect(function(err) {
	if(err){
		console.log("Can't connect! Check your settings.");
		return;
	}
	console.log("Connection established.");
});

// need to wrap this in a function that gets called 
// how to populate list of possible items??
con.query('select * from grocery_list',function (err, rows){
	if(err) throw err;

	for (var i in rows) {
		console.log("Item:", rows[i].item, "\nPrice:", rows[i].price);
	}
	var sardines = rows[i].item;
	var sardine_price = rows[i].price;
	var store = rows[i].store;
});

// Define an alexa-app
var app = new alexa.app('alexa_shopper');
var sardines = 'sardines';
//var store = 'Q F C'
app.launch(function(req,res) {
  response.session ('open_session', 'true');
    response.say("Welcome to mood checker. I want to know how you're doing.");
    response.shouldEndSession (false, "How are you feeling? If you would like to leave, just say exit.");
});

app.intent('HelpIntent',
  {
    "slots" : {},
    "utterances": [
      "help"
    ]
  },
  function (req,res) {
    //res.say("Rate how you're feeling by saying a number between one and ten. That's all I do for now.");
  	res.say("Hey, " + sardines + " are on sale right now at " + store);
  }
);

exports.handler = app.lambda();

if ((process.argv.length === 3) && (process.argv[2] === 'schema')){
  console.log (app.schema ());
  console.log (app.utterances ());
}
//console.log (app.schema());
//console.log (app.utterances ());


con.end(function(err) {
	//Ends gracefully
});
