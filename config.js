module.exports = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    apiKey: process.env.TWILIO_API_KEY,
    apiSecret: process.env.TWILIO_API_SECRET,
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    callerId: process.env.FROM_NUMBER,
    authToken: process.env.AUTH_TOKEN
  }
};