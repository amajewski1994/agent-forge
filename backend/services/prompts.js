const agentPrompts = require("./prompts/agentPrompts");
const classifier = require("./prompts/classifier");
const discussion = require("./prompts/discussion");
const vote = require("./prompts/vote");
const productVision = require("./prompts/productVision");
const mvpScope = require("./prompts/mvpScope");
const prd = require("./prompts/prd");
const userExperience = require("./prompts/userExperience");
const technicalArchitecture = require("./prompts/technicalArchitecture");
const dataModel = require("./prompts/dataModel");
const implementationRoadmap = require("./prompts/implementationRoadmap");

module.exports = {
  ...agentPrompts,
  ...classifier,
  ...discussion,
  ...vote,
  ...productVision,
  ...mvpScope,
  ...prd,
  ...userExperience,
  ...technicalArchitecture,
  ...dataModel,
  ...implementationRoadmap,
};
