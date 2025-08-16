import populateKnowledge from "./populateKnowledge.js";
import { entries } from "./entries.js";

populateKnowledge(entries)
  .then(() => console.log("✅ Knowledge base populated"))
  .catch(err => console.error("❌ Error populating knowledge:", err));
