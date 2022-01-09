const express = require("express");

// recordRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const recordRoutes = express.Router();
var bigInt = require("big-integer");

// This will help us connect to the database
const dbo = require("../db/conn");

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

recordRoutes.route("/ping").get(function (req, res) {
  res.json({success:"successfully connect!"});
});

// This section will help you get a list of all the records.
recordRoutes.route("/getCoinList").get(function (req, res) {
  let db_connect = dbo.getDb("");
  console.log(req.query);
  let page_num = parseInt(req.query.count_per_page);
  let start_num = parseInt(req.query.page_num) * parseInt(req.query.count_per_page);
  console.log("fetching from ", start_num, " ", page_num);
  res.json({called:"ssss"});
  return;
  db_connect
    .collection("lptoken")
    .find({})
    .skip(start_num)
    .limit(page_num)
    .toArray(function (err, result) {
      if (err) throw err;
      let finalAry=[];
      let aryIndex = 0;
      for(i=0; i<result.length; i++) {
        for(j=0; j<result[i].holders.length; j++) {
          let lpLockAmount = bigInt(result[i].holders[j].amount).divide(1000000000000000000);
          let initialAmount = bigInt(result[i].holders[j].initialAmount).divide(1000000000000000000);
          let tokenBalance1 = bigInt(result[i].tokenBalance1).divide(1000000000000000000);
          let tokenBalance2 = bigInt(result[i].tokenBalance2).divide(1000000000000000000);
          let remainLength = parseInt((result[i].holders[j].unlockDate - Date.now()/1000) / 3600 / 24);
          finalAry[aryIndex++] = {
            tokenName : result[i].tokenSymbol1,
            chainName : "Ether",
            lpLockAmount : lpLockAmount,
            initialAmount : initialAmount,
            tokenBalance : tokenBalance1,
            remainLength : remainLength,
            lockerDex : "Unicrypt",
            marketcap : "***",
            coingeckoRank : "###",
            score : "---"  
          };
          finalAry[aryIndex++] = {
            tokenName : result[i].tokenSymbol2,
            chainName : "Ether",
            lpLockAmount : lpLockAmount,
            initialAmount : initialAmount,
            tokenBalance : tokenBalance2,
            remainLength : remainLength,
            lockerDex : "Unicrypt",
            marketcap : "***",
            coingeckoRank : "###",
            score : "---"  
          };
        }
      }
      res.json(finalAry);
    });
});

// This section will help you get a list of all the records.
recordRoutes.route("/record").get(function (req, res) {
  let db_connect = dbo.getDb("employees");
  db_connect
    .collection("records")
    .find({})
    .toArray(function (err, result) {
      if (err) throw err;
      res.json(result);
    });
});

// This section will help you get a single record by id
recordRoutes.route("/record/:id").get(function (req, res) {
  let db_connect = dbo.getDb();
  let myquery = { _id: ObjectId( req.params.id )};
  db_connect
      .collection("records")
      .findOne(myquery, function (err, result) {
        if (err) throw err;
        res.json(result);
      });
});

// This section will help you create a new record.
recordRoutes.route("/record/add").post(function (req, response) {
  let db_connect = dbo.getDb();
  let myobj = {
    person_name: req.body.person_name,
    person_position: req.body.person_position,
    person_level: req.body.person_level,
  };
  db_connect.collection("records").insertOne(myobj, function (err, res) {
    if (err) throw err;
    response.json(res);
  });
});

// This section will help you update a record by id.
recordRoutes.route("/update/:id").post(function (req, response) {
  let db_connect = dbo.getDb();
  let myquery = { _id: ObjectId( req.params.id )};
  let newvalues = {
    $set: {
      person_name: req.body.person_name,
      person_position: req.body.person_position,
      person_level: req.body.person_level,
    },
  };
  db_connect
    .collection("records")
    .updateOne(myquery, newvalues, function (err, res) {
      if (err) throw err;
      console.log("1 document updated");
      response.json(res);
    });
});

// This section will help you delete a record
recordRoutes.route("/:id").delete((req, response) => {
  let db_connect = dbo.getDb();
  let myquery = { _id: ObjectId( req.params.id )};
  db_connect.collection("records").deleteOne(myquery, function (err, obj) {
    if (err) throw err;
    console.log("1 document deleted");
    response.status(obj);
  });
});

module.exports = recordRoutes;
