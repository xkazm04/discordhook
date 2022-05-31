


  const axios = require('axios');
  const express = require('express');
  const { composeSendMessageRequestAxiosConfig } = require('./src/index');
  const port = 3000;
  
  
  const app = express();
  app.use(express.text({type: 'application/json'}))
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  
  app.post('/', async function (req, res) {
    
      const request = composeSendMessageRequestAxiosConfig(
          {
              content: `New article added: ${req.body}`, 
          });
      await axios(request);
      res.sendStatus(204)
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })