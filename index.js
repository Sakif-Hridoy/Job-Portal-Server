import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import cookieParser from "cookie-parser";
const app = express();
const port = process.env.PORT || 5000;

dotenv.config();

app.use(
  cors({
    origin: [
      "https://extraordinary-nougat-7831ff.netlify.app", // Netlify domain
      "http://localhost:5173", // Localhost development
      "http://localhost:5174", // Localhost development
    ],
    credentials: true,
    allowedHeaders: ["x-api-key", "Content-Type", "Authorization"], // Ensure x-api-key is allowed
  })
);

// Middleware to set security-related HTTP headers
app.use((req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains"); // Enforces HTTPS
  res.setHeader("X-Content-Type-Options", "nosniff"); // Prevent MIME type sniffing
  res.setHeader("X-Frame-Options", "DENY"); // Prevent clickjacking
  res.setHeader("X-XSS-Protection", "1; mode=block"); // Enable XSS filter
  next();
});

app.use(express.json());
app.use(cookieParser());

// jwt verify middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log("verify token", token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.user = decoded;
    next(); // Pass control to the next middleware or route handler
  });
};

// x-api-key verify middleware
const verifyApiKey = (req, res, next) => {
  const apiKey = req?.headers?.["x-api-key"];
  console.log(apiKey);

  if (!apiKey) {
    return res.status(401).json({ message: "API Key Missing" });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: "Invalid API Key" });
  }

  next();
};

// MongoDB connection string
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
    await client.connect();

    // Database and collections
    const jobsCollection = client.db("job-portal").collection("jobs");
    const jobApplicationsCollection = client.db("job-portal").collection("job-applications");

    // JWT login endpoint
    app.post("/jwt", verifyApiKey, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "5h",
      });
      console.log("JWT Token Created: ", token);
      res
        .cookie("token", token, {
          httpOnly: true, // Prevents JavaScript from accessing the cookie
          secure: true,  // Use true only in production (HTTPS)
          sameSite: "Strict", // Prevents cross-site request forgery
        })
        .send({ success: true });
    });

    // Logout (Clear cookie)
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: true,  // Use true in production (HTTPS)
          sameSite: "Strict",
        })
        .send({ success: true });
    });

    // All jobs route
    app.get("/jobs", async (req, res) => {
      const email = req?.query?.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get a single job
    app.get("/jobs/:id", async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // Get all job applications by token and user email verification
    app.get("/job-applications", verifyToken, verifyApiKey, async (req, res) => {
      const email = req.query.email;
      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const query = { applicant_email: email };
      const result = await jobApplicationsCollection.find(query).toArray();
      for (const application of result) {
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

    // Post a job application
    app.post("/job-application", verifyToken, verifyApiKey, async (req, res) => {
      const newApplication = req?.body;
      const result = await jobApplicationsCollection.insertOne(newApplication);
      const id = newApplication.job_id;
      const query2 = { _id: new ObjectId(id) };
      const jobApplication = await jobsCollection.findOne(query2);
      let newCount = jobApplication.applicationCount ? jobApplication.applicationCount + 1 : 1;
      const filter = { _id: new ObjectId(id) };
      const updatedJob = {
        $set: {
          applicationCount: newCount,
        },
      };
      await jobsCollection.updateOne(filter, updatedJob);
      res.send(result);
    });

    // Post a job by recruiter
    app.post("/job", verifyApiKey, verifyToken, async (req, res) => {
      const newJob = req?.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    // Get job applications by user job_id
    app.get("/job-applications/jobs/:job_id", async (req, res) => {
      const jobId = req?.params?.job_id;
      const query = { job_id: jobId };
      const result = await jobApplicationsCollection.find(query).toArray();
      res.send(result);
    });

    // Update a job application
    app.patch("/job-applications/:id", async (req, res) => {
      const id = req?.params?.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await jobApplicationsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Ping to confirm successful connection to MongoDB
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}

// Default route
app.get("/", async (req, res) => {
  res.send("Hello Express");
});

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
