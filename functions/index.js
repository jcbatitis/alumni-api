const isEmpty = require('lodash/isEmpty');

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const requireAuthentication = require("./authMiddleware");
const user = express();
const transcript = express();

const admin = require("firebase-admin");

admin.initializeApp();
user.use(
  cors({
    origin: [
      "https://alumni-management-87648.web.app",
      "http://localhost:4200",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

transcript.use(
  cors({
    origin: [
      "https://alumni-management-87648.web.app",
      "http://localhost:4200",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// USER - GETS LISTS OF USERS
user.get("/GetAllUsers", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Users").get();

    let users = [];
    snapshot.forEach((doc) => {
      let id = doc.id;
      let data = doc.data();

      users.push({ id, ...data });
    });

    res.status(200).send(JSON.stringify(users));
  } catch (error) {
    res.status(500).send("Error getting users.");
  }
});

// USER - GET USER BY ID
user.get("/GetUserById/:id", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("Users")
      .doc(req.params.id)
      .get();

    const response = snapshot.data();

    if (isEmpty(response) || response.role === 'admin') {
      res.status(500).send("Error getting user details.");
      return;
    }

    res.status(200).send({ ...response });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting user details.");
  }
});

// USER - GET USER BY EMAIL
user.get("/GetUserByEmail/:email", requireAuthentication, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Users").get();

    let users = [];
    snapshot.forEach((doc) => {
      let id = doc.id;
      let data = doc.data();

      users.push({ id, ...data });
    });

    const response = users.find((user) => user.email === req.params.email);
    res.status(200).send({ ...response });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting user details.");
  }
});

// USER - CREATES NEW USER
user.post("/CreateUser", async (req, res) => {
  try {
    const user = req.body;
    const reference = await admin
      .firestore()
      .collection("Users")
      .doc(req.body.student_id)
      .set(user);

    const snapshot = await admin
      .firestore()
      .collection("Users")
      .doc(req.body.student_id)
      .get();

    const response = snapshot.data();
    res.status(200).send({ id: reference.id, ...response });
  } catch (error) {
    res.status(500).send("Error creating user.");
  }
});

user.post("/CheckUserSession", async (req, res) => {
  const token = req.headers.authorization.split("Bearer ")[1];
  return admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      const email = decodedToken.email;
      res.status(200).send({ status: "OK", email: email });
    })
    .catch((err) => res.status(403).send({ status: "UNAUTHORISED" }));
});

// TRANSCRIPT - CREATES NEW TRANSCRIPT
transcript.post("/CreateTranscript", async (req, res) => {
  try {
    const transcript = req.body;
    await admin
      .firestore()
      .collection("Transcripts")
      .doc(req.body.student_id)
      .set(transcript);

    const snapshot = await admin
      .firestore()
      .collection("Transcripts")
      .doc(req.body.student_id)
      .get();

    const response = snapshot.data();
    res.status(200).send({ ...response });
  } catch (error) {
    res.status(500).send("Error creating transcript.");
  }
});

transcript.get("/GetTranscriptById/:id", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("Transcripts")
      .doc(req.params.id)
      .get();

    const response = snapshot.data();
    res.status(200).send({ ...response });
  } catch (error) {
    res.status(500).send("Error getting transcripts.");
  }
});

exports.User = functions.https.onRequest(user);
exports.Transcript = functions.https.onRequest(transcript);
