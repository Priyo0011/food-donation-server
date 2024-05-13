const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 9000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174","https://food-donation-3460d.web.app"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "unauthorized access" });
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: "unauthorized access" });
      }
      console.log(decoded);

      req.user = decoded;
      next();
    });
  }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.32bwvbv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const foodsDonation = client.db("foodDoner").collection("foods");
    const requestFood = client.db("foodDoner").collection("requests");

    // jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    app.get("/foods", async (req, res) => {
      const result = await foodsDonation.find().toArray();
      res.send(result);
    });
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsDonation.findOne(query);
      res.send(result);
    });

    app.post("/request", async (req, res) => {
      const requestData = req.body;
      const result = await requestFood.insertOne(requestData);
      res.send(result);
    });
    app.post("/food", async (req, res) => {
      const foodData = req.body;
      const result = await foodsDonation.insertOne(foodData);
      res.send(result);
    });
    app.get("/foods/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "donator.email": email };
      const result = await foodsDonation.find(query).toArray();
      res.send(result);
    });
    app.delete("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsDonation.deleteOne(query);
      res.send(result);
    });

    app.put("/food/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const foodData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...foodData,
        },
      };
      const result = await foodsDonation.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.get("/request/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await requestFood.find(query).toArray();
      res.send(result);
    });

    app.get("/all-foods", async (req, res) => {
      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page) -1;
      const sort = req.query.sort;
      const search = req.query.search;


      let query = {
        food_name: { $regex: search, $options: "i" },
      };
    
      let options = {};
      if (sort) options = { sort: { expire: sort === "asc" ? 1 : -1 } };
      const result = await foodsDonation
        .find(query,options)
        .skip(page * size)
        .limit(size)
        .toArray();

      res.send(result);
    });

    app.get("/foods-count", async (req, res) => {
      const search = req.query.search
      let query = {
        food_name : { $regex: search, $options: 'i' },
      }
      const count = await foodsDonation.countDocuments(query);
      
      res.send({ count });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
