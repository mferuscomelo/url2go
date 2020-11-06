const form = document.querySelector('form');
const urlInput = document.querySelector('#url-input');
const keyInput = document.querySelector('#key-input');

var url;

urlInput.addEventListener('input', (event) => {
    url = urlInput.value;
    var protocol = event.target.value.match(/^https?:\/\//, '');

    if(protocol == null)
        protocol = 'https://';

    document.querySelector('#protocol').textContent = protocol;

    urlInput.value = event.target.value.replace(/^https?:\/\//, '');
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    // const expireSelected = document.querySelector('.expire');

    fetch('/create-url', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: url,
            key: keyInput.value,
            expireTime: 60, // TODO: need to implement an auto-delete feature
        })
    })
        .then(response => response.json())
        .then(body => {

            while (result.hasChildNodes()) {
                result.removeChild(result.lastChild);
            }

            console.log(JSON.stringify(body))
        })
        .catch(console.error)
});
