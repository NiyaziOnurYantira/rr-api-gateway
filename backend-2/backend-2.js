const express = require("express");
const app = express();
const PORT = 3002;

app.use(express.json());

app.use((req, res) => {
  res.send(`Response from Backend 2`);
});

app.listen(PORT, () => {
  console.log(`Backend 2 running on port ${PORT}`);
});
