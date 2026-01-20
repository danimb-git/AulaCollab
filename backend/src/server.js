require("dotenv").config();
const env = require("./config/env");
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(env.PORT, () => {
  console.log(`✅ Backend running on http://localhost:${env.PORT}`);
});
