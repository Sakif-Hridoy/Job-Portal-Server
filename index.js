import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb"
const app = express();
const port = process.env.PORT || 5000;

dotenv.config();

app.use(express.json());
app.use(cors())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.djg6r.mongodb.net/?appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobsCollection = client.db("job-portal").collection("jobs");
    const jobApplicationsCollection = client.db("job-portal").collection('job-applications')


    app.get("/jobs",async(req,res)=>{
        const cursor = jobsCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })

    app.get("/jobs/:id",async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await jobsCollection.findOne(query);
        res.send(result)
      
    })

    app.get('/job-applications',async(req,res)=>{
      const email = req.query.email;
      const query = {applicant_email:email};
      const result = await jobApplicationsCollection.find(query).toArray();
      res.send(result)
    })

    app.post("/job-application",async(req,res)=>{
      const newApplication = req.body;
      const result = await jobApplicationsCollection.insertOne(newApplication);
      res.send(result);
      console.log(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`Server is Running on ${port}`)
})