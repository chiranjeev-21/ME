const { handlePinnedQuestRequest } = require('../server/githubPinned');

module.exports = async function handler(req, res) {
  await handlePinnedQuestRequest(req, res, process.env);
};
