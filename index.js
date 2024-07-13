require("dotenv").config();
const config = require("./config");
const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const pino = require("express-pino-logger")();
const { chatToken, videoToken, voiceToken } = require("./tokens");
const { VoiceResponse } = require("twilio").twiml;
const db = require('./db');
const Data2 = require('./schema');
const twilio = require('twilio');
const client = twilio(config.twilio.accountSid, config.twilio.authToken);

const request = require('request');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(pino);
app.use(cors());


const sendTokenResponse = (token, res) => {
  console.log('token ----->', token.toJwt())
  res.set("Content-Type", "application/json");
  res.send(
    JSON.stringify({
      token: token.toJwt()
    })
  );
};

app.get('/debug', (req, res) => {
  const fs = require('fs');
  fs.readdir(path.join(__dirname, 'build'), (err, files) => {
    if (err) {
      res.status(500).send('Unable to scan directory: ' + err);
    } else {
      res.status(200).send(files);
    }
  });
});

app.get("/api/greeting", (req, res) => {
  const name = req.query.name || "World";
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

app.get("/chat/token", (req, res) => {
  console.log("/chat/token")
  const identity = req.query.identity;
  const token = chatToken(identity, config);
  sendTokenResponse(token, res);
});

app.post("/chat/token", (req, res) => {
  const identity = req.body.identity;
  const token = chatToken(identity, config);
  sendTokenResponse(token, res);
});

app.get("/video/token", (req, res) => {
  console.log("/video/token")
  const identity = req.query.identity;
  const room = req.query.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);
});

app.post("/video/token", (req, res) => {
  const identity = req.body.identity;
  const room = req.body.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);
});

app.get("/voice/token", (req, res) => {
  console.log("/voice/token")
  const identity = req.query.identity;
  const token = voiceToken(identity, config);
  sendTokenResponse(token, res);
});

app.post("/voice/token", (req, res) => {
  const identity = req.body.identity;
  const token = voiceToken(identity, config);
  sendTokenResponse(token, res);
});

app.post("/voice", (req, res) => {
  console.log('voice')
  const To = req.body.To;
  const timeoutDuration = 600;
  const response = new VoiceResponse();
  const dial = response.dial({ callerId: config.twilio.callerId, record: "record-from-answer", timeout: timeoutDuration });

  dial.number({
    byoc: 'BY8b044781cdac235b3a2d4f86da28b918'
  }, To);

  res.set("Content-Type", "text/xml");
  res.send(response.toString());
});

app.post("/voice/incoming", (req, res) => {
  console.log("/voice/incoming")
  const response = new VoiceResponse();
  const dial = response.dial({ callerId: req.body.From, answerOnBridge: true });
  dial.client("hamza");
  res.set("Content-Type", "text/xml");
  res.send(response.toString());
});

app.get("/call-logs", async (req, res) => {
  console.log("call-logs")
  try {
    const { from, to, limit } = req.query;
    const filterOptions = {
      direction: 'outbound-api',
    };
    if (from) {
      filterOptions.from = from;
    }
    if (to) {
      filterOptions.to = to;
    }

    const calls = await client.calls.list({
      limit: limit || 20,
      ...filterOptions,
    });

    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/call-recordings", async (req, res) => {
  console.log("/call-recordings")
  let recordings = [];
  try {
    const { callId } = req.query;
    recordings = await client.recordings.list({ callSid: callId, limit: 20 });
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json(recordings);
});

app.get('/download-recording/:recordingSid', (req, res) => {
  const recordingSid = req.params.recordingSid;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Recordings/${recordingSid}`;
  const auth = {
    'user': config.twilio.accountSid,
    'pass': config.twilio.authToken
  };
  res.setHeader('Content-Disposition', `attachment; filename=recording-${recordingSid}.mp3`);
  res.setHeader('Content-Type', 'audio/mp3');
  request.get(url, { 'auth': auth }).pipe(res);
});

app.post('/api/test/contacts', (req, res) => {
  const Contact = mongoose.model('contacts')

  Contact.create({
    name: 'prueba desde postman',
  }).then(newContact => {
    res.status(201).json(newContact);
  }).catch(error => {
    res.status(400).json({ message: error.message });
  });

});

// CRUD API Endpoints
/*
app.get('/api/contacts', async (req, res) => {
  console.log('contacts')
  try {
    const contacts = await Data2.find();
    console.log(contacts);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  console.log('contacts post')
  const contact = new Data2(req.body);
  try {
    const newContact = await contact.save();
    res.status(201).json(newContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/contacts/:id', async (req, res) => {
  console.log('contacts get id')
  try {
    const contact = await Data2.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/contacts/:id', async (req, res) => {
  console.log(req.body)
  try {
    const contact = await Data2.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  console.log('contacts delete id')
  try {
    const contact = await Data2.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
*/
app.listen(process.env.PORT || 3001, () =>
  console.log(`Express server is running on port ${process.env.PORT || 3001}`)
);