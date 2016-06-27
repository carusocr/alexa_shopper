/*
TO-DO in order to get certified:

**1. The skill consistently returns an error when it is launched. 
Please see the following documentation for how to return responses to request sent by Alexa:

https://developer.amazon.com/appsandservices/solutions/alexa/alexa-skills-kit/docs/handling-requests-sent-by-alexa

Example:
User: "Alexa, ask meat seeker to find me the cheapest ribeye steak."
Skill: "There was a problem with the requested skill's response"
Request Identifier: amzn1.echo-api.request.8ccf7041-c9cf-493a-adfb-d439ce1e8ab2

**2.When invoking the “shopIntent” intent with no value provided for the “foodItem” slot, 
the skill returns an error. Please see test case 4.11 from our Submission Checklist  for 
guidance on error handling.

Example:

User: “Alexa open meat seeker"
Skill "Welcome to meatseeker. What are you looking for?"
User "I’m looking for the cheapest"
Skill "There was a problem with the requested skill's response"
Request Identifier: amzn1.echo-api.request.1598ce8d-cfc2-4d0c-be8b-6b9bd600aab6

**3.When users ask for “help” within the skill, it must return a prompt which 
instructs users how to navigate the skill’s core functionality. Additionally, 
the help prompt must end with a question for users and leave the stream open to receive a response. 
Please see test case 4.12 from our Submission Checklist for guidance on the help intent.

Example:
User :”Alexa open meat seeker"
Skill: "Welcome to meatseeker. What are you looking for?"
User: "help"
Skill: “Tell me what you're looking for and I'll seek the lowest price."

**4. The skill does not respond appropriately when users say “stop” or “cancel”. 
Please see test case 4.13 from our Submission Checklist for guidance on skill exiting.

Example:
User :"Alexa open meat seeker"
Skill :"Welcome to meatseeker. What are you looking for?"
User: "stop" /”Cancel”
Skill: "Tell me what you're looking for and I'll seek the lowest price."

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
    response.say("Welcome to meatseeker. What are you looking for?");
    response.shouldEndSession (false, "If you would like to leave, just say exit.");
});

app.intent('shopIntent',
  {
    "slots" :  {"foodItem": "GroceryItem"},
    "utterances": [ "{find me|who is selling|where's|where is|where are|I'm looking for} {the cheapest|a|} {-|foodItem}"]
  },
  function(req,res) {
    var food_target = req.slot('foodItem');
    
    if(food_target === undefined) {
    	res.say("Wot?").send();
    	res.shouldEndSession(false);
    	return false;
    }
    
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
      if(rows.length == 0) {
      	res.say("Sorry, I couldn't find that on sale anywhere. Try asking for something else.").send();
      	res.shouldEndSession(false);
      	return false;
      }
      else{
	    for (var i in rows) {
	      item_list.push(rows[i].item);
	      console.log("Item:", rows[i].item, "\nPrice:", rows[i].price);
	    }
	  }
      
      var clarified_item = rows[0].item;
      if(item_list.length > 1) {
      	// what about if there are two incidences of same item name but also fuzzy names?
      	// e.g. 'sardines','sardines','fresh sardines' ?
      	// Handle this on the backend, with the shopper script only adding cheapest dupe items.
	    item_genre = item_list.toString();
	    res.say("I found more than one result for " + food_target + " . " + item_genre + ". If you meant one of those, just say its name. Otherwise, say 'none of those'.").send();
	    clarified_item = req.slot('foodItem');
	    res.shouldEndSession(false);
	  }
      else {
      	if(rows[0].item == 'none of those'){
      		res.say("Sorry I couldn't help you!").send();
      		res.shouldEndSession(true);
      	}
       	else {
        	var food = rows[0].item;
        	var price = rows[0].price;
        	var store = rows[0].store;
        	res.say("I found " + clarified_item + " for " + price + " at " + store).send();
        }
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

app.intent('errorIntent', function(req,res) {
	res.say("I'm sorry, I didn't understand that.");
});

exports.handler = app.lambda();

if ((process.argv.length === 3) && (process.argv[2] === 'schema')){
  console.log (app.schema ());
  console.log (app.utterances ());
}

con.end(function(err) {
	//Ends gracefully
});
