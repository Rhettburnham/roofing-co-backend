const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config(); // Load environment variables
const { google } = require("googleapis");

const app = express();

// CORS Configuration
app.use(cors()); // Allow all origins

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// OAuth2 client setup
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Set the refresh token
oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

// Endpoint to handle booking submissions
app.post("/submit-booking", async (req, res) => {
  const { firstName, lastName, email, phone, service, otherService, message } =
    req.body;
  const selectedService = service === "Other" ? otherService : service;

  try {
    // Send the email notification using Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Construct the email
    const emailLines = [
      `From: "Roofing Website" <roofing.www@gmail.com>`, // Replace with your email
      `To: rhettburnham64@gmail.com`,
      `Subject: New Booking Submission`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      `First Name: ${firstName}`,
      `Last Name: ${lastName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Service: ${selectedService}`,
      `Message: ${message}`,
    ];

    const emailContent = emailLines.join("\n");

    // Encode the email
    const base64EncodedEmail = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send the email
    await gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: base64EncodedEmail,
      },
    });

    res.json({
      success: true,
      message: "Booking data received and email sent",
    });
  } catch (error) {
    console.error("Error processing booking submission:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
