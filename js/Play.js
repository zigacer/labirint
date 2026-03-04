// Play.js: WASD movement with mission objectives.
document.addEventListener('DOMContentLoaded', () => {
	const canvas = document.getElementById('maze-canvas');
	if (!canvas) return;

	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	const timerDiv = document.getElementById('timer-div');
	const missionChip = document.getElementById('mission-chip');
	const coresEnabled = false;

	const radius = 3;
	const speed = 4;
	const squareSize = 22;
	const totalCores = coresEnabled ? 3 : 0;
	const startPos = { x: canvas.width / 2, y: radius + 5 };
	const exitGate = { x: canvas.width / 2, y: canvas.height - 7, r: 10 };

	let x = startPos.x;
	let y = startPos.y;
	let playing = false;
	let timer = null;
	let timeLeft = 120;
	let squares = [];
	let hintShown = false;

	const playerIcon = createPlayerIcon(15);
	const mazeAlert = Swal.mixin({
		heightAuto: false,
		background: '#fff4dc',
		color: '#10203a',
		confirmButtonText: 'V redu',
		buttonsStyling: false,
		customClass: {
			popup: 'maze-alert-popup',
			title: 'maze-alert-title',
			htmlContainer: 'maze-alert-text',
			confirmButton: 'maze-alert-confirm'
		}
	});

	function setMissionStatus(text) {
		if (missionChip) missionChip.textContent = `Status: ${text}`;
	}

	function updateCollectChip() {
		if (!coresEnabled) return;
	}

	function stopCountdown() {
		if (!timer) return;
		clearInterval(timer);
		timer = null;
	}

	function updateTimerDisplay() {
		if (!timerDiv) return;
		const min = Math.floor(timeLeft / 60);
		const sec = (timeLeft % 60).toString().padStart(2, '0');
		timerDiv.textContent = `Cas: ${min}:${sec}`;
		timerDiv.classList.toggle('warning', timeLeft <= 20 && playing);
	}

	function startCountdown() {
		timeLeft = 120;
		updateTimerDisplay();
		stopCountdown();
		timer = setInterval(() => {
			timeLeft--;
			updateTimerDisplay();
			if (timeLeft > 0) return;

			playing = false;
			stopCountdown();
			clearCanvas();
			setMissionStatus('Konec igre');
			mazeAlert.fire({
				icon: 'error',
				title: 'Čas je potekel!',
				text: 'Nisi pravočasno prišel do izhoda.'
			});
		}, 1000);
	}

	function createPlayerIcon(size) {
		const iconCanvas = document.createElement('canvas');
		iconCanvas.width = size;
		iconCanvas.height = size;
		const iconCtx = iconCanvas.getContext('2d');
		const center = size / 2;

		iconCtx.save();
		iconCtx.translate(center, center);

		// Outer glow ring.
		iconCtx.beginPath();
		iconCtx.arc(0, 0, size * 0.46, 0, 2 * Math.PI);
		iconCtx.fillStyle = 'rgba(70, 215, 255, 0.16)';
		iconCtx.fill();

		// Core hull.
		iconCtx.beginPath();
		iconCtx.arc(0, 0, size * 0.35, 0, 2 * Math.PI);
		iconCtx.fillStyle = '#e9f8ff';
		iconCtx.fill();
		iconCtx.lineWidth = 1.2;
		iconCtx.strokeStyle = '#4dd9ff';
		iconCtx.stroke();

		// Cockpit.
		iconCtx.beginPath();
		iconCtx.arc(0, -size * 0.07, size * 0.14, 0, 2 * Math.PI);
		iconCtx.fillStyle = '#8ce6ff';
		iconCtx.fill();
		iconCtx.lineWidth = 1;
		iconCtx.strokeStyle = '#0c6fad';
		iconCtx.stroke();

		// Side wings.
		iconCtx.beginPath();
		iconCtx.moveTo(-size * 0.12, size * 0.04);
		iconCtx.lineTo(-size * 0.44, size * 0.19);
		iconCtx.lineTo(-size * 0.12, size * 0.26);
		iconCtx.closePath();
		iconCtx.fillStyle = '#ff4f94';
		iconCtx.fill();

		iconCtx.beginPath();
		iconCtx.moveTo(size * 0.12, size * 0.04);
		iconCtx.lineTo(size * 0.44, size * 0.19);
		iconCtx.lineTo(size * 0.12, size * 0.26);
		iconCtx.closePath();
		iconCtx.fillStyle = '#ff4f94';
		iconCtx.fill();

		// Center stripe.
		iconCtx.beginPath();
		iconCtx.moveTo(0, -size * 0.24);
		iconCtx.lineTo(size * 0.07, size * 0.18);
		iconCtx.lineTo(-size * 0.07, size * 0.18);
		iconCtx.closePath();
		iconCtx.fillStyle = '#46d7ff';
		iconCtx.fill();

		// Engine glow.
		iconCtx.beginPath();
		iconCtx.arc(0, size * 0.29, size * 0.12, 0, 2 * Math.PI);
		iconCtx.fillStyle = '#ffe473';
		iconCtx.fill();

		iconCtx.beginPath();
		iconCtx.arc(0, size * 0.32, size * 0.06, 0, 2 * Math.PI);
		iconCtx.fillStyle = '#ff9b52';
		iconCtx.fill();

		// Small highlight.
		iconCtx.beginPath();
		iconCtx.arc(-size * 0.1, -size * 0.1, size * 0.05, 0, 2 * Math.PI);
		iconCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
		iconCtx.fill();

		iconCtx.restore();
		return iconCanvas;
	}

	function circleIntersectsLine(cx, cy, r, x1, y1, x2, y2) {
		const dx = x2 - x1;
		const dy = y2 - y1;
		const lengthSq = dx * dx + dy * dy;
		if (lengthSq === 0) return false;

		let t = ((cx - x1) * dx + (cy - y1) * dy) / lengthSq;
		t = Math.max(0, Math.min(1, t));
		const closestX = x1 + t * dx;
		const closestY = y1 + t * dy;
		const distSq = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);
		return distSq <= (r + 1) * (r + 1);
	}

	function collidesWithWall(nx, ny) {
		for (const line of wallLines) {
			if (circleIntersectsLine(nx, ny, radius, line.x1, line.y1, line.x2, line.y2)) {
				return true;
			}
		}
		return false;
	}

	function canPlaceCore(coreX, coreY) {
		const coreRadius = squareSize / 2;
		for (const line of wallLines) {
			if (
				circleIntersectsLine(coreX, coreY, coreRadius, line.x1, line.y1, line.x2, line.y2) ||
				circleIntersectsLine(coreX + squareSize, coreY, coreRadius, line.x1, line.y1, line.x2, line.y2) ||
				circleIntersectsLine(coreX, coreY + squareSize, coreRadius, line.x1, line.y1, line.x2, line.y2) ||
				circleIntersectsLine(coreX + squareSize, coreY + squareSize, coreRadius, line.x1, line.y1, line.x2, line.y2)
			) {
				return false;
			}
		}
		return true;
	}

	function spawnSquares() {
		if (!coresEnabled) {
			squares = [];
			return;
		}
		squares = [];
		let attempts = 0;
		while (squares.length < totalCores && attempts < 600) {
			attempts++;
			const sqX = Math.floor(Math.random() * (canvas.width - squareSize - 2 * radius)) + radius + 1;
			const sqY = Math.floor(Math.random() * (canvas.height - squareSize - 2 * radius)) + radius + 1;

			const tooCloseToStart = Math.abs(sqX - startPos.x) < 28 && Math.abs(sqY - startPos.y) < 28;
			const tooCloseToExit = Math.abs(sqX - exitGate.x) < 24 && Math.abs(sqY - exitGate.y) < 24;
			const overlap = squares.some((sq) => Math.abs(sq.x - sqX) < squareSize + 6 && Math.abs(sq.y - sqY) < squareSize + 6);

			if (!tooCloseToStart && !tooCloseToExit && !overlap && canPlaceCore(sqX, sqY)) {
				squares.push({ x: sqX, y: sqY, collected: false });
			}
		}

		// Guaranteed fallback positions so collectibles are always present.
		const fallbackSquares = [
			{ x: 72, y: 104, collected: false },
			{ x: 232, y: 214, collected: false },
			{ x: 360, y: 360, collected: false }
		];
		for (const fallback of fallbackSquares) {
			if (squares.length >= totalCores) break;
			const overlap = squares.some((sq) => Math.abs(sq.x - fallback.x) < squareSize + 6 && Math.abs(sq.y - fallback.y) < squareSize + 6);
			if (!overlap && canPlaceCore(fallback.x, fallback.y)) {
				squares.push(fallback);
			}
		}
	}

	function drawSquares() {
		if (!coresEnabled) return;
		for (const sq of squares) {
			if (sq.collected) continue;
			const centerX = sq.x + squareSize / 2;
			const centerY = sq.y + squareSize / 2;

			ctx.save();
			ctx.shadowColor = 'rgba(255, 198, 65, 0.8)';
			ctx.shadowBlur = 14;
			ctx.beginPath();
			ctx.arc(centerX, centerY, squareSize * 0.45, 0, 2 * Math.PI);
			ctx.fillStyle = '#ffd348';
			ctx.fill();
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = '#8a5600';
			ctx.stroke();

			ctx.beginPath();
			ctx.arc(centerX - 3, centerY - 4, squareSize * 0.12, 0, 2 * Math.PI);
			ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
			ctx.fill();
			ctx.restore();
		}
	}

	function drawExitGate() {
		// Intentionally left blank: EXIT label is the only visible finish marker.
	}

	function clearCanvas() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (playing) {
			drawExitGate();
			drawSquares();
		}
	}

	function drawCircle() {
		clearCanvas();
		const iconSize = playerIcon.width;
		ctx.drawImage(playerIcon, x - iconSize / 2, y - iconSize / 2);
	}

	function checkCollectedCore() {
		if (!coresEnabled) return;
		for (const sq of squares) {
			if (sq.collected) continue;
			const cx = sq.x + squareSize / 2;
			const cy = sq.y + squareSize / 2;
			const dist = Math.hypot(cx - x, cy - y);
			if (dist <= radius + squareSize * 0.55) {
				sq.collected = true;
				updateCollectChip();

				const done = squares.every((item) => item.collected);
				if (done) {
					setMissionStatus('Pridi do izhoda');
				}
			}
		}
	}

	function reachedExit() {
		return Math.hypot(exitGate.x - x, exitGate.y - y) <= exitGate.r + radius + 1;
	}

	function failMission(title, text) {
		playing = false;
		stopCountdown();
		clearCanvas();
		setMissionStatus('Konec igre');
		mazeAlert.fire({
			icon: 'error',
			title,
			text
		});
	}

	function completeMission() {
		playing = false;
		stopCountdown();
		clearCanvas();
		setMissionStatus('Zmaga!');
		mazeAlert.fire({
			icon: 'success',
			title: 'Bravo!',
			text: `Prišel si do izhoda v ${120 - timeLeft} sekundah.`
		});
	}

	function move(dx, dy) {
		const nx = x + dx;
		const ny = y + dy;
		const clampedX = Math.max(radius, Math.min(canvas.width - radius, nx));
		const clampedY = Math.max(radius, Math.min(canvas.height - radius, ny));

		if (collidesWithWall(clampedX, clampedY)) {
			failMission('Crash!', 'Zadel si steno.');
			return;
		}

		x = clampedX;
		y = clampedY;
		checkCollectedCore();

		const allCollected = !coresEnabled || (squares.length > 0 && squares.every((sq) => sq.collected));
		if (reachedExit() && allCollected) {
			completeMission();
			return;
		}

		if (coresEnabled && reachedExit() && !allCollected && !hintShown) {
			setMissionStatus('Najprej izpolni cilj.');
			hintShown = true;
		}

		drawCircle();
	}

	document.addEventListener('keydown', (e) => {
		if (!playing) return;

		const key = e.key.toLowerCase();
		if (!['w', 'a', 's', 'd'].includes(key)) return;
		e.preventDefault();

		switch (key) {
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

	function startMission() {
		playing = true;
		hintShown = false;
		x = startPos.x;
		y = startPos.y;
		spawnSquares();
		updateCollectChip();
		setMissionStatus('Pridi do izhoda');
		startCountdown();
		drawCircle();

		const solutionLine = document.getElementById('solution-anim');
		if (solutionLine) {
			solutionLine.style.visibility = 'hidden';
			solutionLine.style.animation = 'none';
		}
	}

	function stopMissionForSolution() {
		playing = false;
		stopCountdown();
		clearCanvas();
		setMissionStatus('Prikaz rešitve');
	}

	clearCanvas();
	updateCollectChip();
	updateTimerDisplay();
	setMissionStatus('Pripravljen');

	const playBtn = document.getElementById('play-btn');
	if (playBtn) {
		playBtn.addEventListener('click', startMission);
	}

	const resitevBtn = document.getElementById('start-btn');
	if (resitevBtn) {
		resitevBtn.addEventListener('click', stopMissionForSolution);
	}
});

const wallLines = [
	{ x1: 2, y1: 2, x2: 226, y2: 2 },
	{ x1: 242, y1: 2, x2: 482, y2: 2 },
	{ x1: 18, y1: 18, x2: 98, y2: 18 },
	{ x1: 114, y1: 18, x2: 178, y2: 18 },
	{ x1: 210, y1: 18, x2: 258, y2: 18 },
	{ x1: 274, y1: 18, x2: 322, y2: 18 },
	{ x1: 450, y1: 18, x2: 482, y2: 18 },
	{ x1: 18, y1: 34, x2: 50, y2: 34 },
	{ x1: 66, y1: 34, x2: 82, y2: 34 },
	{ x1: 98, y1: 34, x2: 130, y2: 34 },
	{ x1: 194, y1: 34, x2: 258, y2: 34 },
	{ x1: 290, y1: 34, x2: 306, y2: 34 },
	{ x1: 338, y1: 34, x2: 402, y2: 34 },
	{ x1: 418, y1: 34, x2: 466, y2: 34 },
	{ x1: 2, y1: 50, x2: 18, y2: 50 },
	{ x1: 114, y1: 50, x2: 242, y2: 50 },
	{ x1: 274, y1: 50, x2: 290, y2: 50 },
	{ x1: 322, y1: 50, x2: 386, y2: 50 },
	{ x1: 402, y1: 50, x2: 418, y2: 50 },
	{ x1: 434, y1: 50, x2: 482, y2: 50 },
	{ x1: 18, y1: 66, x2: 34, y2: 66 },
	{ x1: 50, y1: 66, x2: 82, y2: 66 },
	{ x1: 162, y1: 66, x2: 242, y2: 66 },
	{ x1: 258, y1: 66, x2: 274, y2: 66 },
	{ x1: 290, y1: 66, x2: 322, y2: 66 },
	{ x1: 354, y1: 66, x2: 434, y2: 66 },
	{ x1: 450, y1: 66, x2: 466, y2: 66 },
	{ x1: 34, y1: 82, x2: 50, y2: 82 },
	{ x1: 82, y1: 82, x2: 114, y2: 82 },
	{ x1: 130, y1: 82, x2: 162, y2: 82 },
	{ x1: 194, y1: 82, x2: 210, y2: 82 },
	{ x1: 226, y1: 82, x2: 258, y2: 82 },
	{ x1: 274, y1: 82, x2: 322, y2: 82 },
	{ x1: 338, y1: 82, x2: 370, y2: 82 },
	{ x1: 386, y1: 82, x2: 418, y2: 82 },
	{ x1: 466, y1: 82, x2: 482, y2: 82 },
	{ x1: 2, y1: 98, x2: 18, y2: 98 },
	{ x1: 50, y1: 98, x2: 66, y2: 98 },
	{ x1: 114, y1: 98, x2: 130, y2: 98 },
	{ x1: 178, y1: 98, x2: 210, y2: 98 },
	{ x1: 258, y1: 98, x2: 274, y2: 98 },
	{ x1: 290, y1: 98, x2: 306, y2: 98 },
	{ x1: 370, y1: 98, x2: 402, y2: 98 },
	{ x1: 418, y1: 98, x2: 450, y2: 98 },
	{ x1: 18, y1: 114, x2: 50, y2: 114 },
	{ x1: 66, y1: 114, x2: 114, y2: 114 },
	{ x1: 146, y1: 114, x2: 162, y2: 114 },
	{ x1: 210, y1: 114, x2: 226, y2: 114 },
	{ x1: 274, y1: 114, x2: 306, y2: 114 },
	{ x1: 354, y1: 114, x2: 370, y2: 114 },
	{ x1: 402, y1: 114, x2: 434, y2: 114 },
	{ x1: 450, y1: 114, x2: 466, y2: 114 },
	{ x1: 18, y1: 130, x2: 98, y2: 130 },
	{ x1: 114, y1: 130, x2: 162, y2: 130 },
	{ x1: 226, y1: 130, x2: 242, y2: 130 },
	{ x1: 258, y1: 130, x2: 274, y2: 130 },
	{ x1: 338, y1: 130, x2: 354, y2: 130 },
	{ x1: 370, y1: 130, x2: 418, y2: 130 },
	{ x1: 18, y1: 146, x2: 50, y2: 146 },
	{ x1: 146, y1: 146, x2: 162, y2: 146 },
	{ x1: 178, y1: 146, x2: 194, y2: 146 },
	{ x1: 242, y1: 146, x2: 386, y2: 146 },
	{ x1: 402, y1: 146, x2: 418, y2: 146 },
	{ x1: 2, y1: 162, x2: 34, y2: 162 },
	{ x1: 66, y1: 162, x2: 114, y2: 162 },
	{ x1: 130, y1: 162, x2: 146, y2: 162 },
	{ x1: 162, y1: 162, x2: 178, y2: 162 },
	{ x1: 210, y1: 162, x2: 242, y2: 162 },
	{ x1: 274, y1: 162, x2: 290, y2: 162 },
	{ x1: 322, y1: 162, x2: 338, y2: 162 },
	{ x1: 386, y1: 162, x2: 402, y2: 162 },
	{ x1: 434, y1: 162, x2: 466, y2: 162 },
	{ x1: 18, y1: 178, x2: 66, y2: 178 },
	{ x1: 114, y1: 178, x2: 146, y2: 178 },
	{ x1: 178, y1: 178, x2: 194, y2: 178 },
	{ x1: 242, y1: 178, x2: 258, y2: 178 },
	{ x1: 274, y1: 178, x2: 322, y2: 178 },
	{ x1: 370, y1: 178, x2: 402, y2: 178 },
	{ x1: 418, y1: 178, x2: 434, y2: 178 },
	{ x1: 34, y1: 194, x2: 50, y2: 194 },
	{ x1: 66, y1: 194, x2: 98, y2: 194 },
	{ x1: 146, y1: 194, x2: 162, y2: 194 },
	{ x1: 194, y1: 194, x2: 210, y2: 194 },
	{ x1: 226, y1: 194, x2: 242, y2: 194 },
	{ x1: 258, y1: 194, x2: 274, y2: 194 },
	{ x1: 306, y1: 194, x2: 338, y2: 194 },
	{ x1: 402, y1: 194, x2: 450, y2: 194 },
	{ x1: 50, y1: 210, x2: 66, y2: 210 },
	{ x1: 98, y1: 210, x2: 114, y2: 210 },
	{ x1: 130, y1: 210, x2: 146, y2: 210 },
	{ x1: 162, y1: 210, x2: 226, y2: 210 },
	{ x1: 242, y1: 210, x2: 306, y2: 210 },
	{ x1: 370, y1: 210, x2: 386, y2: 210 },
	{ x1: 402, y1: 210, x2: 466, y2: 210 },
	{ x1: 2, y1: 226, x2: 34, y2: 226 },
	{ x1: 66, y1: 226, x2: 98, y2: 226 },
	{ x1: 146, y1: 226, x2: 162, y2: 226 },
	{ x1: 274, y1: 226, x2: 322, y2: 226 },
	{ x1: 386, y1: 226, x2: 434, y2: 226 },
	{ x1: 18, y1: 242, x2: 34, y2: 242 },
	{ x1: 98, y1: 242, x2: 146, y2: 242 },
	{ x1: 162, y1: 242, x2: 178, y2: 242 },
	{ x1: 194, y1: 242, x2: 210, y2: 242 },
	{ x1: 258, y1: 242, x2: 274, y2: 242 },
	{ x1: 306, y1: 242, x2: 354, y2: 242 },
	{ x1: 418, y1: 242, x2: 466, y2: 242 },
	{ x1: 34, y1: 258, x2: 50, y2: 258 },
	{ x1: 98, y1: 258, x2: 114, y2: 258 },
	{ x1: 146, y1: 258, x2: 162, y2: 258 },
	{ x1: 194, y1: 258, x2: 210, y2: 258 },
	{ x1: 226, y1: 258, x2: 258, y2: 258 },
	{ x1: 274, y1: 258, x2: 338, y2: 258 },
	{ x1: 370, y1: 258, x2: 386, y2: 258 },
	{ x1: 402, y1: 258, x2: 418, y2: 258 },
	{ x1: 434, y1: 258, x2: 450, y2: 258 },
	{ x1: 2, y1: 274, x2: 34, y2: 274 },
	{ x1: 66, y1: 274, x2: 130, y2: 274 },
	{ x1: 178, y1: 274, x2: 194, y2: 274 },
	{ x1: 290, y1: 274, x2: 306, y2: 274 },
	{ x1: 322, y1: 274, x2: 338, y2: 274 },
	{ x1: 354, y1: 274, x2: 370, y2: 274 },
	{ x1: 386, y1: 274, x2: 466, y2: 274 },
	{ x1: 34, y1: 290, x2: 98, y2: 290 },
	{ x1: 114, y1: 290, x2: 146, y2: 290 },
	{ x1: 162, y1: 290, x2: 178, y2: 290 },
	{ x1: 210, y1: 290, x2: 226, y2: 290 },
	{ x1: 258, y1: 290, x2: 290, y2: 290 },
	{ x1: 306, y1: 290, x2: 322, y2: 290 },
	{ x1: 338, y1: 290, x2: 418, y2: 290 },
	{ x1: 18, y1: 306, x2: 34, y2: 306 },
	{ x1: 50, y1: 306, x2: 114, y2: 306 },
	{ x1: 146, y1: 306, x2: 162, y2: 306 },
	{ x1: 178, y1: 306, x2: 194, y2: 306 },
	{ x1: 210, y1: 306, x2: 306, y2: 306 },
	{ x1: 322, y1: 306, x2: 338, y2: 306 },
	{ x1: 114, y1: 322, x2: 178, y2: 322 },
	{ x1: 194, y1: 322, x2: 210, y2: 322 },
	{ x1: 226, y1: 322, x2: 242, y2: 322 },
	{ x1: 290, y1: 322, x2: 322, y2: 322 },
	{ x1: 338, y1: 322, x2: 402, y2: 322 },
	{ x1: 418, y1: 322, x2: 450, y2: 322 },
	{ x1: 2, y1: 338, x2: 18, y2: 338 },
	{ x1: 82, y1: 338, x2: 114, y2: 338 },
	{ x1: 146, y1: 338, x2: 162, y2: 338 },
	{ x1: 178, y1: 338, x2: 194, y2: 338 },
	{ x1: 258, y1: 338, x2: 290, y2: 338 },
	{ x1: 338, y1: 338, x2: 386, y2: 338 },
	{ x1: 418, y1: 338, x2: 434, y2: 338 },
	{ x1: 450, y1: 338, x2: 466, y2: 338 },
	{ x1: 50, y1: 354, x2: 66, y2: 354 },
	{ x1: 114, y1: 354, x2: 146, y2: 354 },
	{ x1: 162, y1: 354, x2: 178, y2: 354 },
	{ x1: 194, y1: 354, x2: 226, y2: 354 },
	{ x1: 242, y1: 354, x2: 258, y2: 354 },
	{ x1: 322, y1: 354, x2: 354, y2: 354 },
	{ x1: 66, y1: 370, x2: 82, y2: 370 },
	{ x1: 98, y1: 370, x2: 162, y2: 370 },
	{ x1: 178, y1: 370, x2: 194, y2: 370 },
	{ x1: 242, y1: 370, x2: 258, y2: 370 },
	{ x1: 274, y1: 370, x2: 338, y2: 370 },
	{ x1: 386, y1: 370, x2: 418, y2: 370 },
	{ x1: 50, y1: 386, x2: 82, y2: 386 },
	{ x1: 146, y1: 386, x2: 162, y2: 386 },
	{ x1: 194, y1: 386, x2: 210, y2: 386 },
	{ x1: 226, y1: 386, x2: 274, y2: 386 },
	{ x1: 290, y1: 386, x2: 306, y2: 386 },
	{ x1: 322, y1: 386, x2: 354, y2: 386 },
	{ x1: 418, y1: 386, x2: 466, y2: 386 },
	{ x1: 2, y1: 402, x2: 34, y2: 402 },
	{ x1: 82, y1: 402, x2: 114, y2: 402 },
	{ x1: 162, y1: 402, x2: 226, y2: 402 },
	{ x1: 274, y1: 402, x2: 290, y2: 402 },
	{ x1: 306, y1: 402, x2: 322, y2: 402 },
	{ x1: 402, y1: 402, x2: 418, y2: 402 },
	{ x1: 18, y1: 418, x2: 98, y2: 418 },
	{ x1: 114, y1: 418, x2: 146, y2: 418 },
	{ x1: 226, y1: 418, x2: 274, y2: 418 },
	{ x1: 290, y1: 418, x2: 370, y2: 418 },
	{ x1: 450, y1: 418, x2: 466, y2: 418 },
	{ x1: 2, y1: 434, x2: 50, y2: 434 },
	{ x1: 98, y1: 434, x2: 130, y2: 434 },
	{ x1: 210, y1: 434, x2: 242, y2: 434 },
	{ x1: 274, y1: 434, x2: 290, y2: 434 },
	{ x1: 322, y1: 434, x2: 338, y2: 434 },
	{ x1: 354, y1: 434, x2: 370, y2: 434 },
	{ x1: 386, y1: 434, x2: 418, y2: 434 },
	{ x1: 434, y1: 434, x2: 450, y2: 434 },
	{ x1: 18, y1: 450, x2: 66, y2: 450 },
	{ x1: 82, y1: 450, x2: 114, y2: 450 },
	{ x1: 146, y1: 450, x2: 178, y2: 450 },
	{ x1: 194, y1: 450, x2: 226, y2: 450 },
	{ x1: 258, y1: 450, x2: 290, y2: 450 },
	{ x1: 322, y1: 450, x2: 338, y2: 450 },
	{ x1: 370, y1: 450, x2: 402, y2: 450 },
	{ x1: 418, y1: 450, x2: 434, y2: 450 },
	{ x1: 450, y1: 450, x2: 466, y2: 450 },
	{ x1: 2, y1: 466, x2: 50, y2: 466 },
	{ x1: 66, y1: 466, x2: 82, y2: 466 },
	{ x1: 194, y1: 466, x2: 210, y2: 466 },
	{ x1: 242, y1: 466, x2: 274, y2: 466 },
	{ x1: 306, y1: 466, x2: 322, y2: 466 },
	{ x1: 338, y1: 466, x2: 370, y2: 466 },
	{ x1: 2, y1: 482, x2: 242, y2: 482 },
	{ x1: 258, y1: 482, x2: 482, y2: 482 },
	{ x1: 2, y1: 2, x2: 2, y2: 482 },
	{ x1: 18, y1: 34, x2: 18, y2: 50 },
	{ x1: 18, y1: 66, x2: 18, y2: 98 },
	{ x1: 18, y1: 178, x2: 18, y2: 210 },
	{ x1: 18, y1: 242, x2: 18, y2: 258 },
	{ x1: 18, y1: 274, x2: 18, y2: 290 },
	{ x1: 18, y1: 306, x2: 18, y2: 322 },
	{ x1: 18, y1: 338, x2: 18, y2: 386 },
	{ x1: 34, y1: 50, x2: 34, y2: 66 },
	{ x1: 34, y1: 82, x2: 34, y2: 98 },
	{ x1: 34, y1: 194, x2: 34, y2: 242 },
	{ x1: 34, y1: 290, x2: 34, y2: 402 },
	{ x1: 50, y1: 34, x2: 50, y2: 82 },
	{ x1: 50, y1: 98, x2: 50, y2: 130 },
	{ x1: 50, y1: 146, x2: 50, y2: 178 },
	{ x1: 50, y1: 210, x2: 50, y2: 290 },
	{ x1: 50, y1: 306, x2: 50, y2: 338 },
	{ x1: 50, y1: 354, x2: 50, y2: 402 },
	{ x1: 66, y1: 34, x2: 66, y2: 50 },
	{ x1: 66, y1: 66, x2: 66, y2: 98 },
	{ x1: 66, y1: 130, x2: 66, y2: 146 },
	{ x1: 66, y1: 178, x2: 66, y2: 210 },
	{ x1: 66, y1: 242, x2: 66, y2: 274 },
	{ x1: 66, y1: 306, x2: 66, y2: 354 },
	{ x1: 66, y1: 386, x2: 66, y2: 466 },
	{ x1: 82, y1: 34, x2: 82, y2: 66 },
	{ x1: 82, y1: 82, x2: 82, y2: 114 },
	{ x1: 82, y1: 146, x2: 82, y2: 178 },
	{ x1: 82, y1: 210, x2: 82, y2: 226 },
	{ x1: 82, y1: 242, x2: 82, y2: 274 },
	{ x1: 82, y1: 322, x2: 82, y2: 386 },
	{ x1: 82, y1: 434, x2: 82, y2: 466 },
	{ x1: 98, y1: 2, x2: 98, y2: 66 },
	{ x1: 98, y1: 98, x2: 98, y2: 114 },
	{ x1: 98, y1: 130, x2: 98, y2: 146 },
	{ x1: 98, y1: 162, x2: 98, y2: 210 },
	{ x1: 98, y1: 226, x2: 98, y2: 258 },
	{ x1: 98, y1: 306, x2: 98, y2: 322 },
	{ x1: 98, y1: 338, x2: 98, y2: 354 },
	{ x1: 98, y1: 370, x2: 98, y2: 402 },
	{ x1: 98, y1: 418, x2: 98, y2: 434 },
	{ x1: 98, y1: 466, x2: 98, y2: 482 },
	{ x1: 114, y1: 50, x2: 114, y2: 98 },
	{ x1: 114, y1: 114, x2: 114, y2: 162 },
	{ x1: 114, y1: 194, x2: 114, y2: 226 },
	{ x1: 114, y1: 274, x2: 114, y2: 290 },
	{ x1: 114, y1: 354, x2: 114, y2: 370 },
	{ x1: 114, y1: 386, x2: 114, y2: 418 },
	{ x1: 114, y1: 450, x2: 114, y2: 466 },
	{ x1: 130, y1: 66, x2: 130, y2: 82 },
	{ x1: 130, y1: 98, x2: 130, y2: 114 },
	{ x1: 130, y1: 146, x2: 130, y2: 210 },
	{ x1: 130, y1: 226, x2: 130, y2: 242 },
	{ x1: 130, y1: 258, x2: 130, y2: 274 },
	{ x1: 130, y1: 290, x2: 130, y2: 354 },
	{ x1: 130, y1: 370, x2: 130, y2: 402 },
	{ x1: 130, y1: 434, x2: 130, y2: 482 },
	{ x1: 146, y1: 18, x2: 146, y2: 82 },
	{ x1: 146, y1: 98, x2: 146, y2: 114 },
	{ x1: 146, y1: 210, x2: 146, y2: 226 },
	{ x1: 146, y1: 242, x2: 146, y2: 290 },
	{ x1: 146, y1: 386, x2: 146, y2: 466 },
	{ x1: 162, y1: 18, x2: 162, y2: 34 },
	{ x1: 162, y1: 82, x2: 162, y2: 98 },
	{ x1: 162, y1: 114, x2: 162, y2: 130 },
	{ x1: 162, y1: 146, x2: 162, y2: 242 },
	{ x1: 162, y1: 258, x2: 162, y2: 306 },
	{ x1: 162, y1: 338, x2: 162, y2: 370 },
	{ x1: 162, y1: 402, x2: 162, y2: 434 },
	{ x1: 162, y1: 466, x2: 162, y2: 482 },
	{ x1: 178, y1: 34, x2: 178, y2: 50 },
	{ x1: 178, y1: 66, x2: 178, y2: 130 },
	{ x1: 178, y1: 178, x2: 178, y2: 194 },
	{ x1: 178, y1: 226, x2: 178, y2: 274 },
	{ x1: 178, y1: 306, x2: 178, y2: 338 },
	{ x1: 178, y1: 370, x2: 178, y2: 466 },
	{ x1: 194, y1: 2, x2: 194, y2: 34 },
	{ x1: 194, y1: 98, x2: 194, y2: 178 },
	{ x1: 194, y1: 194, x2: 194, y2: 226 },
	{ x1: 194, y1: 242, x2: 194, y2: 258 },
	{ x1: 194, y1: 274, x2: 194, y2: 290 },
	{ x1: 194, y1: 338, x2: 194, y2: 354 },
	{ x1: 194, y1: 418, x2: 194, y2: 466 },
	{ x1: 210, y1: 82, x2: 210, y2: 98 },
	{ x1: 210, y1: 114, x2: 210, y2: 194 },
	{ x1: 210, y1: 226, x2: 210, y2: 242 },
	{ x1: 210, y1: 258, x2: 210, y2: 290 },
	{ x1: 210, y1: 306, x2: 210, y2: 338 },
	{ x1: 210, y1: 354, x2: 210, y2: 386 },
	{ x1: 210, y1: 402, x2: 210, y2: 434 },
	{ x1: 226, y1: 66, x2: 226, y2: 82 },
	{ x1: 226, y1: 98, x2: 226, y2: 114 },
	{ x1: 226, y1: 130, x2: 226, y2: 146 },
	{ x1: 226, y1: 178, x2: 226, y2: 290 },
	{ x1: 226, y1: 322, x2: 226, y2: 354 },
	{ x1: 226, y1: 370, x2: 226, y2: 386 },
	{ x1: 226, y1: 450, x2: 226, y2: 482 },
	{ x1: 242, y1: 82, x2: 242, y2: 130 },
	{ x1: 242, y1: 146, x2: 242, y2: 178 },
	{ x1: 242, y1: 210, x2: 242, y2: 242 },
	{ x1: 242, y1: 274, x2: 242, y2: 306 },
	{ x1: 242, y1: 322, x2: 242, y2: 354 },
	{ x1: 242, y1: 386, x2: 242, y2: 418 },
	{ x1: 242, y1: 434, x2: 242, y2: 466 },
	{ x1: 258, y1: 2, x2: 258, y2: 18 },
	{ x1: 258, y1: 34, x2: 258, y2: 82 },
	{ x1: 258, y1: 98, x2: 258, y2: 114 },
	{ x1: 258, y1: 146, x2: 258, y2: 162 },
	{ x1: 258, y1: 178, x2: 258, y2: 194 },
	{ x1: 258, y1: 210, x2: 258, y2: 290 },
	{ x1: 258, y1: 306, x2: 258, y2: 338 },
	{ x1: 258, y1: 354, x2: 258, y2: 370 },
	{ x1: 258, y1: 402, x2: 258, y2: 450 },
	{ x1: 258, y1: 466, x2: 258, y2: 482 },
	{ x1: 274, y1: 34, x2: 274, y2: 66 },
	{ x1: 274, y1: 82, x2: 274, y2: 130 },
	{ x1: 274, y1: 258, x2: 274, y2: 274 },
	{ x1: 274, y1: 322, x2: 274, y2: 354 },
	{ x1: 274, y1: 370, x2: 274, y2: 402 },
	{ x1: 290, y1: 18, x2: 290, y2: 34 },
	{ x1: 290, y1: 130, x2: 290, y2: 146 },
	{ x1: 290, y1: 162, x2: 290, y2: 194 },
	{ x1: 290, y1: 226, x2: 290, y2: 258 },
	{ x1: 290, y1: 274, x2: 290, y2: 290 },
	{ x1: 290, y1: 306, x2: 290, y2: 322 },
	{ x1: 290, y1: 338, x2: 290, y2: 354 },
	{ x1: 290, y1: 418, x2: 290, y2: 434 },
	{ x1: 290, y1: 450, x2: 290, y2: 482 },
	{ x1: 306, y1: 34, x2: 306, y2: 50 },
	{ x1: 306, y1: 98, x2: 306, y2: 130 },
	{ x1: 306, y1: 146, x2: 306, y2: 162 },
	{ x1: 306, y1: 194, x2: 306, y2: 210 },
	{ x1: 306, y1: 290, x2: 306, y2: 306 },
	{ x1: 306, y1: 322, x2: 306, y2: 370 },
	{ x1: 306, y1: 386, x2: 306, y2: 466 },
	{ x1: 322, y1: 18, x2: 322, y2: 66 },
	{ x1: 322, y1: 82, x2: 322, y2: 146 },
	{ x1: 322, y1: 162, x2: 322, y2: 178 },
	{ x1: 322, y1: 210, x2: 322, y2: 226 },
	{ x1: 322, y1: 258, x2: 322, y2: 290 },
	{ x1: 322, y1: 306, x2: 322, y2: 354 },
	{ x1: 322, y1: 434, x2: 322, y2: 450 },
	{ x1: 322, y1: 466, x2: 322, y2: 482 },
	{ x1: 338, y1: 18, x2: 338, y2: 34 },
	{ x1: 338, y1: 66, x2: 338, y2: 130 },
	{ x1: 338, y1: 162, x2: 338, y2: 226 },
	{ x1: 338, y1: 290, x2: 338, y2: 322 },
	{ x1: 338, y1: 402, x2: 338, y2: 418 },
	{ x1: 338, y1: 450, x2: 338, y2: 466 },
	{ x1: 354, y1: 2, x2: 354, y2: 18 },
	{ x1: 354, y1: 50, x2: 354, y2: 66 },
	{ x1: 354, y1: 98, x2: 354, y2: 114 },
	{ x1: 354, y1: 130, x2: 354, y2: 306 },
	{ x1: 354, y1: 354, x2: 354, y2: 402 },
	{ x1: 354, y1: 434, x2: 354, y2: 466 },
	{ x1: 370, y1: 18, x2: 370, y2: 34 },
	{ x1: 370, y1: 98, x2: 370, y2: 130 },
	{ x1: 370, y1: 162, x2: 370, y2: 194 },
	{ x1: 370, y1: 226, x2: 370, y2: 258 },
	{ x1: 370, y1: 306, x2: 370, y2: 322 },
	{ x1: 370, y1: 338, x2: 370, y2: 434 },
	{ x1: 386, y1: 2, x2: 386, y2: 18 },
	{ x1: 386, y1: 82, x2: 386, y2: 98 },
	{ x1: 386, y1: 114, x2: 386, y2: 130 },
	{ x1: 386, y1: 146, x2: 386, y2: 162 },
	{ x1: 386, y1: 194, x2: 386, y2: 242 },
	{ x1: 386, y1: 258, x2: 386, y2: 274 },
	{ x1: 386, y1: 290, x2: 386, y2: 306 },
	{ x1: 386, y1: 338, x2: 386, y2: 434 },
	{ x1: 386, y1: 450, x2: 386, y2: 482 },
	{ x1: 402, y1: 2, x2: 402, y2: 50 },
	{ x1: 402, y1: 98, x2: 402, y2: 114 },
	{ x1: 402, y1: 162, x2: 402, y2: 194 },
	{ x1: 402, y1: 226, x2: 402, y2: 258 },
	{ x1: 402, y1: 306, x2: 402, y2: 354 },
	{ x1: 402, y1: 386, x2: 402, y2: 418 },
	{ x1: 402, y1: 450, x2: 402, y2: 466 },
	{ x1: 418, y1: 18, x2: 418, y2: 50 },
	{ x1: 418, y1: 82, x2: 418, y2: 98 },
	{ x1: 418, y1: 130, x2: 418, y2: 146 },
	{ x1: 418, y1: 162, x2: 418, y2: 178 },
	{ x1: 418, y1: 258, x2: 418, y2: 274 },
	{ x1: 418, y1: 290, x2: 418, y2: 322 },
	{ x1: 418, y1: 338, x2: 418, y2: 386 },
	{ x1: 418, y1: 402, x2: 418, y2: 434 },
	{ x1: 418, y1: 466, x2: 418, y2: 482 },
	{ x1: 434, y1: 18, x2: 434, y2: 34 },
	{ x1: 434, y1: 50, x2: 434, y2: 82 },
	{ x1: 434, y1: 114, x2: 434, y2: 178 },
	{ x1: 434, y1: 242, x2: 434, y2: 258 },
	{ x1: 434, y1: 274, x2: 434, y2: 306 },
	{ x1: 434, y1: 338, x2: 434, y2: 370 },
	{ x1: 434, y1: 386, x2: 434, y2: 466 },
	{ x1: 450, y1: 66, x2: 450, y2: 98 },
	{ x1: 450, y1: 114, x2: 450, y2: 146 },
	{ x1: 450, y1: 178, x2: 450, y2: 194 },
	{ x1: 450, y1: 210, x2: 450, y2: 242 },
	{ x1: 450, y1: 290, x2: 450, y2: 322 },
	{ x1: 450, y1: 338, x2: 450, y2: 386 },
	{ x1: 450, y1: 402, x2: 450, y2: 418 },
	{ x1: 450, y1: 434, x2: 450, y2: 450 },
	{ x1: 450, y1: 466, x2: 450, y2: 482 },
	{ x1: 466, y1: 82, x2: 466, y2: 114 },
	{ x1: 466, y1: 130, x2: 466, y2: 210 },
	{ x1: 466, y1: 226, x2: 466, y2: 338 },
	{ x1: 466, y1: 354, x2: 466, y2: 434 },
	{ x1: 466, y1: 450, x2: 466, y2: 466 },
	{ x1: 482, y1: 2, x2: 482, y2: 482 },
];


