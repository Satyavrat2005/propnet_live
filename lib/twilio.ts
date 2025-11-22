import twilio, { Twilio } from "twilio";
import type { MessageListInstanceCreateOptions } from "twilio/lib/rest/api/v2010/account/message";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client: Twilio | null = null;

function getClient(): Twilio {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
  }

  if (!client) {
    client = twilio(accountSid, authToken);
  }

  return client;
}

export async function sendSms(options: { to: string | string[]; body: string }) {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = process.env.TWILIO_SMS_FROM;

  if (!messagingServiceSid && !fromNumber) {
    throw new Error(
      "Missing Twilio messaging configuration. Set either TWILIO_MESSAGING_SERVICE_SID or TWILIO_SMS_FROM."
    );
  }

  const smsClient = getClient();
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const results = [];

  for (const recipient of recipients) {
    const payload: MessageListInstanceCreateOptions = {
      to: recipient,
      body: options.body,
    };

    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else if (fromNumber) {
      payload.from = fromNumber;
    }

    results.push(await smsClient.messages.create(payload));
  }

  return results;
}
