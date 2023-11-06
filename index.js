const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('i got the job is running')
})




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
    try {

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
        // applied jobs
        app.post('/appliedJobs', async (req, res) => {
            const appliedJobs = req.body
            console.log(appliedJobs)
            const result = await appliedJobsCollection.insertOne(appliedJobs)
            res.send(result)
        })

        app.get('/appliedJobs', async (req, res) => {
            const result = await appliedJobsCollection.find().toArray();
            res.send(result)
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



