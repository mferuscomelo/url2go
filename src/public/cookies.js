const overlay = document.querySelector('.overlay');
const cookiesDialog = document.querySelector(".cookies-dialog");
const acceptButton = document.querySelector(".accept-button");
const saveButton = document.querySelector(".save-button");

$(document).ready(function() {
    // Check if cookies have already been accepted
    if(localStorage.getItem('no_cookies') == null) {
        document.getElementById('accept-analytics').checked = true;
        // Show dialog for cookies
        cookiesDialog.classList.add('visible');
        overlay.classList.add('visible');
    }
});

acceptButton.addEventListener('click', () => {
    localStorage.setItem('no_cookies', false);
    cookiesDialog.classList.remove('visible');
    overlay.classList.remove('visible');
});

saveButton.addEventListener('click', () => {
    if(!document.getElementById('accept-analytics').checked) {
        localStorage.setItem('no_cookies', true);
    }
    cookiesDialog.classList.remove('visible');
    overlay.classList.remove('visible');
});