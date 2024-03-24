
const domino = require('domino');
const fs = require('fs');
const axios = require('axios');

function urlPngToSvg(url) {
  if (url.includes('.svg/')) {
    let parts = url.split('/');
    return parts.slice(0, -1).join('/').replace('/thumb/', '/');
  }
  return url;
}


async function getItems() {
  let data = (await axios.get('https://en.wikipedia.org/api/rest_v1/page/html/Timeline_of_the_far_future')).data;

  // create a virtual window object
  let window = domino.createWindow(data);
  let document = window.document;

  let tablesToParse = [];
  let tables = document.querySelectorAll('table');
  for (let i = 0; i < tables.length; i++) {
    // check if the table has header elements
    let headerRow = tables[i].querySelector('th');
    if (!headerRow) {
      continue;
    }
    if (tables[i].className.match(/navbox/)) {
      continue;
    }
    tablesToParse.push(tables[i]);
  }

  if (tablesToParse.length < 1) {
    console.error('No tables found in the page.');
    return;
  }

  let items = [];

  for (let i = 0; i < tablesToParse.length; i++) {
    let tableRows = tablesToParse[i].querySelectorAll('tr');
    for (let j = 0; j < tableRows.length; j++) {
      let columns = tableRows[j].querySelectorAll('td');
      if (columns.length < 3) {
        continue;
      }



      // TODO: remove when ready
      if (j > 10) {
        break;
      }

      let item = {};


      let categoryCol = columns[0];
      let yearCol = columns[1];
      let bodyCol = columns[2];


      item.categories = [];
      let categoryLink = categoryCol.querySelector('a');
      let categoryImg = categoryCol.querySelector('img');
      if (categoryLink) {
        if (categoryLink.title) {
          item.categories.push(categoryLink.title.trim().toLowerCase());
        }
      }
      if (categoryImg) {
        item.categoryImg = 'https://upload.wikimedia.org/' + urlPngToSvg(categoryImg.src);
      }
      item.categoryColor = categoryCol.style.backgroundColor || categoryCol.style.background;

      if (item.categories.length < 1) {
        item.categories.push('Unknown');
      }

      let supTags = yearCol.querySelectorAll('sup');
      for (let l = 0; l < supTags.length; l++) {
        // remove it if it contains a class of "reference"
        if (supTags[l].className.match(/reference/)) {
          yearCol.removeChild(supTags[l]);
        }
      }

      let futureYear = yearCol.innerHTML;
      console.log(futureYear);

      item.id = items.length + 1;
      item.color = 'red';
      item.faicon = item.categories[0];
      item.datetime = items.length;
      item.title = futureYear + " years from now";
      

      // build a list of references
      let refs = bodyCol.querySelectorAll('sup');
      for (let r = 0; r < refs.length; r++) {
        // TODO: use refs for links instead?
        //refs[r].parentNode.removeChild(refs[r]);
      }

      item.body = bodyCol.innerHTML;


      // build a list of links
      let links = bodyCol.querySelectorAll('a');
      let linkArr = [];
      for (let k = 0; k < links.length; k++) {
        let link = {};
        link.href = links[k].href;
        link.linkText = links[k].title || links[k].textContent;
        linkArr.push(link);
      }
      item.links = linkArr;

      // build a list of images
      if (links.length > 0) {
        let href = links[0].title || links[0].href.replace('/wiki/', '');
        let url = `https://en.wikipedia.org/api/rest_v1/page/summary/${href}`;
   
        let summary = (await axios.get(url)).data;
        if (summary.thumbnail) {
          let image = {};
          image.src = summary.thumbnail.source;
          image.link = `https://en.wikipedia.org/wiki/${href}`;
          image.caption = summary.description;
          item.image = image;
        }
      }


      items.push(item);
    }
  }

  // output the list of items to a file.
  fs.writeFileSync('./src/_data/items.json', JSON.stringify(items), 'utf8');
}


getItems();
