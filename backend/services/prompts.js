const agentPrompts = require("./prompts/agentPrompts");
const classifier = require("./prompts/classifier");
const discussion = require("./prompts/discussion");
const vote = require("./prompts/vote");
const productVision = require("./prompts/productVision");
const mvpScope = require("./prompts/mvpScope");
const prd = require("./prompts/prd");
const userExperience = require("./prompts/userExperience");

module.exports = {
  ...agentPrompts,
  ...classifier,
  ...discussion,
  ...vote,
  ...productVision,
  ...mvpScope,
  ...prd,
  ...userExperience,
};
