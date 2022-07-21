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
      // extract whole body of Github code - done
      const contractBody = await page.$eval(
        "#repo-content-pjax-container > div > div > div.Box.mt-3.position-relative > div.Box-body.p-0.blob-wrapper.data.type-solidity.gist-border-0",
        (element) => element.innerText
      );
      console.log('Extracted body ' + contractBody);




      // TBD
      // https://www.digitalocean.com/community/tutorials/how-to-scrape-a-website-using-node-js-and-puppeteer


      // 1. Extract row where text contains some string
      const version = await page.evaluate(() =>
        Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('pragma') > -1).map(row => row.innerText)
      )
      console.log('Extracted version: '+ version)

      // For each
      // TBD clean row before posting - Trim, remove first characters
      // TBD take only first value in array - 

      // 1. Extract row where text contains some string
      const author = await page.evaluate(() =>
          Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('@author') > -1).map(row => row.innerText)
        )
          console.log('Extracted author: '+ author)
      

      const title = await page.evaluate(() =>
          Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('@title') > -1).map(row => row.innerText)
        )
          console.log('Extracted title: '+ title)



      // 2. Extract row where text contains some string and add to array
      // Filter error, cannot use "includes" in this case 
      // const events = await page.evaluate(() =>
      //   Array.from(document.querySelectorAll("tr")).filter(rows => rows.innerText.indexOf('event') > -1).map(row => row.innerText)
      // )
      // console.log(events)
    
       // TBD clean row before posting - Trim, remove first characters
       // TBD // Clean result - Each row will start with "event"/"function"


      // PUT Pragma version to CMS
      if (findPragma) {
        console.log('Found Pragma')
        const config = {
          url: `${process.env.CMS_URL}${contract.id}`,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            // 'Authorization': `Bearer ${process.env.API_TOKEN}` -- Endpoint public now without restriction
          },
          // Added new colunmns into CMS schama to store arrays: `functions` and `events`
          data: {
            data: { version: 'pragma version TBD' },
          },
        };

        await axios.put(config.url, config.data, config.headers);
        console.log(`Pragma updated to ${contract.id}`);
      } else {
        console.log(`Pragma not found for ${contract.id}`);
      }
    }
    await browser.close();
  } catch (error) {
    console.log(Object.keys(error), error.message);
  }
})();


// Upravit schema - Přidat arraye -> Rich text probably