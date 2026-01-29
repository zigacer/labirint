const path = document.getElementById('crta');
const length = path.getTotalLength();
 
path.style.strokeDasharray = length;
path.style.strokeDashoffset = length;
 
path.getBoundingClientRect();
 
path.style.animation = 'draw-line 10s linear forwards';