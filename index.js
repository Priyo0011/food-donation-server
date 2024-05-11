const express = require("express");
const cors = require("cors");
require('dotenv').config()
const port = process.env.PORT || 9000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    credentials: true,
    optionSuccessStatus: 200,
  }
app.use(cors(corsOptions));
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.32bwvbv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const foodsDonation = client.db('foodDoner').collection('foods')
    const requestFood = client.db('foodDoner').collection('requests')

    app.get('/foods',async(req,res)=>{
        const result =await foodsDonation.find().toArray()
        res.send(result)
    })
    app.get('/food/:id',async(req,res)=>{
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodsDonation.findOne(query)
      res.send(result)
    })

    // request food
    app.post('/request',async(req,res)=>{
      const requestData =req.body
      const result = await requestFood.insertOne(requestData)
      res.send(result)
    })
    app.post('/food',async(req,res)=>{
      const foodData =req.body
      const result = await foodsDonation.insertOne(foodData)
      res.send(result)
    })
    app.get('/foods/:email', async (req, res) => {
      const email = req.params.email
      const query = { 'donator.email': email }
      const result = await foodsDonation.find(query).toArray()
      res.send(result)
    })
    app.delete('/food/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodsDonation.deleteOne(query)
      res.send(result)
    })

    app.put('/Food/:id', async (req, res) => {
      const id = req.params.id
      const foodData = req.body
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          ...foodData,
        },
      }
      const result = await foodsDonation.updateOne(query, updateDoc, options)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);





app.get("/", (req, res) => {
    res.send("food donation is running.....");
  });
  
  app.listen(port, () => {
    console.log(`Food Donation Server is running on port ${port}`);
  });