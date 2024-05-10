const express = require("express");
const cors = require("cors");
require('dotenv').config()
const port = process.env.PORT || 9000;
const app = express();



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



app.get("/", (req, res) => {
    res.send("food donation is running.....");
  });
  
  app.listen(port, () => {
    console.log(`Food Donation Server is running on port ${port}`);
  });