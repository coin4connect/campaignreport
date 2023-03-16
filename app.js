const express = require('express');
const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
const app = express();
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


function convertToNumber(str) {
  let multiplier = 1;
  if (str.includes('K')) {
    multiplier = 1000;
    str = str.replace('K', '');
  } else if (str.includes('M')) {
    multiplier = 1000000;
    str = str.replace('M', '');
  } else if (str.includes('B')) {
    multiplier = 1000000000;
    str = str.replace('B', '');
  }
  str = str.replace(',', '');
  return parseFloat(str) * multiplier;
}

app.post('/instagram/authorize', (req, res) => {
    console.log("object")
  const { appId, appSecret, redirectUri, code } = req.body;
  const params = {
    app_id: appId,
    app_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code: code,
  };
  axios
    .post(`https://api.instagram.com/oauth/access_token`, querystring.stringify(params))
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((error) => {
      res.status(400).json(error.message);
    });
});


app.get('/fetchInstafollower', (req, res) => {
    const username = req.body.username
    console.log(req.rawHeaders)
    const config = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        } //,
      }
    axios.get(`https://www.instagram.com/${username}/`,config)
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);
    const followers = $('meta[property="og:description"]').attr('content').split(' ')[0];

    console.log(`${username} has ${followers} followers.`);
    return res.status(200).json({message: {"reach" : followers}});
  })
  .catch(error => {
    console.error(error);
    return res.status(500).json({message: "Something went wrong"});
  });
})


app.get('/fetchinstalikesonpost', async(req, res) => {
try{
    const shortcode = req.body.shortcode;
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      });
    await page.goto(`https://www.instagram.com/p/${shortcode}/`, { waitUntil: 'networkidle0' });
    const content = await page.content();
    const $ = cheerio.load(content);
    const metaContent = $('meta[property="og:description"]').attr('content');
    const match = metaContent.match(/([\d.,]+)\s*(k|m)?\s*Likes?,\s*([\d.,]+)\s*(k|m)?\s*Comments?/i);
    console.log(metaContent)
    const likes = match[1] + (match[2] ? match[2] : "");
    const comments = match[3] + (match[4]? match[4] : "");
    console.log(`Likes: ${likes}, Comments: ${comments}`);
    await browser.close();
    return res.status(200).json({message: {"likes" : likes, "Comments" : comments}});

}catch(error){
    console.log(error.message)
    return res.status(500).json({message: "Something went wrong"});
}
})

app.get('/fetchinstareels', async(req, res) => {
try{
    const url =  req.body.url
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        // 'Referer': 'https://www.instagram.com/',
        // 'Origin': 'https://www.instagram.com/',
        // 'Host': 'www.instagram.com'
      });
    
    //   await page.setRequestInterception(true);

//   page.on('request', request => {
//     const headers = request.headers();
//     console.log(headers);
//     request.continue();
//   });

    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('video');
    const html = await page.content();
    
    // Load the HTML content into Cheerio  
    const $ = cheerio.load(html);
    const metaContent = $('meta[property="og:description"]').attr('content');
    const match = metaContent.match(/([\d.,]+)\s*(k|m)?\s*Likes?,\s*([\d.,]+)\s*(k|m)?\s*Comments?/i);
    // console.log(metaContent)
    const likes = match[1] + (match[2] ? match[2] : "");
    const comments = match[3] + (match[4]? match[4] : "");
    // console.log(`Likes: ${likes}, Comments: ${comments}`);
    await browser.close();
    return res.status(200).json({message: {"likes" : likes, "Comments" : comments}});
}catch(error) {
    console.log(error.message)
    return res.status(500).json({message: "Something went wrong"});
}
  
})


