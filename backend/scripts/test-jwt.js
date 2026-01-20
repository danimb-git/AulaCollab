require("dotenv").config();
const env = require("../src/config/env");
const { signAccessToken, verifyAccessToken } = require("../src/config/jwt");

const token = signAccessToken({
  sub: "user-id-fake",
  email: "prova@aulacollab.com",
  role: "PROFESSOR",
});

console.log("TOKEN:", token);

const payload = verifyAccessToken(token);
console.log("PAYLOAD:", payload);
