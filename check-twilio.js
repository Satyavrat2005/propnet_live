// check-twilio.js
const Twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

console.log("Account SID present:", !!accountSid);
console.log("Auth token present:", !!authToken);
console.log("Verify SID present:", !!verifyServiceSid);

if (!accountSid || !authToken || !verifyServiceSid) {
  console.error("Missing one or more env vars. Please check .env.local and restart the server.");
  process.exit(1);
}

const client = Twilio(accountSid, authToken);

async function run() {
  try {
    // Try to fetch the Verify service to check auth + service existence
    const service = await client.verify.v2.services(verifyServiceSid).fetch();
    console.log("Verify service fetched:", service.sid, service.friendlyName || "");
    console.log("Twilio credentials look VALID.");
  } catch (err) {
    console.error("Twilio error:", err.message || err);
    if (err.code) {
      console.error("Twilio error code:", err.code);
      console.error("More info:", err.moreInfo);
    }
    process.exit(2);
  }
}

run();
