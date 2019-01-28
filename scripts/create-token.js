require("dotenv").config();

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const signedJWT = jwt.sign(
  {
    id: "Application Identity",
    name: "Application Identity",
    scope: "app"
  },
  JWT_SECRET
);

console.log(signedJWT);
