
const domino = require('domino');
const fs = require('fs');
const axios = require('axios');


async function getItems() {
  let data = (await axios.get('https://en.wikipedia.org/api/rest_v1/page/html/Timeline_of_the_far_future')).data;
  console.log(data);

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
      item.body = columns[2].innerHTML;

      let links = bodyCol.querySelectorAll('a');
      let linkArr = [];
      for (let k = 0; k < links.length; k++) {
        let link = {};
        link.href = links[k].href;
        link.linkText = links[k].title || links[k].textContent;
        linkArr.push(link);
      }
      item.links = linkArr;

      items.push(item);
    }
  }

  // output the list of items to a file.
  fs.writeFileSync('./src/_data/items.json', JSON.stringify(items), 'utf8');
}


getItems();
