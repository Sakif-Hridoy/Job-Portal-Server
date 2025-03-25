import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import cookieParser from "cookie-parser";
const app = express();
const port = process.env.PORT || 5000;

dotenv.config();

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());

app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.djg6r.mongodb.net/?appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobsCollection = client.db("job-portal").collection("jobs");
    const jobApplicationsCollection = client
      .db("job-portal")
      .collection("job-applications");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = await jwt.sign(user, process.env.JWT_SECRET,{
        expiresIn: "5h",
      });
      res
        .cookie("token",token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.get("/job-applications", async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobApplicationsCollection.find(query).toArray();
      console.log('cookies',req.cookies)
      for (const application of result) {
        // console.log(application.job_id)
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await jobsCollection.findOne(query1);
        if (job) {
          application.company = job.company;
          application.jobType = job.jobType;
          application.company_logo = job.company_logo;
          application.title = job.title;
          application.category = job.category;
        }
      }
      res.send(result);
    });

    app.post("/job-application", async (req, res) => {
      const newApplication = req.body;
      const result = await jobApplicationsCollection.insertOne(newApplication);

      const id = newApplication.job_id;
      const query2 = { _id: new ObjectId(id) };
      const jobApplication = await jobsCollection.findOne(query2);
      // console.log(jobApplication)
      let newCount = 0;

      if (jobApplication.applicationCount) {
        newCount = jobApplication.applicationCount + 1;
      } else {
        newCount = 1;
      }
      const filter = { _id: new ObjectId(id) };
      const updatedJob = {
        $set: {
          applicationCount: newCount,
        },
      };
      const updateResult = await jobsCollection.updateOne(filter, updatedJob);
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
      console.log(result);
    });

    app.get("/job-applications/jobs/:job_id", async (req, res) => {
      const jobId = req.params.job_id;
      console.log(jobId);
      const query = { job_id: jobId };
      const result = await jobApplicationsCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/job-applications/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await jobApplicationsCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

app.get("/", async (req, res) => {
  res.send("Hello Express");
});
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is Running on ${port}`);
});
