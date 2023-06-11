const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.PAYMENT_SK);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.jk7pgvw.mongodb.net/?retryWrites=true&w=majority`;
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
const userCollection = client.db("globalSpeak").collection("users");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("globalSpeak").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // all course route
    app.get("/allcourses", async (req, res) => {
      const query = { status: "approved" };
      const result = await classCollection.find(query).toArray();

      if (result.length < 1) {
        return res.status(404).send();
      }

      res.send(result);
    });
    // all course route
    app.get("/courses", async (req, res) => {
      const result = await classCollection.find().toArray();

      if (result.length < 1) {
        return res.status(404).send();
      }

      res.send(result);
    });

    app.patch("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.query.status;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: status,
        },
      };

      const result = await classCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // instructor routes
    app.get("/instructors", async (req, res) => {
      const result = await instructorCollection.find().toArray();

      if (result.length < 1) {
        return res.status(404).send();
      }

      res.send(result);
    });

    // instructor classes
    app.get("/myclasses", async (req, res) => {
      const query = req.query;
      const result = await classCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/myclasses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.findOne(query);
      res.send(result);
    });

    // update instructor class
    app.put("/myclasses/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const value = req.body;
      const options = { upsert: true };
      const updateValue = {
        $set: {
          name: value.name,
          email: value.email,
          instructorName: value.instructorName,
          image: value.image,
          availableSeats: value.availableSeats,
          price: value.price,
        },
      };
      const result = await classCollection.updateOne(
        filter,
        updateValue,
        options
      );
      res.send(result);
    });

    app.post("/add-class", async (req, res) => {
      const query = req.body;
      query.status = "pending";
      const result = await classCollection.insertOne(query);

      res.send(result);
    });

    // cart routes
    app.get("/cart", async (req, res) => {
      const email = req.query.email;

      const filter = { email: email };

      if (!email) {
        return res.status(400).send();
      }
      const result = await cartCollection.find(filter).toArray();

      if (result.length < 1) {
        return res.status(404).send();
      }
      res.send(result);
    });

    app.post("/cart", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const result = await cartCollection.insertOne(data);

      res.send(result);
    });

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);

      res.send(result);
    });

    // payments route
    // create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price) * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const data = req.body;
      const result = await paymentsCollection.insertOne(data);

      const query = {
        _id: { $in: data.cartItems.map((id) => new ObjectId(id)) },
      };
      console.log(query);
      const deleteResult = await cartCollection.deleteMany(query);

      res.send({ result, deleteResult });
    });
    app.get("/payments", async (req, res) => {
      const data = req.body;
      const result = await paymentsCollection.insertOne(data);

      res.send(result);
    });

    // users route
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExist = await userCollection.findOne(query);

      if (!isExist) {
        return res.send({ message: "user already exist" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const result = await userCollection.findOne(query);

      res.send(result);
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
