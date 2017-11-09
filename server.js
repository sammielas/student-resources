var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var STUDENTS_COLLECTION = "students";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// STUDENTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/students"
 *    GET: finds all students
 *    POST: creates a new students
 */

app.get("/students", function(req, res) {
  db.collection(STUDENTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get students.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/students", function(req, res) {
  var newStudent = req.body;
  newStudent.createDate = new Date();

  if (!(req.body.firstName || req.body.lastName)) {
    handleError(res, "Invalid user input", "Must provide a first or last name.", 400);
  }

  db.collection(STUDENTS_COLLECTION).insertOne(newStudent, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new student.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/students/:id"
 *    GET: find students by id
 *    PUT: update students by id
 *    DELETE: deletes students by id
 */

app.get("/students/:id", function(req, res) {
  db.collection(STUDENTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get student");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/students/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(STUDENTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update student");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/students/:id", function(req, res) {
  db.collection(STUDENTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete student");
    } else {
      res.status(204).end();
    }
  });
});