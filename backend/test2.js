const BOT_REPLIES = {
  'hello': "Hi! Welcome to MIRU. How can I help you today?",
  'shipping': "We ship worldwide!"
};
const input = "shipping";
const key = Object.keys(BOT_REPLIES).find(k => new RegExp(`\\b${k}\\b`, 'i').test(input)) || 'default';
console.log("Matched key:", key);
