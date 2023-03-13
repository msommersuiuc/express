var express = require('express');
var router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: "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",
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/image", async (req, res, next) => {
  data = req.body;
  if (!data)
    res.json(false);
  
  let prompt = data.prompt
  console.log(prompt);

  try {
    const openai = new OpenAIApi(configuration);
    const oairesponse = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: "256x256",
    });

    res.json({ url: oairesponse?.data?.data[0]?.url });
    return;
  } catch (error) {
    console.error('An error occurred during OpenAI request', error);
  }

  res.json(false);
});

router.post("/completion", async (req, res, next) => {
  data = req.body;
  if (!data)
    res.json(false);

  let prompt = data.prompt
  console.log(prompt);

  try {
    const openai = new OpenAIApi(configuration, "https://api.openai.com/v1/chat");
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
