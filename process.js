
const domino = require('domino');
const fs = require('fs');
const axios = require('axios');


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


      let yearCol = columns[1];
      let bodyCol = columns[2];

      let supTags = yearCol.querySelectorAll('sup');
      for (let l = 0; l < supTags.length; l++) {
        // remove it if it contains a class of "reference"
        if (supTags[l].className.match(/reference/)) {
          yearCol.removeChild(supTags[l]);
        }
      }

      let futureYear = yearCol.innerHTML;
      console.log(futureYear);

      let item = {};
      item.id = items.length + 1;
      item.categories = ['cat'];
      item.color = 'red';
      item.faicon = 'cat';
      item.datetime = items.length;
      item.title = futureYear;
      

      // build a list of references
      let refs = bodyCol.querySelectorAll('sup');
      for (let r = 0; r < refs.length; r++) {
        // TODO: use refs for links instead?
        refs[r].parentNode.removeChild(refs[r]);
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
