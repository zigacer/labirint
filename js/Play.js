document.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('maze-canvas');
	if (!canvas) return;

	const solutionPoints = [
  [234,2],[234,10],[202,10],[202,26],[282,26],[282,42],[298,42],[298,58],[282,58],[282,74],[266,74],[266,90],[250,90],[250,138],[234,138],[234,154],[218,154],[218,122],[234,122],[234,90],[218,90],[218,106],[202,106],[202,186],[186,186],[186,202],[170,202],[170,170],[186,170],[186,154],[170,154],[170,138],[122,138],[122,170],[106,170],[106,186],[122,186],[122,234],[106,234],[106,218],[90,218],[90,202],[74,202],[74,218],[58,218],[58,282],[106,282],[106,298],[122,298],[122,314],[106,314],[106,330],[122,330],[122,346],[106,346],[106,362],[90,362],[90,394],[74,394],[74,410],[106,410],[106,426],[138,426],[138,474],[154,474],[154,458],[170,458],[170,474],[186,474],[186,410],[202,410],[202,442],[234,442],[234,474],[250,474],[250,482]
	];

	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	const timerDiv = document.getElementById('timer-div');
	const missionChip = document.getElementById('mission-chip');
	const enemiesChip = document.getElementById('enemies-chip');
	const proximityHint = document.getElementById('proximity-hint');
	const explosionSound = document.getElementById('explosion-sound');
	const coresEnabled = false;

	const radius = 3;
	const speed = 4;
	const totalEnemies = 3;
	const startPos = { x: canvas.width / 2, y: radius + 5 };
	const exitGate = { x: canvas.width / 2, y: canvas.height - 7, r: 10 };

	let x = startPos.x;
	let y = startPos.y;
	let playerDirection = 0;
	let playing = false;
	let timer = null;
	let timeLeft = 120;
	let hintShown = false;
	let enemies = [];
	let enemiesKilled = 0;
	let nearEnemy = null;

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

	function updateEnemiesChip() {
		if (enemiesChip) enemiesChip.textContent = `Sovražniki: ${enemiesKilled}/${totalEnemies}`;
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
		timerDiv.textContent = `Čas: ${min}:${sec}`;
		timerDiv.classList.toggle('warning', timeLeft <= 20 && playing);
	}

	function startCountdown() {
		timeLeft = 120;
		updateTimerDisplay();
		stopCountdown();
		timer = setInterval(function() {
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

		iconCtx.beginPath();
		iconCtx.rect(-size * 0.15, -size * 0.1, size * 0.3, size * 0.35);
		iconCtx.fillStyle = '#46d7ff';
		iconCtx.fill();
		iconCtx.lineWidth = 1.5;
		iconCtx.strokeStyle = '#ffffff';
		iconCtx.stroke();

		iconCtx.beginPath();
		iconCtx.moveTo(-size * 0.15, -size * 0.1);
		iconCtx.lineTo(0, -size * 0.35);
		iconCtx.lineTo(size * 0.15, -size * 0.1);
		iconCtx.closePath();
		iconCtx.fillStyle = '#ff4f94';
		iconCtx.fill();
		iconCtx.lineWidth = 1.5;
		iconCtx.strokeStyle = '#ffffff';
		iconCtx.stroke();

		iconCtx.beginPath();
		iconCtx.arc(0, -size * 0.02, size * 0.08, 0, 2 * Math.PI);
		iconCtx.fillStyle = '#8ce6ff';
		iconCtx.fill();
		iconCtx.lineWidth = 1;
		iconCtx.strokeStyle = '#0c6fad';
		iconCtx.stroke();

		iconCtx.beginPath();
		iconCtx.moveTo(-size * 0.15, size * 0.15);
		iconCtx.lineTo(-size * 0.3, size * 0.25);
		iconCtx.lineTo(-size * 0.15, size * 0.25);
		iconCtx.closePath();
		iconCtx.fillStyle = '#53f2b6';
		iconCtx.fill();
		iconCtx.lineWidth = 1;
		iconCtx.strokeStyle = '#ffffff';
		iconCtx.stroke();

		iconCtx.beginPath();
		iconCtx.moveTo(size * 0.15, size * 0.15);
		iconCtx.lineTo(size * 0.3, size * 0.25);
		iconCtx.lineTo(size * 0.15, size * 0.25);
		iconCtx.closePath();
		iconCtx.fillStyle = '#53f2b6';
		iconCtx.fill();
		iconCtx.lineWidth = 1;
		iconCtx.strokeStyle = '#ffffff';
		iconCtx.stroke();

		iconCtx.beginPath();
		iconCtx.moveTo(-size * 0.1, size * 0.25);
		iconCtx.lineTo(size * 0.1, size * 0.25);
		iconCtx.lineTo(size * 0.05, size * 0.38);
		iconCtx.lineTo(-size * 0.05, size * 0.38);
		iconCtx.closePath();
		iconCtx.fillStyle = '#ffe473';
		iconCtx.fill();

		iconCtx.beginPath();
		iconCtx.moveTo(-size * 0.05, size * 0.28);
		iconCtx.lineTo(size * 0.05, size * 0.28);
		iconCtx.lineTo(0, size * 0.35);
		iconCtx.closePath();
		iconCtx.fillStyle = '#ff9b52';
		iconCtx.fill();

		iconCtx.restore();
		return iconCanvas;
	}

	function collidesWithWall(nx, ny) {
		for (const line of wallLines) {
			const dx = line.x2 - line.x1;
			const dy = line.y2 - line.y1;
			const len = dx * dx + dy * dy;
			if (len === 0) continue;

			let t = ((nx - line.x1) * dx + (ny - line.y1) * dy) / len;
			t = Math.max(0, Math.min(1, t));
			const closestX = line.x1 + t * dx;
			const closestY = line.y1 + t * dy;
			const distSq = (nx - closestX) ** 2 + (ny - closestY) ** 2;
			if (distSq < (radius + 1) ** 2) return true;
		}
		return false;
	}

	function spawnEnemies() {
		enemies = [];
		let attempts = 0;
		const minDistance = 80;

		while (enemies.length < totalEnemies && attempts < 300) {
			attempts++;
			const randomIndex = Math.floor(Math.random() * solutionPoints.length);
			const pathPoint = solutionPoints[randomIndex];
			
			const enemyX = pathPoint[0];
			const enemyY = pathPoint[1];

			const clampedX = Math.max(20, Math.min(canvas.width - 20, enemyX));
			const clampedY = Math.max(20, Math.min(canvas.height - 20, enemyY));

			const distFromStart = Math.hypot(clampedX - startPos.x, clampedY - startPos.y);
			const distFromExit = Math.hypot(clampedX - exitGate.x, clampedY - exitGate.y);

			const overlap = enemies.some(function(e) { return Math.hypot(e.x - clampedX, e.y - clampedY) < minDistance; });

			if (distFromStart > 50 && distFromExit > 50 && !overlap) {
				enemies.push({ x: clampedX, y: clampedY, killed: false });
			}
		}
	}

	function drawEnemies() {
		for (const enemy of enemies) {
			if (enemy.killed) continue;

			ctx.save();

			ctx.shadowColor = 'rgba(76, 255, 150, 0.6)';
			ctx.shadowBlur = 15;

			const ex = enemy.x;
			const ey = enemy.y;
			const scale = 1.2;

			ctx.fillStyle = '#4cff96';
			ctx.beginPath();
			ctx.ellipse(ex, ey - 1, 4.5 * scale, 5.5 * scale, 0, 0, 2 * Math.PI);
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#ffffff';
			ctx.stroke();

			ctx.fillStyle = '#000000';
			ctx.beginPath();
			ctx.ellipse(ex - 2.5, ey - 2, 1.5, 2, -0.3, 0, 2 * Math.PI);
			ctx.fill();

			ctx.beginPath();
			ctx.ellipse(ex + 2.5, ey - 2, 1.5, 2, 0.3, 0, 2 * Math.PI);
			ctx.fill();

			ctx.fillStyle = '#4cff96';
			ctx.beginPath();
			ctx.arc(ex - 2.2, ey - 2.3, 0.4, 0, 2 * Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(ex + 2.8, ey - 2.3, 0.4, 0, 2 * Math.PI);
			ctx.fill();

			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(ex, ey + 1.5, 1.2, 0, Math.PI);
			ctx.stroke();

			ctx.strokeStyle = '#4cff96';
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(ex - 4, ey + 1);
			ctx.lineTo(ex - 6, ey + 3);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(ex + 4, ey + 1);
			ctx.lineTo(ex + 6, ey + 3);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(ex - 2.5, ey + 5);
			ctx.lineTo(ex - 3, ey + 7);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(ex + 2.5, ey + 5);
			ctx.lineTo(ex + 3, ey + 7);
			ctx.stroke();

			ctx.restore();
		}
	}

	function checkEnemyCollision() {
		for (const enemy of enemies) {
			if (enemy.killed) continue;
			const dist = Math.hypot(enemy.x - x, enemy.y - y);
			if (dist <= radius + 5) {
				nearEnemy = enemy;
				if (proximityHint) proximityHint.classList.add('active');
				return true;
			}
		}
		nearEnemy = null;
		if (proximityHint) proximityHint.classList.remove('active');
		
		if (enemiesKilled === totalEnemies && missionChip) {
			missionChip.textContent = 'Status: Izhod je ODPRT!';
			missionChip.style.color = '#53f2b6';
		}
		
		return false;
	}

	function drawExitGate() {
	}

	function clearCanvas() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (playing) {
			drawExitGate();
			drawEnemies();
		}
	}

	function drawCircle() {
		clearCanvas();
		const iconSize = playerIcon.width;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate((playerDirection * Math.PI) / 180);
		ctx.drawImage(playerIcon, -iconSize / 2, -iconSize / 2);
		ctx.restore();
	}

	function reachedExit() {
		const atExit = Math.hypot(exitGate.x - x, exitGate.y - y) <= exitGate.r + radius + 1;
		if (atExit && enemiesKilled < totalEnemies) {
			mazeAlert.fire({
				icon: 'warning',
				title: 'Izhod še ni odprt!',
				text: 'Najprej moraš premagati vse sovražnike!'
			});
			return false;
		}
		return atExit && enemiesKilled === totalEnemies;
	}

	function failMission(title, text) {
		playing = false;
		stopCountdown();
		if (proximityHint) proximityHint.classList.remove('active');
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
		if (proximityHint) proximityHint.classList.remove('active');
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
			return;
		}

		if (dy < 0) playerDirection = 0;
		else if (dy > 0) playerDirection = 180;
		else if (dx < 0) playerDirection = 270;
		else if (dx > 0) playerDirection = 90;

		x = clampedX;
		y = clampedY;
		checkEnemyCollision();

		if (reachedExit()) {
			completeMission();
			return;
		}

		drawCircle();
	}

	document.addEventListener('keydown', function(e) {
		if (!playing) return;

		const key = e.key.toLowerCase();
		
		if (key === ' ') {
			e.preventDefault();
			if (nearEnemy && !nearEnemy.killed) {
				nearEnemy.killed = true;
				enemiesKilled++;
				updateEnemiesChip();
				if (explosionSound) {
					explosionSound.currentTime = 0;
					explosionSound.play();
				}
				nearEnemy = null;
				drawCircle();
			}
			return;
		}

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
		enemiesKilled = 0;
		spawnEnemies();
		updateEnemiesChip();
		setMissionStatus('Premagaj vse sovražnike!');
		startCountdown();
		if (proximityHint) proximityHint.classList.remove('active');
		drawCircle();

		const solutionLine = document.getElementById('solution-anim');
		if (solutionLine) {
			solutionLine.style.visibility = 'hidden';
			solutionLine.style.animation = 'none';
		}
	}

	clearCanvas();
	updateEnemiesChip();
	updateTimerDisplay();
	setMissionStatus('Pripravljen');

	const playBtn = document.getElementById('play-btn');
	if (playBtn) {
		playBtn.addEventListener('click', function() { startMission(); });
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


