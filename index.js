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
    /*
    if(food_target == 'nothing') {
    	res.say("I'm sorry I couldn't help you.");
    	res.send();
    	res.shouldEndSession(true);
    }
    */
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
      var item_list=[];
      for (var i in rows) {
        item_list.push(rows[i].item);
        console.log("Item:", rows[i].item, "\nPrice:", rows[i].price);
        //populate array of items, if more than 1 ask for clarification
      }
      
      var clarified_item = rows[0].item;
      if(item_list.length > 1) {
      	// what about if there are two incidences of same item name but also fuzzy names?
      	// e.g. 'sardines','sardines','fresh sardines' ?
      	// Handle this on the backend, with the shopper script only adding cheapest dupe items.
	    item_genre = item_list.toString();
	    res.say("I found more than one result for " + food_target + " . " + item_genre + ". If you meant one of those, just say its name. Otherwise, say 'nothing'.").send();
	    clarified_item = req.slot('foodItem');
	    //res.shouldEndSession(false);
	  }
      else {
      	//add bit about 'nothing' here?K3lthana
      	
        var food = rows[0].item; //food_target already has name, use that?
        var price = rows[0].price;
        var store = rows[0].store;
        res.say("I found " + clarified_item + " for " + price + " at " + store).send();
      }
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
    res.say("Tell me what you're looking for and I'll seek the lowest price.");
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
