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
    /* Notes on item lookup in database:

    - How to handle when multiple items match the search phrase, like 'chicken thighs'
      and 'chicken breasts' when user says 'find me chicken'?
        - Could say "I found multiple items that match your search phrase. Which of these
          are you interested in?" Then either return price for the more specific item, 
          or just say "Okay" if user says "nothing".
    - Also, how to check LOWEST price? Prices are stored as strings. And how to handle
        when something is like "2 for 2.99" versus "1.99 each"?



    */
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
        item_genre = item_list.toString();
        res.say("I found more than one result for " + food_target + " . " + item_genre);
        res.say(". If you meant one of those, just say its name. Otherwise, say no.");
        var clarified_item = req.slot('foodItem');
        res.say("You said " + clarified_item + " . ");
        //res.send();
      }


      var food = rows[0].item; //food_target already has name, use that?
      var price = rows[0].price;
      var store = rows[0].store;
      res.say("I found " + clarified_item + " for " + price + " at " + store);
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
