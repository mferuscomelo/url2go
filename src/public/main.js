window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-L0QSJV7D9P', {cookie_flags: 'SameSite=None;Secure'});

// Get the form component so that we can listen for the submit event
const form = document.querySelector('form');

// Get the submit button so that we can listen for the click event
const submitButton = document.querySelector('#submitButton');

// Get the input for the long URL so that we can query the value
const urlInput = document.querySelector('#url-input');

// Get the input for the key so that we can query the value
const keyInput = document.querySelector('#key-input');

// Get the button to display the short URL so that the user can copy it to clipboard
const urlButton = document.querySelector('#short-url');

// Get the success dialog element so that we can show it
const successDialog = document.querySelector('.success-dialog');

// Get the error dialog element so that we can show it
const errorDialog = document.querySelector('.error-dialog');

// Get the close buttons for the dialogs
const closeButtons = document.querySelectorAll('.close-icon');

// Reset the input fields on page load
urlInput.value = '';
keyInput.value = '';

var protocol;

// Listen for the click event on the submit button
$(document).ready(function() {	
	$(".button a span").click(function() {
        if(urlInput.value == '' || urlInput.value == null || 
            keyInput.value == '' || keyInput.value == null) {
            // Error, show error dialog
            error();
            return;
        }

		var btn = $('#submitButton');
		var loadSVG = btn.children("a").children(".load");
        var loadBar = btn.children("div").children("span");

        queueAnimations(function() {
            return btn.children("a").children("span").fadeOut(200);
        }, function() {
            return btn.children("a").animate({width: 42.33}, 100);
        }, function () {
            loadSVG.fadeIn(300);
            return btn.animate({width: 320}, 200);
        }, function () {
            createUrl2Go();
            return btn.children('div').fadeIn(200);
        }, function () {
            return loadBar.animate({width: '75%'}, 1500);
        });                 
	});
});

urlButton.addEventListener('click', () => {
    navigator.clipboard.writeText(target.innerHTML);
})

// Listen for the input event on the urlInput element so that we can remove the protocol from the URL
urlInput.addEventListener('input', (event) => {
    protocol = event.target.value.match(/^https?:\/\//);

    if(protocol == null)
        protocol = 'https://';

    document.querySelector('#protocol').textContent = protocol;

    urlInput.value = event.target.value.replace(/^https?:\/\//, '');
});

document.querySelectorAll('input').forEach( (input) => {
    input.addEventListener('focus', (event) => {
        event.target.value = '';
    })
});

closeButtons.forEach( (button) => {
    button.addEventListener('click', (event) => {
        hideDialogs();
    })
});

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

function createUrl2Go() {  
    hideDialogs();

    // Create new Url2Go
    fetch('/create-url', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: protocol + urlInput.value,
            key: keyInput.value,
            expireTime: 60, // TODO: need to implement an auto-delete feature
        })
    })
        .then( async (response) => {
            if(response.status == 200) {
                gtag('event', 'create_url');
            }

            var btn = $('#submitButton');
            var loadSVG = btn.children("a").children(".load");
            var loadBar = btn.children("div").children("span");
            var icon;

            queueAnimations(function () {
                return loadBar.animate({width: '100%'}, 500);
            }, function () {
                return loadSVG.fadeOut(200);
            }, function () {
                if(response.status === 400) {
                    icon = btn.children("a").children(".cross");
                } else {
                    icon = btn.children("a").children(".check");
                }
    
                return icon.fadeIn(200);
            }, function () {
                showResult(response);
    
                return btn.children("div").fadeOut(200);
            }, function() {
                loadBar.width(0);
                        
                return icon.fadeOut(200);
            }, function() {
                btn.children("a").animate({
                    width: 150	
                });
    
                return btn.animate({width: 150}, 300);
            }, function() {
                return btn.children("a").children("span").fadeIn(200);
            });
        })
        .catch( (error) => {
            console.error('Error: ', error);
            error();
        });
}

async function showResult(response) {
    if(response.status === 200) {
        // Success, show success dialog
        success();

        document.querySelector('#short-url').innerHTML = 'gymox.page/' + keyInput.value;
    } else if(response.status === 400) {
        // Error, show error dialog
        error();

        document.querySelector('#error-message').innerHTML = (await response.json()).errorMessage;
    }
}

function error() {
    successDialog.classList.remove('visible');
    errorDialog.classList.add('visible');
}

function success() {
    successDialog.classList.add('visible');
    errorDialog.classList.remove('visible');
}

function hideDialogs() {
    successDialog.classList.remove('visible');
    errorDialog.classList.remove('visible');
}