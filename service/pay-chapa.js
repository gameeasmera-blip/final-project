// server.js (Express.js)
const express = require("express");
const axios = require("axios"); // cURL bakka bu'uuf
const cors = require("cors");
const pdo = require("./db"); // Database Connection keessan

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/pay-chapa", async (req, res) => {
  const { app_id } = req.body;

  if (!app_id) {
    return res
      .status(400)
      .json({ status: "failed", message: "Application ID hin argamne!" });
  }

  try {
    // 1. Database irraa Application & Applicant fetch gochuu
    const [rows] = await pdo.execute(
      `SELECT a.*, ap.email, ap.full_name, ap.phone 
       FROM admission_applications a 
       JOIN applicants ap ON a.applicant_id = ap.id 
       WHERE a.id = ?`,
      [app_id],
    );

    const appData = rows[0];
    if (!appData) {
      return res
        .status(404)
        .json({ status: "failed", message: "Iyyannoon hin argamne!" });
    }

    // 2. Phone Formatting
    let rawPhone = (appData.phone || "").trim();
    let phone = rawPhone.replace(/[^0-9]/g, "");

    if (
      phone.length !== 10 ||
      (!phone.startsWith("09") && !phone.startsWith("07"))
    ) {
      phone = "0911234567"; // Test phone number
    }

    // 3. First Name & Last Name Formatting
    const nameParts = (appData.full_name || "Applicant Student")
      .trim()
      .split(" ")
      .filter(Boolean);
    const firstName = nameParts.shift() || "Applicant";
    const lastName = nameParts.length > 0 ? nameParts.join(" ") : "Student";

    // 4. Email Formatting
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = emailRegex.test(appData.email)
      ? appData.email.trim()
      : "applicant@wollegauniversity.edu.et";

    const chapaSecretKey = "CHASECK_TEST-bxy0tpSSG8ei8gs36pwBGWh7DVM62BZF";
    const tx_ref = `TX-NID-${Date.now()}-${app_id}`;

    // 5. Chapa Payload
    const postData = {
      amount: "200",
      currency: "ETB",
      email: email,
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      tx_ref: tx_ref,
      callback_url: "http://localhost:5000/api/chapa-callback",
      return_url: "http://localhost:3000/profile",
      customization: {
        title: "WU Admission Fee",
        description: "Payment for Graduate Admission",
      },
    };

    // 6. Request gara Chapa API (Axios fayyadamnee)
    const chapaResponse = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      postData,
      {
        headers: {
          Authorization: `Bearer ${chapaSecretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (chapaResponse.data && chapaResponse.data.status === "success") {
      // 7. Update tx_ref in Database
      await pdo.execute(
        "UPDATE admission_applications SET tx_ref = ? WHERE id = ?",
        [tx_ref, app_id],
      );

      // Return checkout_url to React
      return res.json({
        status: "success",
        checkout_url: chapaResponse.data.data.checkout_url,
      });
    } else {
      return res
        .status(400)
        .json({ status: "failed", data: chapaResponse.data });
    }
  } catch (error) {
    console.error(
      "Chapa Payment Error:",
      error.response?.data || error.message,
    );
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error or Chapa Issue",
      error: error.response?.data || error.message,
    });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
