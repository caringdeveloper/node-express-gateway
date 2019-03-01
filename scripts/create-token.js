require("dotenv").config();

const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

const signedJWT = jwt.sign(
  {
    id: "Application Identity",
    name: "Application Identity",
    scope: "app"
  },
  JWT_SECRET_KEY
);

console.log(signedJWT);
