var express = require('express');
var router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: null
});
const openai = new OpenAIApi(configuration);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/submit", async (req, res, next) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: "Say this is a test",
      temperature: 0,
      max_tokens: 7,
    });

    res.json(response.data);
  } catch {
    res.json(false);
  }
});
module.exports = router;
