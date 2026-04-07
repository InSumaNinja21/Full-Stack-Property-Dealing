const express = require("express");

const cors = require("cors");

const mongoose = require("mongoose");

require("dotenv").config();

const propertyRoutes = require("./routes/propertyRoutes");

const authRoutes = require("./routes/authRoutes");



const app = express();



app.use(cors());

app.use(express.json());



app.get("/", (req, res) => {

  res.send("API is running...");

});



app.use("/api/properties", propertyRoutes);

app.use("/api/auth", authRoutes);



const PORT = process.env.PORT || 5000;



// Connect DB first, then start server

mongoose.connect(process.env.MONGO_URI)

  .then(() => {

    console.log("MongoDB Connected ✅");



    app.listen(PORT, () => {

      console.log(`Server running on ${PORT}`);

    });

  })

  .catch(err => {

    console.log("DB Error ❌", err);

  });