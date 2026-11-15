import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

createApp().listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
