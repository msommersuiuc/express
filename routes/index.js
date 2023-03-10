var express = require('express');
var router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: "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",
  basePath: "https://api.openai.com/v1/chat"
});
const openai = new OpenAIApi(configuration);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/submit", async (req, res, next) => {
  data = req.body;
  if (!data)
    res.json(false);

  let prompt;
  switch (data.type) {
    case "ThankYou":
      prompt = `Write a thank you note from ${data.from} to ${data.to}. Make the note less than 4 sentences.`;
      break;
    case "Sympathy":
      prompt = `Write a sympathy note from ${data.from} to ${data.to}. Make the note less than 4 sentences.`;
      break;
    case "MissingYou":
      prompt = `Write a "missing you" note from ${data.from} to ${data.to}. Make the note less than 4 sentences.`;
      break;
    case "WishingYouWell":
      prompt = `Write a "wishing you well" note from ${data.from} to ${data.to}. TMake the note less than 4 sentences.`;
      break;
    case "Christmas":
      prompt = `Write a Christmas greeting card from ${data.from} to ${data.to}. Make the note less than 4 sentences.`;
      break;
    default:
      return;
  }

  console.log(prompt);

  try {
    const oairesponse = await openai.createCompletion({
      model: "gpt-3.5-turbo",
      messages: [{
        "role": "user",
        "content": prompt
      }],
      temperature: 0.7,
      stream: true
    }, { responseType: "stream"});

    oairesponse.data.on('data', data => {
      const lines = data.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(message);
          const content = parsed.choices[0]?.delta?.content;
          if (content)
            res.write(content);
        } catch (error) {
          console.error('Could not JSON parse stream message', message, error);
        }
      }
    });
  } catch (error) {
    if (error.response?.status) {
      console.error(error.response.status, error.message);
      error.response.data.on('data', data => {
        const message = data.toString();
        try {
          const parsed = JSON.parse(message);
          console.error('An error occurred during OpenAI request: ', parsed);
        } catch (error) {
          console.error('An error occurred during OpenAI request: ', message);
        }
      });
    } else {
      console.error('An error occurred during OpenAI request', error);
    }
    res.json(false);
  }
});
module.exports = router;
