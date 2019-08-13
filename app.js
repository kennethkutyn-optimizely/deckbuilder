// Client ID and API key from the Developer Console
var CLIENT_ID = '529370699140-49hqfggg3pgfdt7k6dekftpe5bul388t.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDn8xSNcp3an-8W503z0ErhTv6cSYpBZ4M';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://slides.googleapis.com/$discovery/rest?version=v1"];

var masterDeck = '1msaQkrQWsomqfVd7v6PwwbeHsKVtq2x3spNQDM96F4g';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var startButton = document.getElementById('start_button');

let destinationFolder = "";
let sourceDecks = [
  [1, "1OqByJ6ZPO2V9gfCnclCJC73s6eGgYyJGb1WuyfViAws", "Title and Agenda", "Title and Agenda", 2],
  [2, "1sigkNIYMRv-2DFc6AzxbrUK1O_eLzIn65iZ0-e0Gk34", "Digital Experience Optimization", "DXO 2.0", 14],
  [3, "19l9AQWcAxqNO_hkCD8xq1xayXujFGOP4ztcuM4wsD0s", "Platform Overview", "Platform Overview", 1],
  [4, "1l06tQGSWoodk70Pi_zNNrcYBVjTk3mfNn621PJK3zyg", "Program Management", "Program Management", 7],
  [5, "1lalHoAi0lDTY-glmTk90cL4wdrsDPalYPZGhIgBuibo", "Web Experimentation", "Web Experimentation", 6],
  [6, "1ZaYgH35n1a98hFy0IlLUuiDafL4aEiysg6Wz4EMR_Kk", "Web Personalization", "Personalization - Short", 7],
  [7, "1yATgaDsekF7X0hOnp-6zHkrVzJcSViiMs9imogP3fBI", "Web Personalization", "Personalization - Full", 12],
  [8, "153dRbmyQfQolpODktB4fmqxRzv4Ya1Yjx_V1AVPYY1A", "Web Recommendations", "Recommendations", 7],
  [9, "1a60s_pfz7zScOHUV2nGKj-30eRwPu0h3v5UMy7TXkCQ", "Performance Considerations", "Performance", 11],
  [10, "1F-qIqhKVNNfmI0vPTrzAnQn5eszZWST1GqL6flbuFIc", "Single Page Apps", "SPAs", 14],
  [11, "1MFD5UPXvHgxBEO7zZxEOrhBWsOni0ey9Jdw05ppdPa8", "Full Stack", "Full Stack", 33],
  [12, "1recSXy68mBKg6m9T16nqgTfJ3jxXr1uz8Fv5dQlYhA0", "Build vs. Buy", "Build vs Buy", 1],
  [13, "1T8UrXeyhq33JmI-ahFtPB8yZJ1VuiXbDSVQXD5cTxhw", "Stats Engine", "Stats Engine Summary", 6],
  [14, "1JfzmtQ1hYfIiLYCAY9wbLXyUhbYzhnnTOXivp_Qrbt8", "Stats Engine", "Stats Engine Story", 22],
  [15, "10VC8r6xK2-ULumD2iMymKjFYB4ZKT7Bp273J3uqqVMw", "Results and Reporting", "Results and Reporting", 7],
  [16, "1pUcHLJOy8vK-f3JKX3SP25stkjWSJ-tpzcHmXQccX1Y", "Next Steps", "Next Steps", 2]
];

let deckLengths = [];
let sectionsArray = [];
let sortedArray = [];
let createdDeckSlides = [];
let agendaText = "";

/**
 *  On load, called to load the auth2 library and API client library and ask for permission to send browser notifications
 */
