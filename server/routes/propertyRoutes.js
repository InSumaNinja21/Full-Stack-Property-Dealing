const express = require("express");
const router = express.Router();

const {
  addProperty,
  getProperties,
  getPropertyById,
  deleteProperty,
  updateProperty
} = require("../controllers/propertyController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// IMPORTANT: order matters
router.get("/", getProperties);      // get all
router.get("/:id", getPropertyById); // get by id

router.post("/", authMiddleware, roleMiddleware(["seller"]), addProperty);
router.delete("/:id", authMiddleware, roleMiddleware(["seller"]), deleteProperty);
router.put("/:id", authMiddleware, roleMiddleware(["seller"]), updateProperty);
module.exports = router;