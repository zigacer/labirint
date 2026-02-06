// LineDraw.js

// ✅ Full list of coordinates for the solution line
const points = [
  [234,2],[234,10],[202,10],[202,26],[282,26],[282,42],[298,42],[298,58],
  [282,58],[282,74],[266,74],[266,90],[250,90],[250,138],[234,138],[234,154],
  [218,154],[218,122],[234,122],[234,90],[218,90],[218,106],[202,106],[202,186],
  [186,186],[186,202],[170,202],[170,170],[186,170],[186,154],[170,154],[170,138],
  [122,138],[122,170],[106,170],[106,186],[122,186],[122,234],[106,234],[106,218],
  [90,218],[90,202],[74,202],[74,218],[58,218],[58,282],[106,282],[106,298],
  [122,298],[122,314],[106,314],[106,330],[122,330],[122,346],[106,346],[106,362],
  [90,362],[90,394],[74,394],[74,410],[106,410],[106,426],[138,426],[138,474],
  [154,474],[154,458],[170,458],[170,474],[186,474],[186,410],[202,410],[202,442],
  [234,442],[234,474],[250,474],[250,482]
];

// ✅ Grab canvas and button
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const button = document.getElementById("solveButton");

// ✅ Clear canvas initially
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Function to draw the line progressively
function drawLine(progress) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  
  const maxIndex = Math.floor(points.length * progress);
  
  points.forEach(([x, y], i) => {
    if (i > maxIndex) return;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.lineCap = "square";
  ctx.lineJoin = "round";
  ctx.stroke();
}

// ✅ Animate line on button click
button.addEventListener("click", () => {
  let start = null;
  const duration = 10000; // 10 seconds

  function animate(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    let progress = elapsed / duration;
    if (progress > 1) progress = 1;
    
    drawLine(progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
});
