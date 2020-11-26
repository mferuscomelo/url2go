const overlay = document.querySelector('.overlay');
const dialogButtons = document.querySelectorAll(".dialog-button");

dialogButtons.forEach( (button) => {
    button.addEventListener('click', () => {
        const dialogRef = document.querySelector(`#${button.getAttribute('data-dialog')}-dialog`);

        dialogRef.classList.add('visible');
        overlay.classList.add('visible');

        dialogRef.querySelector('.close').addEventListener('click', () => {
            dialogRef.classList.remove('visible');
            overlay.classList.remove('visible');      
        });

        overlay.addEventListener('click', () => {
            dialogRef.classList.remove('visible');
            overlay.classList.remove('visible');      
        });
    });
});