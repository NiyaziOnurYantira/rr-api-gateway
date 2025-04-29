const express = require("express");
const app = express();
const PORT = 3003;

app.use(express.json());

app.use((req, res) => {
  res.send(`Response from Backend 1`);
});

app.listen(PORT, () => {
  console.log(`Backend 1 running on port ${PORT}`);
});
