// Get the submit button so that we can listen for the click event
const submitButton = $('#submitButton');

// Get the input for the long URL so that we can query the value
const urlInput = document.querySelector('#url-input');

// Get the input for the key so that we can query the value
const keyInput = document.querySelector('#key-input');

// Get the success dialog element so that we can show it
const successDialog = document.querySelector('.success-dialog');

// Get the error dialog element so that we can show it
const errorDialog = document.querySelector('.error-dialog');

// For copying the short URL to the clipboard
const shortUrlButton = document.querySelector('#short-url');

const analytics = firebase.analytics();

// Reset the input fields on page load
urlInput.value = '';
keyInput.value = '';

var protocol;

// Listen for the click event on the submit button
submitButton.click( () => {
    if(urlInput.value == '' || urlInput.value == null || 
        keyInput.value == '' || keyInput.value == null) {
        // Error, show error dialog
        error();
        return;
    }

    // Start to animate button (wait at 75% until response from db)
    queueAnimations(function() {
        return submitButton.children('a').children('span').fadeOut(200);
    }, function() {
        return submitButton.children('a').animate({width: 43}, 100);
    }, function () {
        submitButton.children('a').children('.load').fadeIn(300);
        return submitButton.animate({width: 320}, 200);
    }, function () {
        createUrl2Go();
        return submitButton.children('div').fadeIn(200);
    }, function () {
        submitButton.children('div').children('span').width(0);
        return submitButton.children('div').children('span').animate({width: '75%'}, 1500);
    });
});

// For copy to clipboard
shortUrlButton.addEventListener('click', (event) => {
    navigator.clipboard.writeText(event.target.innerHTML);
    shortUrlButton.setAttribute("data-balloon", "Fertig!");
    setTimeout( () => {
        shortUrlButton.setAttribute("data-balloon", "In die Zwischenablage kopieren");
    }, 2000);
})

// Listen for the input event on the urlInput element so that we can remove the protocol from the URL
urlInput.addEventListener('input', (event) => {
    protocol = event.target.value.match(/^https?:\/\//);

    if(protocol == null)
        protocol = 'https://';

    document.querySelector('#protocol').textContent = protocol;

    urlInput.value = event.target.value.replace(/^https?:\/\//, '');
});

// Clear inputs on focus
document.querySelectorAll('input').forEach( (input) => {
    input.addEventListener('focus', (event) => {
        event.target.value = '';
    })
});

// Enable close buttons for the dialogs
document.querySelectorAll('.close-icon').forEach( (button) => {
    button.addEventListener('click', (event) => {
        hideDialogs();
    })
});

// Function to play multiple animations
function queueAnimations(start) {
    var rest = [].splice.call(arguments, 1),
        promise = $.Deferred();

    if (start) {
        $.when(start()).then(function () {
            queueAnimations.apply(window, rest);
        });
    } else {
        promise.resolve();
    }
    return promise;
}

// Function to create Url2Go
function createUrl2Go() {  
    hideDialogs();

    // Create new Url2Go
    fetch('/create-url', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "id": keyInput.value,
            "url": protocol + urlInput.value,
        }),
        redirect: 'follow'
    })
        .then( async (response) => {
            // Log created_url event in Google Analytics
            if(response.ok) {
                analytics.logEvent('created_url');
            }

            // Continue animating the button from 75% to 100%
            var loadSVG = submitButton.children('a').children('.load');
            var loadBar = submitButton.children('div').children('span');
            var icon;

            queueAnimations(function () {
                return loadBar.animate({width: '100%'}, 500);
            }, function () {
                return loadSVG.fadeOut(200);
            }, function () {
                if(!response.ok) {
                    icon = submitButton.children('a').children('.cross');
                } else {
                    icon = submitButton.children('a').children('.check');
                }
    
                return icon.fadeIn(200);
            }, function () {
                showResult(response);
    
                return submitButton.children('div').fadeOut(200);
            }, function() {
                loadBar.width(0);
                        
                return icon.fadeOut(200);
            }, function() {
                submitButton.children('a').animate({
                    width: 100	
                });
    
                return submitButton.animate({width: 100}, 300);
            }, function() {
                return submitButton.children('a').children('span').fadeIn(200);
            });
        })
        .catch( (error) => {
            console.error('Error: ', error);
            error();
        });
}

// Function to show the success/error dialogs
async function showResult(response) {
    const result = await response.json();
    
    if(response.ok) {
        // Success, show success dialog
        success();

        document.querySelector('#short-url').innerHTML = `gymox.page/${result.id}`;
    } else {
        // Error, show error dialog
        error();

        document.querySelector('#error-message').innerHTML = result.message;
    }
}

// Function to show error dialog
function error() {
    successDialog.classList.remove('visible');
    errorDialog.classList.add('visible');
}

// Function to show success dialog
function success() {
    successDialog.classList.add('visible');
    errorDialog.classList.remove('visible');
}

// Function to hide both dialogs
function hideDialogs() {
    successDialog.classList.remove('visible');
    errorDialog.classList.remove('visible');
}