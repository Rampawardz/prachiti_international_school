const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Ensure environment variables are loaded

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON payloads
app.use(express.static(path.join(__dirname, "public"))); // Serve static frontend files

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Schema and Model for Messages
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Ensure this is set in your .env file
    pass: process.env.EMAIL_PASS, // Ensure this is set in your .env file
  },
});

// Routes
app.post("/send", async (req, res) => {
  const { name, email, contact, message } = req.body;

  // Validate request payload
  if (!name || !email || !contact || !message) {
    return res.status(400).send("All fields are required.");
  }

  try {
    // Save message to MongoDB
    const newMessage = new Message({ name, email, contact, message });
    await newMessage.save();
    console.log("Message saved to database.");

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Message from ${name} (${contact})`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Failed to send email.");
      }
      console.log("Email sent:", info.response);
      return res.status(200).send("Email sent successfully!");
    });
  } catch (err) {
    console.error("Error saving or sending message:", err);
    return res.status(500).send("An error occurred while processing your request.");
  }
});

// Catch-All Route for Frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
