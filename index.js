var alexa = require('alexa-app');
var mysql = require('mysql');
var iniparser = require('iniparser')
var config = iniparser.parseSync('db.ini')
console.log(config.user);
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

con.query('select mood from moodchecker',function (err, rows){
	if(err) throw err;

	console.log(rows[0].mood);
});

// Define an alexa-app
var app = new alexa.app('moodchecker');

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
    res.say("Rate how you're feeling by saying a number between one and ten. That's all I do for now.");
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
console.log (app.schema());

con.end(function(err) {
	//Ends gracefully
});
