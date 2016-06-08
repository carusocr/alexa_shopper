/*
TO-DO: how to auto-add database grocery items to slots?
*/
var alexa = require('alexa-app');
var mysql = require('mysql');
var iniparser = require('iniparser')
var config = iniparser.parseSync('db.ini')

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

var app = new alexa.app('shopper');

app.launch(function(request,response) {
  response.session ('open_session', 'true');
    response.say("Welcome to grocery shopper. What are you looking for?");
    response.shouldEndSession (false, "If you would like to leave, just say exit.");
});

app.intent('shopIntent',
  {
    "slots" :  {"foodItem": "GroceryItem"},
    "utterances": [ "{find me|who is selling|where's|where is|I'm looking for} {the cheapest|a|} {-|foodItem}"]
  },
  function(req,res) {
    var food_target = req.slot('foodItem');
    res.say("You said that you're looking for " + food_target + "...");
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
    var sql = 'select * from grocery_list where item like "%' + food_target + '%"';
    con.query(sql, function (err, rows){
      if(err) callback(err);

      for (var i in rows) {
        console.log("Item:", rows[i].item, "\nPrice:", rows[i].price);
      }
      var food = rows[0].item; //food_target already has name, use that?
      var price = rows[0].price;
      var store = rows[0].store;
      res.say("I found " + food_target + " for " + price + " at " + store);
      res.send();
    });
    return false;
  }
);

app.intent('HelpIntent',
  {
    "slots" : {},
    "utterances": [
      "help"
    ]
  },
  function(req,res){
    res.say("Say the name of a grocery item that you're looking for and I'll seek the lowest price. Not guaranteed, dumbshit!");
  }
);

exports.handler = app.lambda();

if ((process.argv.length === 3) && (process.argv[2] === 'schema')){
  console.log (app.schema ());
  console.log (app.utterances ());
}

con.end(function(err) {
	//Ends gracefully
});
