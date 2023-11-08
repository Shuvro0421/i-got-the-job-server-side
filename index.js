const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send('i got the job is running')
})

// middleware
const logger = (req, res, next) => {
    console.log(req.method, req.url)
    next()
}
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    // console.log('token in the middleware' , token)
    // no token available
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded
        next()
    })
}


const uri = `mongodb+srv://${process.env.VITE_DB_USER}:${process.env.VITE_DB_PASS}@cluster0.04lxrta.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    const jobsCollection = client.db("jobsDB").collection("jobs")
    const appliedJobsCollection = client.db("jobsDB").collection("appliedJobs")
    const reviewsCollection = client.db("jobsDB").collection("reviews")

    try {
        // jwt token
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            }).send({ success: true });
        });
        app.post('/logout', async (req, res) => {
            const user = req.body
            console.log('logging out ', user)
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })


        app.post('/jobs', async (req, res) => {
            const jobs = req.body
            console.log(jobs)
            const result = await jobsCollection.insertOne(jobs)
            res.send(result)
        })

        app.get('/jobs', async (req, res) => {


            const result = await jobsCollection.find().toArray();
            res.send(result)
        })

        app.get('/reviews' , async (req, res) => {


            const result = await reviewsCollection.find().toArray();
            res.send(result)
        })
        app.post('/reviews', async (req, res) => {
            const reviews = req.body
            console.log(reviews)
            const result = await reviewsCollection.insertOne(reviews)
            res.send(result)
        })



        app.get('/jobs/singleJob/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })

        // update the product id
        app.put('/jobs/singleJob/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedJob = req.body
            const job = {
                $set: {

                    image: updatedJob.image,
                    logo: updatedJob.logo,
                    title: updatedJob.title,
                    name: updatedJob.name,
                    category: updatedJob.category,
                    salary: updatedJob.salary,
                    postingDate: updatedJob.postingDate,
                    applicationDeadline: updatedJob.applicationDeadline,
                    description: updatedJob.description,
                }
            }

            const result = await jobsCollection.updateOne(filter, job, options)
            res.send(result)
        })


        app.post('/appliedJobs', async (req, res) => {
            const appliedJob = req.body;

            // Add the applied job to the 'appliedJobsCollection'
            const result = await appliedJobsCollection.insertOne(appliedJob);

            // Increment 'applicantsNumber' in the 'jobsCollection' for the corresponding job
            const jobId = appliedJob.jobId;
            const query = { _id: new ObjectId(jobId) };

            // Assuming you retrieved the job data and 'applicantsNumber' is stored as a string
            const job = await jobsCollection.findOne(query);

            // Convert 'applicantsNumber' from string to integer before using it
            if (job) {
                const currentApplicants = parseInt(job.applicantsNumber, 10); // Parse string to integer
                const updatedApplicantsNumber = currentApplicants + 1;

                // Update the 'jobsCollection' with the incremented value
                const updateJobQuery = {
                    $set: { applicantsNumber: updatedApplicantsNumber }
                };

                await jobsCollection.updateOne(query, updateJobQuery);
            }


            res.send(result);
        });





        app.get('/appliedJobs', logger, verifyToken, async (req, res) => {

            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const result = await appliedJobsCollection.find().toArray();
            res.send(result)

            // console.log('cookies' , req.cookies)
        })

        // delete add to cart id 
        app.delete('/jobs/:_id', async (req, res) => {
            const id = req.params._id
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log('i got the job server is running on port', port)
})



