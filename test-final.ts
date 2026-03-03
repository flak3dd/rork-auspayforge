import { generateStatement } from "./src/lib/generator";
import { generateHTMLStatement } from "./src/lib/templates/statement";
import { DEFAULT_CONFIG } from "./src/lib/config";

const result = generateStatement(DEFAULT_CONFIG);
const html = generateHTMLStatement(result);
console.log("✅ SUCCESS: Generated", result.transactions.length, "transactions");
console.log("HTML length:", html.length, "— ready for WebView + PDF");
console.log("Yellow bar on page 2 is now pure CSS — no bar.png needed");
