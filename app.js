"use strict";

const sqlite3 = require("sqlite3");



const fs = require("fs");



const db = new sqlite3.Database("sqlite.db");


const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

function pingme(from, message) {
  const accountSid = process.env.accountSid;
  const authToken = process.env.authToken;
  const client = require("twilio")(accountSid, authToken);

  client.messages
    .create({
      body: "you revived a message from",
      messagingServiceSid: process.env.messagingServiceSid,
      to: process.env.phone,
    })
    .then((message) => console.log(message.sid))
    .done();
}

function handleMessage(sender_psid, received_message) {
  let response;

  // Checks if the message contains text
  if (received_message.text) {
    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Is this a Important Message?",
              subtitle: "choose one",
              buttons: [
                {
                  type: "postback",
                  title: "Yes!",
                  payload: "yes",
                },
                {
                  type: "postback",
                  title: "No!",
                  payload: "no",
                },
              ],
            },
          ],
        },
      },
    };
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = { text: "Will look at and Respond To you as soon as possible." };
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  console.log("Handelling Post Back");
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === "yes") {
    response = {
      text: "Will notify him about the message . Please Hang tight and wait few minutes before He comes Back Online if he finds this message needs a quick response.",
    };
    //pingme();
  } else if (payload === "no") {
    response = {
      text: "Okay then the message will be responded as soon as he is online.",
    };
  }
  callSendAPI(sender_psid, response);
}

function userHandler(sender_psid, response,typ) { }


function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
  request(
    {
      uri: "https://ember-joyous-llama.glitch.me/user?name=user1201",
      method: "GET",
    },
    (err, res, body) => {
      if (err) {
        console.log("Can't retrive Profile Data");
      } else {
        let myString = body.name;
        if (myString != undefined){
          console.log(body);
        }
        db.get(`SELECT * FROM myTable WHERE text = '${myString}'`, (err, row) => {
          if (err) {
            console.log("DB Access Error")
          }

    if (row) {
      console.log(`This user '${myString}' exists in the database.`);
      console.log('From caller',row);
      userHandler(sender_psid, response,1);
    } else {
      console.log(`This user '${myString}' does not exist in the database.`);
      userHandler(sender_psid, response,0);
    }
  });
        }
    }
  );
}

app.post("/webhook", (req, res) => {
  let body = req.body;
  if (body.object === "page") {
    body.entry.forEach(function (entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.verify;
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.get("/hell", (req, res) => {
  const VERIFY_TOKEN = process.env.hell;
  let token = req.query["hell"];
  if (token) {
    if (token === VERIFY_TOKEN) {
      console.log("hellcalling");
      res.status(200).send("Hello Their");
    } else {
      res.sendStatus(403);
    }
  }
});


app.get("/user", (req, res) => {
  let user = req.query["name"];
  db.get(`SELECT * FROM myTable WHERE text = '${user}'`, (err, row) => {
  if (err) {
    console.log(err,row,db)
  }

  if (row) {
    console.log(row.name)
    res.status(200).json(row);
  } else {
    // The string does not exist in the database
    res.status(200).send(`The string '${user}' does not exist in the database.`);
  }
});

// Close the database connection

  //res.status(200).send("Hello Their");

});



app.get("/", (req, res) => {
  res.status(200).send("Well Well Look Who is here!");
});

app.get("/privacy-policy", (req, res) => {
  fs.readFile("README.md", "utf8", (err, data) => {
    if (err) {
      // handle error
      return;
    }

    res.send(data);
  });
});


app.get("/test",(req,res)=>{
  request(
    {
      uri: "https://ember-joyous-llama.glitch.me/user?name=user1201",
      method: "GET",
    },
    (err, res2, body) => {
      if (err) {
        console.log("Can't retrive Profile Data");
      } else {
        res.status(200).send(body)
        let myString = 'user1201';
        db.get(`SELECT * FROM myTable WHERE text = '${myString}'`, (err, row) => {
          if (err) {
            console.log("DB Access Error")
          }

    if (row) {
      console.log(`This user '${myString}' exists in the database.`);
      console.log('From caller',row);
    } else {
      console.log(`This user '${myString}' does not exist in the database.`);
    }
  });
        }
    }
  );
  
})