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
    const getUrl = `${process.env.CMS_URL}`
    const data = await axios.get(getUrl);
    // Console return 3 results now
    console.log(data.data)
    // TBD loop through each contract

    
    // For each contract start procedure
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // TBD replace by CMS data.data.attribute.reference
    await page.goto('https://github.com/tintinweb/smart-contract-sanctuary-polygon/tree/master/contracts/mainnet/00/00000000011dF015e8aD00D7B2486a88C2Eb8210_DharmaKeyRingUpgradeBeaconControllerPolygon.sol');
  
    const res = await page.waitForFunction(
      'document.querySelector("body").innerText.includes("OwnershipTransferred")'
    );
  
    if(res!==null){
      // ID to be replaced by CMS data.data.id
      const id=3
      console.log('Swap found')
      const config = {
        url: `${process.env.CMS_URL}${id}`,
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'Authorization': `Bearer ${process.env.API_TOKEN}`
        },
        data:{
          data:{isSwap: true}
      }
      }
     
      await axios.put(config.url,config.data,config.headers);
      console.log('Swap updated')
  
    } else {
      console.log('Swap not found')
    }
    
  
  
    await browser.close();
  } catch (error) {
    console.log(Object.keys(error), error.message); 
  }


})();