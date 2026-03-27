import { generateStatement } from "./src/lib/generator";
import { generateHTMLStatement } from "./src/lib/templates/statement";
import { DEFAULT_CONFIG } from "./src/lib/config";

const result = generateStatement(DEFAULT_CONFIG);
const html = generateHTMLStatement(result);
console.log("✅ Generated", result.transactions.length, "transactions");
console.log("HTML length:", html.length);

