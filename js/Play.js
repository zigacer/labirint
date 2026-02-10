// Play.js: WASD movement for a circle on the canvas
document.addEventListener('DOMContentLoaded', () => {
	const canvas = document.getElementById('maze-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	const radius = 3;
	let x = canvas.width / 2;
	let y = radius + 5; // Start near the top center
	const speed = 4;
	let playing = false;

	function clearCanvas() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	function drawCircle() {
		clearCanvas();
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		ctx.fillStyle = '#ff0000'; // Red fill
		ctx.fill();
		ctx.strokeStyle = '#b20000'; // Darker red stroke
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	function move(dx, dy) {
		x += dx;
		y += dy;
		// Clamp to canvas bounds
		x = Math.max(radius, Math.min(canvas.width - radius, x));
		y = Math.max(radius, Math.min(canvas.height - radius, y));
		drawCircle();
	}

	document.addEventListener('keydown', (e) => {
		if (!playing) return;
		switch (e.key.toLowerCase()) {
			case 'w':
				move(0, -speed);
				break;
			case 'a':
				move(-speed, 0);
				break;
			case 's':
				move(0, speed);
				break;
			case 'd':
				move(speed, 0);
				break;
		}
	});

	// Hide player until play button is pressed
	clearCanvas();

	const playBtn = document.getElementById('play-btn');
	if (playBtn) {
		playBtn.addEventListener('click', () => {
			x = canvas.width / 2;
			y = radius + 5;
			playing = true;
			drawCircle();
			// Hide the solution line if visible
			const solutionLine = document.getElementById('solution-anim');
			if (solutionLine) {
				solutionLine.style.visibility = 'hidden';
				solutionLine.style.animation = 'none';
			}
		});
	}

	const resitevBtn = document.getElementById('start-btn');
	if (resitevBtn) {
		resitevBtn.addEventListener('click', () => {
			playing = false;
			clearCanvas();
		});
	}
});
