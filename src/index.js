const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const router = require("./routers/user");

app.use(cors());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
app.use("/api/v1/entity", router);
