

const https = require('https');
const domino = require('domino');


function loadRemoteURL(url, callback) {
  https.get(url, function(response) {
    let data = '';
    response.on('data', function(chunk) {
      data += chunk;
    });
    response.on('end', function() {
      callback(data);
    });
  });
}

loadRemoteURL('https://en.wikipedia.org/api/rest_v1/page/html/Timeline_of_the_far_future', function(data) {
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
      let supTags = yearCol.querySelectorAll('sup');
      for (let l = 0; l < supTags.length; l++) {
        // remove it if it contains a class of "reference"
        if (supTags[l].className.match(/reference/)) {
          yearCol.removeChild(supTags[l]);
        }
      }

      let futureYear = yearCol.textContent.trim();

      console.log(futureYear);
      //items.push(futureYear);
    }
  }

});


