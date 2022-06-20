const puppeteer = require('puppeteer');
const axios = require('axios');
const dotenv = require('dotenv');
// Get me all contracts - axios - get: id, attrbitues.reference
// Loop by ID for each reference
// If word found, Put API call to update contract
dotenv.config();

(async () => {
  try {
    // Fetch me CMS contracts - I will prolong query limit from 25 to 10000 after implementation
    const getUrl = `${process.env.CMS_URL}`;
    const data = await axios.get(getUrl);
    // Console return 3 results now
    const contracts = data.data.data;
    console.log('contracts', contracts);

    const browser = await puppeteer.launch();

    // For each contract start procedure
    for (const contract of contracts) {
      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(0);
      await page.goto(contract.attributes.reference);

      // checks if text includes 'OwnershipTransferred'
      const hasMatch = await page.evaluate(() =>
        document
          .querySelector('body')
          .innerText.includes('OwnershipTransferred')
      );

      if (hasMatch) {
        console.log('Swap found');
        // ID to be replaced by CMS data.data.id
        const id = 3;

        const config = {
          url: `${process.env.CMS_URL}${id}`,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            // 'Authorization': `Bearer ${process.env.API_TOKEN}` -- Endpoint public now without restriction
          },
          data: {
            data: { isSwap: true },
          },
        };

        await axios.put(config.url, config.data, config.headers);
        console.log('Swap updated');
      } else {
        console.log('Swap not found');
      }
    }
    await browser.close();
  } catch (error) {
    console.log(Object.keys(error), error.message);
  }
})();
