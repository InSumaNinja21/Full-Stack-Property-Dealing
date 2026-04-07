const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/** Request body role → "buyer" | "seller". Missing/invalid values default to "buyer". */
function resolveRoleFromBody(roleInput) {
  if (roleInput === undefined || roleInput === null) {
    return "buyer";
  }
  if (typeof roleInput === "string" && roleInput.trim().toLowerCase() === "seller") {
    return "seller";
  }
  return "buyer";
}

/** JWT payload: { id, role }. Legacy users without `role` are treated as "buyer". */
const generateToken = (user) => {
  const role = user.role === "seller" ? "seller" : "buyer";
  return jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role: roleInput } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const role = resolveRoleFromBody(roleInput);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role === "seller" ? "seller" : "buyer"
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
