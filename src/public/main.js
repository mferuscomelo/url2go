// Get the form component so that we can listen for the submit event
const form = document.querySelector('form');

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

// Reset the input fields on page load
urlInput.value = '';
keyInput.value = '';

// Listen for the input event on the urlInput element so that we can remove the protocol from the URL
urlInput.addEventListener('input', (event) => {
    var protocol = event.target.value.match(/^https?:\/\//, '');

    if(protocol == null)
        protocol = 'https://';

    document.querySelector('#protocol').textContent = protocol;

    urlInput.value = event.target.value.replace(/^https?:\/\//, '');
});

// Listen for the submit event 
form.addEventListener('submit', (event) => {
    event.preventDefault();

    if(urlInput.value == '' || urlInput.value == null) {
        // Error, show error dialog
        error();
        return;
    }

    // Cretae new Url2Go
    fetch('/create-url', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: 'https://' + urlInput.value,
            key: keyInput.value,
            expireTime: 60, // TODO: need to implement an auto-delete feature
        })
    })
        .then( (response) => {
            if(response.status == 200) {
                // Success, show success dialog
                success();

                document.querySelector('#short-url').innerHTML = 'url2go.org/' + keyInput.value;
            } else if(response.status == 400) {
                // Error, show error dialog
                error();

                document.querySelector('#error-message').innerHTML = 'Etwas ist schief gelaufen. Bitte versuche es erneut.'
            }
        })
        .catch( (error) => {
            error();
        });
});

function error() {
    successDialog.classList.remove('visible');
    errorDialog.classList.add('visible');
}

function success() {
    successDialog.classList.add('visible');
    errorDialog.classList.remove('visible');
}
