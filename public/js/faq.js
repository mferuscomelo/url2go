const faq = document.querySelector('.faq');
const overlay = document.querySelector('.overlay');
const acc = document.getElementsByClassName("accordion");
const panel = document.getElementsByClassName('panel');
const closeButton = document.querySelector('.close');
const faqButton = document.querySelector('.faq-button');

for (var i = 0; i < acc.length; i++) {
    acc[i].onclick = function() {
        var setClasses = !this.classList.contains('active');
        setClass(acc, 'active', 'remove');
        setClass(panel, 'show', 'remove');

        if (setClasses) {
            this.classList.toggle("active");
            this.nextElementSibling.classList.toggle("show");
        }
    }
}

function setClass(els, className, fnName) {
    for (var i = 0; i < els.length; i++) {
        els[i].classList[fnName](className);
    }
}

closeButton.addEventListener('click', () => {
    faq.classList.remove('visible');
    overlay.classList.remove('visible');
});

overlay.addEventListener('click', () => {
    faq.classList.remove('visible');
    overlay.classList.remove('visible');
});

faqButton.addEventListener('click', () => {
    faq.classList.add('visible');
    overlay.classList.add('visible');
});