app.get('/fetchFbfollower', async (req, res) => {
  try{
    const username = req.body.username
    console.log(username)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    });
    // Navigate to the Facebook page
    await page.goto(`https://www.facebook.com/${username}/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('body');
    const html = await page.content();
  
    // Load the HTML content into Cheerio
    const $ = cheerio.load(html);
  
    const followerCountRegex = /(\d[\d,]*) people follow this/i;
    const followerCountString = $('span:contains("people follow this")').text().trim();
    const followerCountMatch = followerCountString.match(followerCountRegex);
    const followerCount = followerCountMatch ? parseInt(followerCountMatch[1].replace(/,/g, '')) : null;
    await browser.close();
    return res.status(200).json({message: {"reach" : followerCount}});  
  }catch(error){
    console.log(error.message)
    return res.status(500).json({message: "Something went wrong"});
  }

})

app.get('/fetchFbReactionOnPost', async (req, res) => {
  try{
    const url = req.body.url
    console.log(url)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    });
    // Navigate to the Facebook page
    await page.goto(url, { waitUntil: 'networkidle0' });
    const content = await page.content();
    const $ = cheerio.load(content);
    console.log("html fetched")
    const commentsSpan = $('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x4zkp8e.x676frb.x1nxh6w3.x1sibtaa.xo1l8bm.xi81zsa[dir="auto"]').first();
    const viewsSpan = $('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x4zkp8e.x676frb.x1nxh6w3.x1sibtaa.xo1l8bm.xi81zsa[dir="auto"]').eq(1);

    // extract the views count from the text content of the span element
    const viewsCount = viewsSpan.text().trim();
    const commentCount = commentsSpan.text().trim();
    await browser.close();
    const views = convertToNumber(viewsCount);
    const comments = convertToNumber(commentCount);
    return res.status(200).json({message: {"viewsCount" : views, "commentCount" : comments}}); 
    // return res.status(200).json({message: {"reactionCount" : reactionCount, "commentCount" : commentCount, "viewCount": viewCount }});  
  }catch(error){
    console.log(error.message)
    return res.status(500).json({message: "Something went wrong"});
  }

})

app.get('/fetchFbReactionOnReels', async (req, res) => {
  try{
    const url = req.body.url
    console.log(url)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    });
    // Navigate to the Facebook page
    await page.goto(url, { waitUntil: 'networkidle0' });
    const content = await page.content();
    const $ = cheerio.load(content);
    console.log("html fetched")
    dataSpan = $('span.x1j85h84')
    const likes = convertToNumber(dataSpan.eq(1).text())
    const comments = convertToNumber(dataSpan.eq(2).text())
    const shares = convertToNumber(dataSpan.eq(3).text())
    await browser.close();
    console.log(`Likes: ${likes}, Comments: ${comments}, Shares: ${shares}`);
    return res.status(200).json({message: {"Likes": likes, "Comments": comments, "Shares": shares}}); 
  }catch(error){
    console.log(error.message)
    return res.status(500).json({message: "Something went wrong"});
  }

})

app.get('/fetchYtSubscribercount', async (req, res) => {
  try{
    const url = req.body.url
    console.log(url)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    });
    // Navigate to the Facebook page
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#subscriber-count');
  
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const subscriberCountText = $('#subscriber-count').text();
    const subscriberCount = convertToNumber(subscriberCountText) //parseInt(subscriberCountText.replace(/[^0-9]/g, ''));
    await browser.close();
    console.log(`Subscriber count: ${subscriberCount}`);
    return res.status(200).json({message: {"reach" : subscriberCount}}); 
  }catch(error){
    console.log(error.message)
    return res.status(500).json({message: "Something went wrong"});
  }

})

app.get('/fetchYtViewcount', async (req, res) => {
  try{
    const url = req.body.url
    console.log(url)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      'upgrade-insecure-requests': '1', 
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8', 
      'accept-encoding': 'gzip, deflate, br', 
      'accept-language': 'en-US,en;q=0.9,en;q=0.8' 
    });
    // Navigate to the Facebook page
    await page.goto(url, { waitUntil: 'networkidle0' });
    const content = await page.content();
    const $ = cheerio.load(content);
    const viewCount = $('span.view-count').text();
    let viewCountNumeric = parseInt(viewCount.replace(/\D/g, ''));
    await browser.close();
    console.log(viewCountNumeric);
    return res.status(200).json({message: {"viewCount" : viewCountNumeric}}); 
  }catch(error){
    console.log(error.message)
    return res.status(500).json({message: "Something went wrong"});
  }

})