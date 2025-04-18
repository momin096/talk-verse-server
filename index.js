const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port = process.env.PORT || 8000;
const app = express();


// middleware 
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://talk-verse-117af.web.app'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tp3bo.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const verifyToken = async (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'UnAuthorize Access' })
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(401).send({ message: 'UnAuthorize Access' })
        }
        req.user = decoded;
    })

    next();
}


async function run() {
    try {

        const db = client.db("TalkVerse-DB");
        const tutorsCollection = db.collection('tutors');
        const bookedCollection = db.collection('booked');


        // generate json-web-token
        app.post('/jwt', async (req, res) => {
            const email = req.body;

            // create token 
            const token = jwt.sign(email, process.env.SECRET_KEY, { expiresIn: '1d' });
            console.log(token);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            }).send({ success: true })
        })

        // logout 
        app.post('/logout', async (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            }).send({ success: true })
        })

        // add a tutor in db
        app.post('/add-tutorials', async (req, res) => {
            const tutorData = req.body;
            const result = await tutorsCollection.insertOne(tutorData);
            res.send(result);
        })

        // get all tutors or filter by language 
        app.get('/tutors', async (req, res) => {


            const language = req.query.language;
            const search = req.query.search;

            let query = {};
            if (language) {
                query.language = language;
            }
            else if (search) {
                query = {
                    language: {
                        $regex: search, $options: 'i',
                    }
                }
            }

            const result = await tutorsCollection.find(query).toArray();
            res.send(result);
        });

        // get a specific tutor
        app.get('/tutor/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const tutor = await tutorsCollection.findOne(query);
            res.send(tutor);
        })

        // find specific tutorial based on email 
        app.get('/my-tutorials/:email', verifyToken, async (req, res) => {
            const decodedEmail = req?.user?.email;
            const email = req.params.email;

            if (decodedEmail !== email) {
                return res.status(401).send({ message: 'UnAuthorize Access' })
            }

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
            res.send(result);
        })


        app.get('/my-booked-tutors/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req?.user?.email;

            if (decodedEmail !== email) {
                return res.status(401).send({ message: 'UnAuthorize Access' })
            }

            const query = { userEmail: email };
            const result = await bookedCollection.find(query).toArray();
            res.send(result);
        });

        // Update review count for a tutor
        app.patch('/update-review/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const update = {
                    $inc: { review: 1 }
                };
                const result = await tutorsCollection.updateOne(query, update);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });



        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from Talk-Verse Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))