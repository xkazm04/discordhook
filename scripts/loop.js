const puppeteer = require('puppeteer');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  try {
    const data = await axios.get('https://d3v-center.herokuapp.com/api/contracts?pagination[limit]=5000')
    
    const contracts = data.data.data;
    
    const browser = await puppeteer.launch();

    // For each contract start procedure
    for (const contract of contracts) {
      if (!contract.attributes.version){
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(0);
      await page.goto(contract.attributes.reference);

    

      // marks contract is valid and uses "pragma"
      var withdraw = false;
      var swap = false;
      var findPragma = true;
      var contractBody = ''
      
      try{
        const findSwap = await page.evaluate(() =>
        document
          .querySelector('#repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0')
          .innerText.includes('function swap')
      );
          const findWithdraw = await page.evaluate(() =>
          document
            .querySelector('#repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0')
            .innerText.includes('function withdraw')
        );
          // extract whole body of Github code - done
          contractBody = await page.$eval(
            "#repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0",
            (element) => element.innerText
          );

        if (findWithdraw){
          console.log('Flag extracted: Withdraw')
          withdraw = true;
        }
  
        if (findSwap){
          console.log('Flag extracted: Swap')
          swap = true
        }
      } catch(e){
        console.log('Element not extracted')
      }







      // Pragma version extractor
      var version = 'N/A'
      const rawVersion = await page.evaluate(() =>
        Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('pragma') > -1).map(row => row.innerText)
      )
        try {
          version = rawVersion[0].trim()
          console.log('Extracted version: '+ version)
        } catch (error) {
          console.log('No version found')
        }


      // Author metadata extractor

      const rawAuthor = await page.evaluate(() =>
          Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('@author') > -1).map(row => row.innerText)
        )
      
        var author = ''
        if (rawAuthor[0]) {
          try {author = rawAuthor[0].replace('@author', '').replace('*', '').trim()
          console.log('Extracted author: '+ author)
        } catch (err) {
          console.log('Author not found')
        }
        } 
   
      
      // Title extractor
      const rawTitle = await page.evaluate(() =>
          Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('@title') > -1).map(row => row.innerText)
        )

        var title = ''
        if (rawTitle[0]) {
         try{ title = rawTitle[0].replace('@title', '').replace('*', '').trim()
          console.log('Extracted title: '+ title)
        }catch(e){
          console.log('Error extracting title')
        }
        }

      // Event extractor
      var rawEvents = [];	
      var newEvents = [];

      try{
        rawEvents = await page.evaluate(() =>
        Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('event') > -1).map(row => row.innerText)
       )
      for (const event of rawEvents) {
        const revent = event.replace('\t','').trim()
        if (revent.startsWith('event')) {
          newEvents.push(revent)
        }
      }
       console.log('Events extracted')
      } catch(err){
        console.log('Event extraction failed')
        fs.writeFile('/scripts/err.txt', err => {
            console.error('Event extraction error'+ err);
        });
      }




      // Function extractor
      var rawFunctions = [];
      var newFunctions = [];
      try {
        rawFunctions = await page.evaluate(() =>
        Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('function') > -1).map(row => row.innerText)
        )

        for (const fun of rawFunctions) {
          const refun = fun.replace('\t','').trim()
          if (refun.startsWith('function')) {
            newFunctions.push(refun)
          }
        }

        console.log('Functions extracted')
      } catch (err){
        console.log('Function extraction failed')
        fs.writeFile('/scripts/err.txt', err => {
          console.error('Function extraction error'+ err);
      });
      }



      console.log('Extracted functions successfully')
      console.log('Extraction process completed, Starting security evaluation');


      var secOpt = 999;
      var secInf = 999; 
      var secLow = 999;
      var secMed = 999;
      var secHigh = 999;

      if (contractBody && version){
        const pyConfig = {
          url: `${process.env.PY}`,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            // 'Authorization': `Bearer ${process.env.API_TOKEN}` -- Endpoint public now without restriction
          },
          data:{
            sol_contract: contractBody,
            pragma: version
          }
        }
        try {
          const res = await axios.post(pyConfig.url, pyConfig.data, pyConfig.headers)
          console.log(res.data);
          secOpt = res.data.optimization
          secInf = res.data.informational
          secLow = res.data.low
          secMed = res.data.medium
          secHigh = res.data.high
        } catch (err){
          console.log('Slither scan failed ')
        }
      }

      // PUT Pragma version to CMS
      if (findPragma) {
        console.log('CMS - API update')
        const config = {
          url: `${process.env.CMS_URL}${contract.id}`,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            // 'Authorization': `Bearer ${process.env.API_TOKEN}` -- Endpoint public now without restriction
          },
          // Added new colunmns into CMS schama to store arrays: `functions` and `events`
          data: {
            data: {  
              version: version,
              title: title,
              author: author,
              code: contractBody,
              events: newEvents.toString(),
              functions: newFunctions.toString(),
              swapFlag: swap,
              swapWithdraw: withdraw,
              isSwap: false,
              slInf: secInf,
              slOpt: secOpt,
              slLow: secLow,
              slMed: secMed,
              slHigh: secHigh

            },
          },
        };

        try{
          await axios.put(config.url, config.data, config.headers);
          console.log(`ID updated: ${contract.id}`);
        } catch(err){
          console.log('CMS update failed')
          fs.writeFile('/scripts/err.txt', err => {
            console.error('CMS API error'+ err);
        });
        }
      } else {
        console.log(`Contract version not found for ${contract.id}`);
      }} 
    }
    await browser.close();
  } catch (error) {
    console.log(Object.keys(error), error.message);
  }
})
();

