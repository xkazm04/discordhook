const puppeteer = require('puppeteer');
const axios = require('axios');
const dotenv = require('dotenv');

// 0. Extract row where text content = "pragma solidity" and add to array
// 1. Extract row where text content = "function" or "event" and add to array
// 2. Take whole body and save into variable  source: "Box-body p-0 blob-wrapper data type-solidity  gist-border-0," Selector    #repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0
dotenv.config();

(async () => {
  try {
    // const getUrl = `${process.env.CMS_URL}`;
    // const data = await axios.get(getUrl);
    // query results where something empty
    const data = await axios.get('https://d3v-center.herokuapp.com/api/contracts')
    const contracts = data.data.data;
    const browser = await puppeteer.launch();

    // For each contract start procedure
    for (const contract of contracts) {

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(0);
      await page.goto(contract.attributes.reference);

      // marks contract is valid and uses "pragma solidity"
      const findPragma = await page.evaluate(() =>
        document
          .querySelector('#repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0')
          .innerText.includes('pragma solidity')
      );

      var swap = false;
      const findSwap = await page.evaluate(() =>
      document
        .querySelector('#repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0')
        .innerText.includes('function swap')
    );

      var withdraw = false;
      const findWithdraw = await page.evaluate(() =>
      document
        .querySelector('#repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0')
        .innerText.includes('function withdraw')
    );


      if (findWithdraw){
        console.log('Flag extracted: Withdraw')
        withdraw = true;
      }

      if (findSwap){
        console.log('Flag extracted: Swap')
        swap = true
      }
      // extract whole body of Github code - done
      const contractBody = await page.$eval(
        "#repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0",
        (element) => element.innerText
      );


      // Pragma version extractor
      const rawVersion = await page.evaluate(() =>
        Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('pragma') > -1).map(row => row.innerText)
      )
      var version = ''
      version = rawVersion[0].trim()
      console.log('Extracted version: '+ version)

      // Author metadata extractor

      const rawAuthor = await page.evaluate(() =>
          Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('@author') > -1).map(row => row.innerText)
        )
      
        var author = ''
        if (rawAuthor[0]) {
          author = rawAuthor[0].replace('@author', '').replace('*', '').trim()
          console.log('Extracted author: '+ author)
        } 
   
      
      // Title extractor
      const rawTitle = await page.evaluate(() =>
          Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('@title') > -1).map(row => row.innerText)
        )

        var title = ''
        if (rawTitle[0]) {
          title = rawTitle[0].replace('@title', '').replace('*', '').trim()
          console.log('Extracted title: '+ title)
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
      }



      console.log('Extracted functions successfully')
      console.log('Extraction process completed, Starting security evaluation');


      var secOpt = 999;
      var secInf = 999; 
      var secLow = 999;
      var secMed = 999;
      var secHigh = 999;

      // if (contractBody && version){
      //   const pyConfig = {
      //     url: `${process.env.PY}`,
      //     headers: {
      //       accept: 'application/json',
      //       'content-type': 'application/json',
      //       // 'Authorization': `Bearer ${process.env.API_TOKEN}` -- Endpoint public now without restriction
      //     },
      //     data:{
      //       contract: contractBody,
      //       pragma: version
      //     }
      //   }
      //   try {
      //     const res = await axios.post(pyConfig.url, pyConfig.data, pyConfig.headers)
      //     console.log(res);
      //   } catch (err){
      //     console.log('Slither scan failed')
      //   }
      // }

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

            },
          },
        };

        try{
          await axios.put(config.url, config.data, config.headers);
          console.log(`ID updated: ${contract.id}`);
        } catch(e){
          console.log('CMS update failed')
        }
      } else {
        console.log(`Contract version not found for ${contract.id}`);
      }
    }
    await browser.close();
  } catch (error) {
    console.log(Object.keys(error), error.message);
  }
})();


// Upravit schema - Přidat arraye -> Rich text probably