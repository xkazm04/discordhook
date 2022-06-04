


  const axios = require('axios');
  const express = require('express');
  const dotenv = require('dotenv');
  const { composeSendMessageRequestAxiosConfig } = require('./src/index');
  const port = 3000;

  
  const app = express();
  app.use(express.text({type: 'application/json'}))
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  dotenv.config();
  

  app.get('/', (req, res) => {
    res.status(200).send('Hello World!');
  })
  
  app.post('/', async function (req, res) {
      const request = composeSendMessageRequestAxiosConfig(
          {
              content: `New article added: ${req.body}`, 
          });
      await axios(request);
      res.sendStatus(204)
  })

  
  app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${port}`)
  })