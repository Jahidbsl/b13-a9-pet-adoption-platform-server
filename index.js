const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { jwtVerify, createRemoteJWKSet } = require("jose-cjs");

const uri = process.env.MONGO_URI;

const app = express();
const port = process.env.PORT;
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URI));
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;


  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).send({ message: "Unauthorized" });
    }
try{
const {payload} = await jwtVerify(token,JWKS)
 req.user = payload;
console.log(payload, "from verify token middleware");
next();
}catch(error){
return res.status(403).send({ message: "Forbidden" });
}

 
};

async function run() {

  await client.connect();
  try {
  
    // ************ Database and Collection Creation **************
    const database = client.db("pet-blossom");
    const petsCollection = database.collection("pets");
    const adoptionCollection = database.collection("adoptions");
    // 
    //add pet API
app.post("/add-pet",verifyToken, async (req, res) => {
  try {
    const petData = req.body;

    console.log(petData, "from add pet API");

    const result = await petsCollection.insertOne(petData);

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});
// get pet by userId API
app.get("/pets/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const pets = await petsCollection.find({ userId: userId }).toArray();
    res.send(pets);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});

// get all pets API
app.get("/pets", async (req, res) => {
  try {
    const { search, species } = req.query;

    let query = {};

    // search by pet name using $regex
    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    // filter by species using $in
    if (species) {
      query.species = {
        $in: species.split(","),
      };
    }

    const pets = await petsCollection
      .find(query)
      .toArray();

    res.send(pets);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Server error",
    });
  }
});

// get single pet by id
app.get("/pets/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    const pet = await petsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!pet) {
      return res.status(404).send({
        message: "Pet not found",
      });
    }

    res.send(pet);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Server error",
    });
  }
});
// update pet API
app.patch("/pets/:id",verifyToken, async (req, res) => {
  try {
    const petId = req.params.id;
    const updateData = req.body;

    const result = await petsCollection.updateOne(
      { _id: new ObjectId(petId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Pet not found" });
    }

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});
// delete pet API
app.delete("/pets/:id",verifyToken, async (req, res) => {
  try {
    const petId = req.params.id;

    const result = await petsCollection.deleteOne({ _id: new ObjectId(petId) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Pet not found" });
    }

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});
// adoption API
app.post("/adopt",verifyToken, async (req, res) => {
  try {
    const adoptionData = req.body;

    console.log(adoptionData, "from adopt API");

    const result = await adoptionCollection.insertOne(adoptionData);

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});
// get all adoptions API
app.get("/adoptions", async (req, res) => {
  try {
    const adoptions = await adoptionCollection.find({}).toArray();
    res.send(adoptions);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});
app.get("/adoptions/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await adoptionCollection
      .find({ userId })
      .toArray();

    res.send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Server error",
    });
  }
});
// get adoption requests by petId
app.get("/adoptions/pet/:petId", async (req, res) => {
  try {
    const { petId } = req.params;

    const result = await adoptionCollection.find({ petId }).toArray();

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});

// update adoption status
app.patch("/adoptions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const result = await adoptionCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});
// cencel adoption API
app.delete("/adoptions/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await adoptionCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Adoption not found" });
    }

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error" });
  }
});
app.get("/adoptions/check", async (req, res) => {
  const { petId, userId } = req.query;

if (!petId || !userId) {
  return res.status(400).send({ message: "Missing params" });
}

  const exists = await adoptionCollection.findOne({
    petId,
    userId,
  });

  res.send({ exists: !!exists });
});

    // ********end of Database and Collection Creation **************


    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

