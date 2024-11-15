const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  // Removed deprecated options
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("Error connecting to MongoDB", err);
});

// Define schema for user
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  parentEmail: String // Add parentEmail field
});

// Define pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

// Create User model
const User = mongoose.model('User ', userSchema);

// Define route for user signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password, parentEmail } = req.body;

  try {
    // Check if the user already exists
    const existingUser  = await User.findOne({ email });
    if (existingUser ) {
      return res.status(400).json({ success: false, message: 'User  already exists' });
    }

    // Create a new user
    const newUser  = new User({ username, email, password, parentEmail });
    await newUser .save();

    res.status(201).json({ success: true, message: 'User  registered successfully' });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.get('/api/student-details', async (req, res) => {
  const { email } = req.query; // Assume email is passed as a query parameter
 
  try {
    const student = await User.findOne({ email });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      username: student.username,
      email: student.email,
      parentEmail: student.parentEmail,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Define route for fetching student details
app.get('/api/student-details', async (req, res) => {
  const { email } = req.query; // Assume email is passed as a query parameter

  try {
    const student = await User.findOne({ email });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      username: student.username,
      email: student.email,
      parentEmail: student.parentEmail,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('frontend/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  });
}

// Create a schema for quiz scores
const quizSchema = new mongoose.Schema({
  score: Number,
});

// Create a model for quiz scores
const QuizScore = mongoose.model("QuizScore", quizSchema);

// Route to receive and store quiz scores
app.post("/quizscores", async (req, res) => {
  const { score } = req.body;

  try {
    // Store the score in MongoDB
    const newScore = new QuizScore({ score });
    await newScore.save();
    res.status(201).send("Score saved successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving score");
  }
});

// Route to fetch quiz scores
app.get("/quizscores", async (req, res) => {
  try {
    // Fetch all quiz scores from MongoDB
    const scores = await QuizScore.find();
    res.status(200).json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching scores");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});