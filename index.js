const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { generateRegistrationOptions, generateAuthenticationOptions, verifyRegistrationResponse, verifyAuthenticationResponse } = require("@simplewebauthn/server");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://dipen211:Dipen%40211@backenddb.te6jm.mongodb.net?retryWrites=true&w=majority&appName=BackendDB')
  .then(() => {
    console.log('Connected!')
    app.listen(3002, () => {
      console.log('server is running on port 3002');
    });
  })
  .catch((e) => {
    console.log(e);
  })

const StudentSchema = new mongoose.Schema({
  name: String,
  credentialID: String,
  publicKey: String,
});
const Student = mongoose.model("Student", StudentSchema);

const AttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  date: { type: Date, default: Date.now },
});
const Attendance = mongoose.model("Attendance", AttendanceSchema);

// Generate options for fingerprint registration
app.get("/api/webauthn/register-options", async (req, res) => {
  const options = generateRegistrationOptions({ rpName: "Attendance App", userID: "123", userName: "Student" });
  res.json(options);
});

// Register Student with fingerprint
app.post("/api/students/register", async (req, res) => {
  const { name, credential } = req.body;
  const verification = await verifyRegistrationResponse({ response: credential });
  if (!verification.verified) return res.status(400).send("Fingerprint registration failed");

  const student = new Student({
    name,
    credentialID: verification.credentialID,
    publicKey: verification.credentialPublicKey,
  });
  await student.save();
  res.send(student);
});

// Generate options for fingerprint authentication
app.get("/api/webauthn/auth-options", async (req, res) => {
  const options = generateAuthenticationOptions();
  res.json(options);
});

// Mark Attendance with Fingerprint
app.post("/api/attendance/mark", async (req, res) => {
  const { credential } = req.body;
  const student = await Student.findOne({ credentialID: credential.id });
  if (!student) return res.status(404).send("Student not found!");

  const attendance = new Attendance({ student: student._id });
  await attendance.save();
  res.send({ message: "Attendance marked!", student });
});

app.listen(5000, () => console.log("Server running on port 5000"));