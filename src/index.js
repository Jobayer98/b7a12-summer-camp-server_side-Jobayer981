const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.PAYMENT_SK);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// const uri = process.env.DB_URI;
const uri = "mongodb://127.0.0.1:27017";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const classCollection = client.db("globalSpeak").collection("classes");
const cartCollection = client.db("globalSpeak").collection("carts");
const paymentsCollection = client.db("globalSpeak").collection("payments");
const instructorCollection = client.db("globalSpeak").collection("instructors");
const adminCollection = client.db("globalSpeak").collection("admins");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("globalSpeak").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

   

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
