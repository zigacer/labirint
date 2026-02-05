document.addEventListener("DOMContentLoaded", () => {
  const path = document.getElementById("crta");
  const length = path.getTotalLength();

  
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
  path.style.animation = "none";
});
const button = document.getElementById("solveButton");
const path = document.getElementById("crta");

button.addEventListener("click", () => {
  const length = path.getTotalLength();


  path.style.animation = "none";
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;


  path.getBoundingClientRect();

 
  path.style.animation = "draw-line 10s linear forwards";

  
  path.onanimationend = () => {
   
    path.style.animation = "none";
    path.style.strokeDashoffset = length;
  };
});
