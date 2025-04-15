const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port = process.env.PORT || 8000;
const app = express();


// middleware 
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tp3bo.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {

        const db = client.db("TalkVerse-DB");
        const tutorsCollection = db.collection('tutors');
        const bookedCollection = db.collection('booked');

        // add a tutor in db
        app.post('/add-tutorials', async (req, res) => {
            const tutorData = req.body;
            const result = await tutorsCollection.insertOne(tutorData);
            console.log(result);
            res.send(result);
        })

        // get all tutors
        app.get('/tutors', async (req, res) => {
            const result = await tutorsCollection.find().toArray();
            res.send(result);
        })

        // get a specific tutor
        app.get('/tutor/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const tutor = await tutorsCollection.findOne(query);
            res.send(tutor);
        })

        // find specific tutorial based on email 
        app.get('/my-tutorials/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await tutorsCollection.find(query).toArray();
            res.send(result)
        })

        // update tutor details 
        app.put('/update-tutorial/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: updatedData
            }
            const result = await tutorsCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })

        // delete a tutor 
        app.delete('/delete-tutorial/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await tutorsCollection.deleteOne(query);
            res.send(result);
        })



        // Booked collection ---------------------------
        // add a book
        app.post('/add-book', async (req, res) => {
            const bookData = req.body;
            const result = await bookedCollection.insertOne(bookData);
            console.log(result);
            res.send(result);
        })


        app.get('/my-booked-tutors/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await bookedCollection.find(query).toArray();
            res.send(result);
        });


        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from SoloSphere Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))