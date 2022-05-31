


  const axios = require('axios');
  const express = require('express');
  const { composeSendMessageRequestAxiosConfig } = require('./src/index');
  
  
  const app = express();
  app.use(express.text({type: 'application/json'}));
  
  app.post('/', async function (req, res) {
    
      const request = composeSendMessageRequestAxiosConfig(
          {
              content: `New article added: ${req.body}`, 
          });
      await axios(request);
      res.sendStatus(204)
  })
  
  app.listen(5000, () =>
      console.log(`Server listening on port 5000.`)
  );