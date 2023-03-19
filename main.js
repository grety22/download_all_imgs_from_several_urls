const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

// Function to download images from a URL
function downloadImagesFromUrl(url) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const { hostname } = new URL(url);
  const downloadFolderPath = path.join(__dirname, "allImages", hostname, `downloaded_images_${timestamp}`);
  const textFilePath = path.join(__dirname, `downloaded_images_${timestamp}.txt`);
  var counter = 0;

  // Create the download folder if it doesn't exist
  fs.mkdirSync(downloadFolderPath, { recursive: true });

  axios.get(url).then(response => {
    const $ = cheerio.load(response.data);

    $('img').each((i, el) => {
      const imgUrl = $(el).attr('src');
      if (imgUrl && imgUrl.startsWith('http') && imgUrl.includes('staging')) {
        const imgName = path.basename(imgUrl);
        const imgPath = path.join(downloadFolderPath, imgName);

        axios({
          method: 'get',
          url: imgUrl,
          responseType: 'stream'
        }).then(response => {
          const writeStream = fs.createWriteStream(imgPath);
          writeStream.on('error', err => {
            console.log(`Error writing file ${imgPath}: ${err}`);
          });
          response.data.pipe(writeStream);

          // Write the image name to the text file
          const text = `https://media.url.com/{folderlName}/assets/${imgName}\n`;        
          fs.appendFileSync(textFilePath, text);
          counter = i;
        }).catch(error => {
          console.log(`Error downloading image ${imgUrl}: ${error}`);
        });
      }
    });
  }).catch(error => {
    console.log(error);
  }).finally(() => {
    console.log(`Downloaded ${counter} images to folder ${downloadFolderPath}.`);
    console.log(`Image names written to file ${textFilePath}.`);
  });
}

// Example usage: download images from two URLs
const urls = ['https://url1/', 'https://url2'];
urls.forEach(url => downloadImagesFromUrl(url));