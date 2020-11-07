const form = document.querySelector('form');
const urlInput = document.querySelector('#url-input');
const keyInput = document.querySelector('#key-input');
const urlButton = document.querySelector('#short-url');
const successDialog = document.querySelector('.success-dialog');
const errorDialog = document.querySelector('.error-dialog');

urlInput.value = '';
keyInput.value = '';

urlInput.addEventListener('input', (event) => {
    var protocol = event.target.value.match(/^https?:\/\//, '');

    if(protocol == null)
        protocol = 'https://';

    document.querySelector('#protocol').textContent = protocol;

    urlInput.value = event.target.value.replace(/^https?:\/\//, '');
});

form.addEventListener('submit', (event) => {
    event.preventDefault();

    if(urlInput.value == '' || urlInput.value == null) {
        error();
        return;
    }

    // const expireSelected = document.querySelector('.expire');

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
            // response.json();
            // console.log(response);

            // while (result.hasChildNodes()) {
            //     result.removeChild(result.lastChild);
            // }

            if(response.status == 200) {
                success();

                document.querySelector('#short-url').innerHTML = 'url2go.org/' + keyInput.value;
            } else if(response.status == 400) {
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