function handleClientLoad() {

  if (getCookieValue("popups") != "true") {
    var popup_window = window.open("www.google.com", "myWindow", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=yes, width=10, height=10");

    try {
      popup_window.focus();
      popup_window.close();
    } catch (e) {
      document.getElementById("status").innerHTML = "Pop-up Blocker is enabled! Please choose 'Always allow popups for this site' in the address bar and then reload the page";
    }
  }
  gapi.load('client:auth2', initClient);
  if (Notification.permission !== 'denied' || Notification.permission === "default") {
    Notification.requestPermission(function(permission) {
      // If the user accepts, let's create a notification
    });
  }
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function() {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    loadClient();
    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
    startButton.onclick = handleStartClick;
  }, function(error) {
    appendPre(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'none';
    startButton.style.display = 'block'
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

var width = 1;

function move(target) {
  var elem = document.getElementById("myBar");

  var id = setInterval(frame, 10);

  function frame() {
    if (width >= target) {
      clearInterval(id);
    } else {
      width++;
      elem.style.width = width + '%';
    }
  }
}

function getCookieValue(a) {
  var b = document.cookie.match('(^|[^;]+)\\s*' + a + '\\s*=\\s*([^;]+)');
  return b ? b.pop() : '';
}

let newDeckID;

//Once the user clicks on 'Generate Deck', we should start copying the master deck, hide the generate button and create a notification button

function handleGenerateClick() {
  width = 1;

  generateDeck();
  document.getElementById('content').style.display = "none";
  document.getElementById("generate_button").style.display = 'none';

  var myDiv = document.body;
  var notifyCheckbox = document.createElement('label');
  notifyCheckbox.innerHTML = '<br><input type="checkbox" id="notifyCheckbox" value="value" checked>Notify when ready<br>';
  notifyCheckbox.name = "notifyCheckbox";
  myDiv.appendChild(notifyCheckbox);
  document.getElementById('notifyCheckbox').parentElement.style = "font-family: monospace;";

};

//After the master deck copying is complete, get the IDs of all slides in the deck and change the customer, AE, SE names, then add the agenda

function afterNewDeckGenerated(ID) {
  newDeckID = ID.result.id;
  getSlideIDs();
  changeTitle(newDeckID);
}

//Read the textboxes to determine what text to add to the agenda slide

function generateAgendaText() {
  agendaInt = 1
  for (i = 0; i < sortedArray.length; i++) {

    if (document.getElementById("checkbox" + sortedArray[i].title).checked == true && i != 0) {
      agendaText = agendaText.concat(agendaInt + ". " + sourceDecks[i][2] + '\n');
      agendaInt++;
    }
  }
}

function changeTitle(newDeckID) {
  move(50);
  document.getElementById("status").innerHTML = "Adding customer, AE and SE to title page then building agenda";

  generateAgendaText();

  gapi.client.slides.presentations.batchUpdate({
      "presentationId": newDeckID,
      "resource": {
        "requests": [{
            "replaceAllText": {
              "pageObjectIds": [
                createdDeckSlides[0]
              ],
              "containsText": {
                "text": "COMPANYNAME"
              },
              "replaceText": document.getElementById("customerName").value
            }
          },
          {
            "replaceAllText": {
              "pageObjectIds": [
                createdDeckSlides[0]
              ],
              "containsText": {
                "text": "AEName"
              },
              "replaceText": document.getElementById("AEName").value
            }
          },
          {
            "replaceAllText": {
              "pageObjectIds": [
                createdDeckSlides[0]
              ],
              "containsText": {
                "text": "SENAME"
              },
              "replaceText": document.getElementById("SEName").value
            }
          },
          {
            "replaceAllText": {
              "pageObjectIds": [
                createdDeckSlides[1]
              ],
              "containsText": {
                "text": "AGENDAHERE"
              },
              "replaceText": agendaText
            }
          }
        ]
      }
    })
    .then(function(response) {},
      function(err) {
        console.error("Execute error", err);
      });
}


function getSlideIDs() {

  document.getElementById("status").innerHTML = "getting IDs of slides in new deck";

  gapi.client.slides.presentations.get({
      presentationId: newDeckID,

    })
    .then(function(response) {
        // Handlecons the results here (response.result has the parsed body).
        combineNamesAndIds(response.result.slides);
        createdDeckSlides = response.result.slides;
      },
      function(err) {
        console.error("Execute error", err);
      });
}

function combineNamesAndIds(array) {

  document.getElementById("status").innerHTML = "combining names and IDs";

  let labledSlides = [];
  for (i = 0; i < sortedArray.length; i++) {
    for (j = 0; j < sortedArray[i].length; j++) {
      labledSlides.push(sortedArray[i].title);
    }
  }
  let slideNamesAndIds = [];
  for (i = 0; i < array.length; i++) {
    nameAndId = {
      name: labledSlides[i],
      ID: array[i]
    };
    slideNamesAndIds.push(nameAndId);
  }
  getCheckboxes(slideNamesAndIds);
};

function getCheckboxes(slideNamesAndIds) {

  document.getElementById("status").innerHTML = "Reading Checkboxes";

  let toDelete = [];
  for (i = 0; i < sortedArray.length; i++) {
    if (document.getElementById("checkbox" + sortedArray[i].title).checked == false) {
      for (j = 0; j < slideNamesAndIds.length; j++) {
        if (sortedArray[i].title == slideNamesAndIds[j].name) {
          toDelete.push(slideNamesAndIds[j].ID.objectId);
        }
      }
    } else {
      window['optimizely'] = window['optimizely'] || [];
      window['optimizely'].push({
        type: "event",
        eventName: sortedArray[i].title,
      });
    }
  }

  let deletionRequest = "[";
  for (i = 0; i < toDelete.length; i++) {
    deletionRequest = deletionRequest.concat('{"deleteObject": {"objectId": "' + toDelete[i] + '"}},');
  }
  deletionRequest = deletionRequest.slice(0, -1);
  deletionRequest = deletionRequest.concat("]");
  if (toDelete.length == 0) {
    finish();
  } else {
    deleteSlides(deletionRequest);
  }
  return toDelete;
}


function deleteSlides(deletionRequest) {
  move(75);
  document.getElementById("status").innerHTML = "Deleting unneeded sections";
  deletionRequest = JSON.parse(deletionRequest);
  gapi.client.slides.presentations.batchUpdate({
      presentationId: newDeckID,
      resource: {
        requests: deletionRequest
      }
    })
    .then(function(response) {

        finish();
      },
      function(err) {
        console.error("Execute error", err);
      });
}

function finish() {

  document.cookie = "popups=true";

  url = "https://docs.google.com/presentation/d/" + newDeckID;
  document.getElementById('notifyCheckbox').parentElement.style.display = 'none';
  move(100);
  var btn = document.createElement("BUTTON");
  btn.id = "openInNewTab"
  btn.style = "width: 200px; height: 30px; font-size: 16px; color: #0074ff; margin-top: 10px";
  btn.innerHTML = 'Open Deck in New Tab';
  btn.onclick = function() {
    window.open(url, "_blank");
  };
  document.body.appendChild(btn);
  document.getElementById("status").innerHTML = "Done";
  document.getElementById("myProgress").style = "visibility: hidden;";

  if (document.getElementById("notifyCheckbox").checked == true) {
    var notification = new Notification("SE Deck Builder", {
      "body": "Your deck is ready; click here to open",
      "icon": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/Optimizely_Logo.png/220px-Optimizely_Logo.png"
    });
    notification.onclick = function(event) {
      event.preventDefault(); // prevent the browser from focusing the Notification's tab
      window.open(url, "_blank");
    }
  }
}


function generateDeck() {
  move(10);
  document.getElementById("myProgress").style = "visibility: visible;";

  document.getElementById("status").innerHTML = "Copying Master Deck";
  gapi.client.drive.files.copy({
      "fileId": masterDeck,
      "resource": {
        "name": document.getElementById("customerName").value + " | Optimizely Overview",
        "parents": [
          destinationFolder
        ]
      }
    })
    .then(function(response) {
        // Handle the results here (response.result has the parsed body).
        afterNewDeckGenerated(response)
      },
      function(err) {
        console.error("Execute error", err);
      });
}



function loadClient() {
  gapi.client.setApiKey(API_KEY);
  return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest")
    .then(function() {
        console.log("GAPI client loaded for API");
      },
      function(err) {
        console.error("Error loading GAPI client for API", err);
      });
}
/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

function handleStartClick() {
  getSectionLengthsAlt();
  //sortedArray = getSectionLengthsAlt();
  startButton.style.display = 'none';
  createPicker();

  function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
  }

  async function getSectionLengths() {
    document.getElementById("status").innerHTML = "Reading source decks";

    document.getElementById("myProgress").style = "visibility: visible;";

    let decks = sourceDecks;

    for (var i = 0; i < decks.length; i++) {

      nthDeck = i + 1;
      percentProgress = nthDeck / decks.length * 100;
      move(percentProgress);
      document.getElementById("status").innerHTML = "Reading Source Deck " + nthDeck + " of " + decks.length + "<br>";
      let currentDeckID = decks[i][1];
      let index = decks[i][0]
      await gapi.client.slides.presentations.get({
        presentationId: currentDeckID
      }).then(function(response) {
        var presentation = response.result;
        var length = presentation.slides.length;
        let title = presentation.title;
        section = {
          index: index,
          length: length,
          title: title
        };
        sectionsArray.push(section);
        sortedArray = sectionsArray.sort(function(a, b) {
          return a.index - b.index;
        });

      }, function(response) {
        appendPre('Error: ' + response.result.error.message);
      });
    }
    renderCheckboxes();

  }
}


function getSectionLengthsAlt() {

  let decks = sourceDecks;

  for (var i = 0; i < decks.length; i++) {
    let currentDeckID = decks[i][1];
    let index = decks[i][0]
    var length = decks[i][4];
    let title = decks[i][3];
    section = {
      index: index,
      length: length,
      title: title
    };
    sectionsArray.push(section);
    sortedArray = sectionsArray.sort(function(a, b) {
      return a.index - b.index;
    });

  }
  renderCheckboxes();

}


function renderCheckboxes() {



  document.getElementById("status").innerHTML = "rendering checkboxes and input fields";

  var customerTitle = document.createElement("h2");
  customerTitle.innerHTML = "Customer Name";
  document.getElementById("content").appendChild(customerTitle);

  var customerNameInput = document.createElement("input");
  customerNameInput.setAttribute('type', 'text');
  customerNameInput.setAttribute('id', 'customerName');
  document.getElementById("content").appendChild(customerNameInput);
  var br = document.createElement("br");
  document.getElementById("content").appendChild(br);

  var AETitle = document.createElement("h2");
  AETitle.innerHTML = "AE Name";
  document.getElementById("content").appendChild(AETitle);

  var AENameInput = document.createElement("input");
  AENameInput.setAttribute('type', 'text');
  AENameInput.setAttribute('id', 'AEName');
  document.getElementById("content").appendChild(AENameInput);
  var br = document.createElement("br");
  document.getElementById("content").appendChild(br);

  var SETitle = document.createElement("h2");
  SETitle.innerHTML = "SE Name";
  document.getElementById("content").appendChild(SETitle);

  var SENameInput = document.createElement("input");
  SENameInput.setAttribute('type', 'text');
  SENameInput.setAttribute('id', 'SEName');
  document.getElementById("content").appendChild(SENameInput);
  var br = document.createElement("br");
  document.getElementById("content").appendChild(br);

  var sectionsTitle = document.createElement("h2");
  sectionsTitle.innerHTML = "Sections";
  document.getElementById("content").appendChild(sectionsTitle);

  var node = document.createElement("LI");

  for (var i = 0; i < sortedArray.length; i++) {

    var myDiv = document.getElementById("content");

    // creating checkbox element 
    var checkbox = document.createElement('label');
    checkbox.innerHTML = '<input type="checkbox" id="checkbox' + sortedArray[i].title + '" value="value" checked>' + sortedArray[i].title + ' (' + sortedArray[i].length + ' slides)<br>';

    checkbox.name = sortedArray[i].title;


    myDiv.appendChild(checkbox);
  };


  var br = document.createElement("br");
  document.getElementById("content").appendChild(br);

  var btn = document.createElement("BUTTON");
  btn.innerHTML = 'Generate Deck';
  btn.id = "generate_button";
  btn.style = "width: 200px; height: 30px; font-size: 16px; color: #0074ff";
  btn.addEventListener('click', handleGenerateClick);
  document.body.appendChild(btn);

  document.getElementById("status").innerHTML = "Ready";
  document.getElementById("myProgress").style = "visibility: hidden;";

  document.getElementById('checkboxTitle and Agenda').disabled = 'disabled';


};

// Create and render a Picker object for choosing output folder.
function createPicker() {

  var view = new google.picker.View(google.picker.ViewId.FOLDERS);
  var folderView = new google.picker.DocsView(google.picker.ViewId.FOLDERS);
  folderView.setSelectFolderEnabled(true);
  view.setMimeTypes("application/vnd.google-apps.folder");
  var picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.NAV_HIDDEN)
    //.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .enableFeature(google.picker.Feature.MINE_ONLY)
    //.setAppId(appId)
    .setOAuthToken(oauthToken)
    .addView(folderView)
    .setDeveloperKey(API_KEY)
    .setCallback(pickerCallback)
    .setTitle("Choose Output Folder")
    .build();
  picker.setVisible(true);
}

// A simple callback implementation.
function pickerCallback(data) {
  if (data.action == google.picker.Action.PICKED) {
    var fileId = data.docs[0].id;
    destinationFolder = fileId;
  }
}


function loadPicker() {
  gapi.load('auth', {
    'callback': onAuthApiLoad
  });
  gapi.load('picker', {
    'callback': onPickerApiLoad
  });
}

function onAuthApiLoad() {
  window.gapi.auth.authorize({
      'client_id': CLIENT_ID,
      'scope': SCOPES,
      'immediate': false
    },
    handleAuthResult);
}

function onPickerApiLoad() {
  pickerApiLoaded = true;
}

function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    oauthToken = authResult.access_token;
  }
}

var pickerApiLoaded = false;
var oauthToken;