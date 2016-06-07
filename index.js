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

var buildList = function() {
  con.query('select * from grocery_list',function (err, rows){
  	if(err) callback(err);

  	for (var i in rows) {
  		console.log("Item:", rows[i].item, "\nPrice:", rows[i].price);
  	}
  	var sardines = rows[0].item;
  	var sardine_price = rows[0].price;
  	var store = rows[0].store;
    console.log(rows[0].item);
  });
}

var testList = function(callback) {
  callback('sardines');
}

//testList(buildList);

//rows = buildList();
// Define an alexa-app
var app = new alexa.app('shopper');
//var sardines = 'sardines';
//var store = 'Q F C'
var sardines='sardines';
var store='zug';
app.pre = function() {
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
  con.query('select * from grocery_list',function (err, rows){
    if(err) callback(err);

    for (var i in rows) {
      console.log("Item:", rows[i].item, "\nPrice:", rows[i].price);
    }
    var sardines = rows[0].item;
    var sardine_price = rows[0].price;
    var store = rows[0].store;
  });
  
}

app.launch(function(request,response) {
  response.session ('open_session', 'true');
    response.say("Welcome to grocery shopper. What are you looking for?");
    response.shouldEndSession (false, "If you would like to leave, just say exit.");
});

app.intent('HelpIntent',
  {
    "slots" : {},
    "utterances": [
      "help"
    ]
  },
  function (req,res) {
    //res.say("Say the name of a grocery item that you're looking for and I'll seek the lowest price. Not guaranteed, dumbshit!");
  	res.say("Hey, " + sardines + " are on sale right now at " + store);
  }
);

app.intent('FeelsIntent',
  {
    "slots": {"rating":"NUMBER"},
    "utterances": [
      "{i feel|i am|maybe|around|i'm|about|} {a|around|about|} {a|} {rating}"]
  },
  function(req,res) {
    var feel_rating = req.slot('rating');
    res.say("You said that you're feeling around a" + feel_rating + "on a scale of one to ten. Why is that?");
  }
);

app.intent('guess',{
    "slots":{"guess":"NUMBER"}
    ,"utterances":["{1-100|guess}"]
  },
  function(req,res) {
    var guesses = (+req.session('guesses'))+1;
    var guess = req.slot('guess');
    var number = +req.session('number');
    if (!guess) {
      res.say("Sorry, I didn't hear a number. The number was "+number);
    }
    else if (guess==number) {
      res.say("Congratulations, you guessed the number in " + guesses + (guesses==1?" try":" tries"));
    }
    else {
      if (guess > number) {
        res.say("Guess lower");
      }
      else if (guess < number) {
        res.say("Guess higher");
      }
      res.reprompt("Sorry, I didn't hear a number. Try again.");
      res.session('guesses',guesses);
      res.shouldEndSession(false);
    }
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
