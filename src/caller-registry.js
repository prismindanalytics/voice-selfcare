// Simple in-memory caller registry to bridge telephony provider -> OpenAI SIP.
// Stores the most recent caller phone number with a timestamp.
// Used to recover the caller's number when SIP headers don't carry it.

let lastCaller = null;

function setLastCaller(phoneNumber) {
  if (!phoneNumber) return;
  lastCaller = { phoneNumber, at: Date.now() };
}

function getLastCaller(maxAgeMs = 120000) { // default 2 minutes
  if (!lastCaller) return null;
  if (Date.now() - lastCaller.at > maxAgeMs) return null;
  return lastCaller.phoneNumber;
}

module.exports = { setLastCaller, getLastCaller };
