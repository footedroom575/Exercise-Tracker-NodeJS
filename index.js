const express = require('express')
const app = express()
const cors = require('cors')
let mongoose = require("mongoose")
require('dotenv').config()
let bodyParser = require("body-parser")

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended : false}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  }
}, {
  collection: "users",
  versionKey: false
})

let exerciseSchema = new mongoose.Schema({
  userId : {type: String, required: true, unique: false},
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String
  }, 
  username : {
    type: String
  }
}, {
  collection: "exercises",
  versionKey: false
})


let User = mongoose.model("User", userSchema)
let Exercise = mongoose.model("Exercise", exerciseSchema)

function addUser(user, res) {
    let u = new User({
      username: user
    })

    u.save(function (err, data) {
      

      if (err){

        // output(err, data)
        res.json({error: err})
      } else {
        // output(err, data)
        res.json(data)
      }
      
    })
}

function output(err, msg){
  if (err)
    console.error(err, "----from output()")
  else
    console.log(msg, "----s from output()")
}

app.get("/api/users/", (req, res)=>{
  User.find({}, function(err, users) {
    var userMap = [];

    users.forEach(function(user) {
      userMap.push(user);
    });

    res.send(userMap);  
  });
})

app.post("/api/users", (req, res)=>{
  let uname = req.body.username

  addUser(uname, res)
})


app.post("/api/users/:_id/exercises", (req, res)=>{
  let d_temp;
  if (req.body.date)
    d_temp = new Date(req.body.date).toDateString()
  else
    d_temp = new Date().toDateString()

  let user = "";
  User.findById(req.params._id, (err, data)=>{
    if (err)
      console.error(err, " User not found")
    else {
      user = data
      let exercise = new Exercise({
        userId : req.params._id,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: d_temp,
        username: user.username
      })
    
      exercise.save(function (err, data) {
        data.username = user.username
        data._id = data["userId"]
        data["userId"] = undefined
        delete data["userId"]
    
        if (err){
          // output(err, data)
          res.json({error: err})
        } else {
          res.json(data)
        }
      })
    }
  })
})

function isValidDate(from, to, date){
  from = new Date(from).getTime()
  to = new Date(to).getTime()
  date = new Date(date).getTime()
  
  if (date >= from && date <= to){
    return true
  } else {
    return false;
  }
}


let findAllExercisesLog =  (filter, userData, to, form)=>{

  let shouldCheck = false
  shouldCheck = (!to || !from)? false: true

  return new Promise(function(resolve, reject) {
    // "Producing Code" (May take some time)
    Exercise.find(filter, (err, data)=>{
      if (err){
        reject("Error getting exercises")
      } else {
        let result = {}
        result.count = data.length
        result.username = userData.username
        result._id = userData._id

        function temp_obj(description, duration, dated){
          this.description =  description
          this.duration =  duration
          this.date =  new Date(dated).toDateString()
        }
        result.logs = data.reduce((all, ex)=>{
          if ( shouldCheck && isValidDate(from, to, ex.date) ){
            let temp = new temp_obj(ex.description, ex.duration, ex.date)
            all.push(temp)
          } else {
            let temp = new temp_obj(ex.description, ex.duration, ex.date)
            all.push(temp)
          }
          return all
        }, [])

    resolve(result); // when successful
  }})
})}
  
app.get("/api/users/:_id/logs", (req, res)=>{

  User.findById(req.params._id, (err, userData)=>{
    if (err)
      res.json("Error getting users!")
    else {
      findAllExercisesLog({userId: req.params._id}, userData, req.params.to, req.params.from)
      .then((log, err)=>{
        if (err)
          res.json(err)
        else {
          res.json(log)
        }
      })
    }
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
