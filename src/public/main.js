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

var isError = true;
var hasCompleted = false;
var dbResponse;

// Listen for the click event on the submit button
$(document).ready(function() {
	
	$(".button a span").click(function() {
        if(urlInput.value == '' || urlInput.value == null || 
            keyInput.value == '' || keyInput.value == null) {
            // Error, show error dialog
            error();
            return;
        }

		var btn = $(this).parent().parent();
		var loadSVG = btn.children("a").children(".load");
        var loadBar = btn.children("div").children("span");
		
		btn.children("a").children("span").fadeOut(200, () => {
			btn.children("a").animate({
				width: 56	
			}, 100, () => {
				loadSVG.fadeIn(300);
				btn.animate({
					width: 320	
				}, 200, () => {
					btn.children('div').fadeIn(200, () => {
						loadBar.animate({
							width: '75%'
						}, {
                            duration: 5000,
                            start: createUrl2Go(),
                            step: (now, fx) => {
                                if(hasCompleted) {
                                    fx.end = '100';
                                }
                            },
                            complete: () => {
                                loadSVG.fadeOut(200, () => {
                                    var icon;

                                    if(isError) {
                                        icon = btn.children("a").children(".cross");
                                    } else {
                                        icon = btn.children("a").children(".check");
                                    }

                                    icon.fadeIn(200, () => {
                                        showResult();
                                        setTimeout( () => {
                                            btn.children("div").fadeOut(200, () => {
                                                loadBar.width(0);
                                                icon.fadeOut(200, () => {
                                                    btn.children("a").animate({
                                                        width: 150	
                                                    });
                                                    btn.animate({
                                                        width: 150
                                                    }, 300, () => {
                                                        btn.children("a").children("span").fadeIn(200);
                                                    });
                                                });
                                            });
                                        }, 2000);	
                                    });
                                });
                            }
                        });
					});
				});
			});
        });
                    
	});
});

function createUrl2Go() {
    isError = true;
    hasCompleted = false;

    hideDialogs();

    // Create new Url2Go
    fetch('/create-url', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: urlInput.value,
            key: keyInput.value,
            expireTime: 60, // TODO: need to implement an auto-delete feature
        })
    })
        .then( async (response) => {
            dbResponse = response;

            if(dbResponse.status == 200) {
                isError = false;
            } else if(dbResponse.status == 400) {
                isError = true;
            }

            hasCompleted = true;
        })
        .catch( (error) => {
            error();
        });
}

async function showResult() {
    if(dbResponse.status == 200) {
        // Success, show success dialog
        success();

        document.querySelector('#short-url').innerHTML = 'gymox.page/' + keyInput.value;
    } else if(dbResponse.status == 400) {
        // Error, show error dialog
        error();

        document.querySelector('#error-message').innerHTML = (await dbResponse.json()).errorMessage;
    }
}

// Listen for the input event on the urlInput element so that we can remove the protocol from the URL
urlInput.addEventListener('input', (event) => {
    var protocol = event.target.value.match(/^https?:\/\//);

    if(protocol == null)
        protocol = 'https://';

    document.querySelector('#protocol').textContent = protocol;

    urlInput.value = event.target.value.replace(/^https?:\/\//, '');
});

closeButtons.forEach( (button) => {
    button.addEventListener('click', (event) => {
        hideDialogs();
    })
})

function error() {
    isError = true;
    successDialog.classList.remove('visible');
    errorDialog.classList.add('visible');
}

function success() {
    isError = false;
    successDialog.classList.add('visible');
    errorDialog.classList.remove('visible');
}

function hideDialogs() {
    successDialog.classList.remove('visible');
    errorDialog.classList.remove('visible');
}