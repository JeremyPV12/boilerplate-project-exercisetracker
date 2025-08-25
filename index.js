const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose')
const schema33 = mongoose.Schema;
const bodyParser = require('body-parser'); 
const e = require('express')

app.use(bodyParser.urlencoded({extended:true}))
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true, useUnifiedTopology:true});

const userSchema = new schema33({
  username : {
    type : String, required : true
  }
});


const exerciseSchema = new schema33({
  username : String,
  date : {type:Date, default: Date.now},
  duration : Number,
  description : String
})

const User = mongoose.model('User',userSchema)
const Exercise = mongoose.model('Exercice',exerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const createAndSaveUser = async (username) => {
  var newUser = new User({username});
  const data = newUser.save();
  return data;
}

const createAndExercise = async (_id,description,duration,date) => {
  var foundUser = await User.findById(_id);
  if(!foundUser) throw new Error("User not found");
  const newExercise = new Exercise({
    username : foundUser.username,
    description,
    duration,
    date : date ? new Date(date) : new Date()
  })
  const save = await newExercise.save();
  return save
}

app.get('/api/users',async(req,res)=>{
  try {
    const data = await User.find({});
    res.json(data)
  } catch (error) {
    res.json(error)
  }
})


app.post('/api/users',async(req,res)=>{
  try {
    const data = await createAndSaveUser(req.body.username);
    res.json({_id:data._id,username:data.username})
  } catch (error) {
    res.json(error)
  }
})


app.post('/api/users/:_id/exercises', async(req,res)=>{
  try {
    const {_id} = req.params;
    const {description,duration,date} = req.body;
    const data = await createAndExercise(_id,description,duration,date);
    const newDate = data.date.toDateString();
    res.json({_id,username:data.username,description:data.description,duration:data.duration,date:newDate})
  } catch (error) {
    res.json(error)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);
    if (!user) throw new Error("User not found");
    const { username } = user;

    // Construimos la query
    const query = { username };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    // Ejecutamos la consulta con límite
    const data = await Exercise.find(query).limit(limit ? parseInt(limit) : 0);

    const count = data.length;

    const newData = data.map(x => ({
      ...x._doc,
      date: x.date.toDateString()
    }));

    res.json({ _id, username, count, log: newData });
  } catch (error) {
    res.json({ error: error.message });
  }
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
