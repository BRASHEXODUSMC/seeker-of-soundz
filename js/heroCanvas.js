/*==================================================
    SEEKER OF SOUNDZ v2
    HERO CANVAS EXPERIENCE ENGINE
==================================================*/

(() => {

    const canvas = document.getElementById("heroCanvas");

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");

    const state = {
        width: 0,
        height: 0,
        pixelRatio: 1,
        time: 0,
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2,
        smoothMouseX: window.innerWidth / 2,
        smoothMouseY: window.innerHeight / 2
    };

    const stars = [];
    const dustParticles = [];
    const shootingStars = [];

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const mobile = window.matchMedia(
        "(max-width: 768px)"
    ).matches;

    const starCount = mobile ? 70 : 150;
    const dustCount = mobile ? 20 : 55;

    /*==============================================
        RESIZE
    ==============================================*/

    function resizeCanvas() {

        state.pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        state.width = window.innerWidth;
        state.height = window.innerHeight;

        canvas.width =
            state.width * state.pixelRatio;

        canvas.height =
            state.height * state.pixelRatio;

        canvas.style.width =
            state.width + "px";

        canvas.style.height =
            state.height + "px";

        ctx.setTransform(
            state.pixelRatio,
            0,
            0,
            state.pixelRatio,
            0,
            0
        );

        createScene();

    }

    /*==============================================
        SCENE OBJECTS
    ==============================================*/

    function createScene() {

        stars.length = 0;
        dustParticles.length = 0;

        for (let i = 0; i < starCount; i++) {

            stars.push({
                x: Math.random() * state.width,
                y: Math.random() * state.height,
                radius: Math.random() * 1.5 + 0.25,
                alpha: Math.random() * 0.55 + 0.15,
                twinkleSpeed:
                    Math.random() * 0.025 + 0.005,
                phase:
                    Math.random() * Math.PI * 2
            });

        }

        for (let i = 0; i < dustCount; i++) {

            dustParticles.push({
                x: Math.random() * state.width,
                y: Math.random() * state.height,
                radius: Math.random() * 2 + 0.5,
                speedX:
                    (Math.random() - 0.5) * 0.12,
                speedY:
                    Math.random() * 0.12 + 0.03,
                alpha:
                    Math.random() * 0.18 + 0.04
            });

        }

    }

    /*==============================================
        POINTER
    ==============================================*/

    window.addEventListener(
        "mousemove",
        (event) => {

            state.mouseX = event.clientX;
            state.mouseY = event.clientY;

        },
        { passive: true }
    );

    window.addEventListener(
        "mouseleave",
        () => {

            state.mouseX = state.width / 2;
            state.mouseY = state.height / 2;

        }
    );

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    /*==============================================
        AURORA
    ==============================================*/

    function drawAurora() {

        ctx.save();

        ctx.globalCompositeOperation = "screen";

        const centerX =
            state.width / 2 +
            Math.sin(state.time * 0.00025) * 140;

        const centerY =
            state.height * 0.44 +
            Math.cos(state.time * 0.0002) * 80;

        const gradient =
            ctx.createRadialGradient(
                centerX,
                centerY,
                20,
                centerX,
                centerY,
                mobile ? 380 : 760
            );

        gradient.addColorStop(
            0,
            "rgba(255,255,255,0.055)"
        );

        gradient.addColorStop(
            0.35,
            "rgba(185,185,185,0.025)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            0,
            0,
            state.width,
            state.height
        );

        ctx.restore();

    }

    /*==============================================
        STARS
    ==============================================*/

    function drawStars() {

        for (const star of stars) {

            const twinkle =
                Math.sin(
                    state.time *
                    star.twinkleSpeed *
                    0.01 +
                    star.phase
                );

            const alpha =
                Math.max(
                    0.05,
                    star.alpha + twinkle * 0.15
                );

            ctx.beginPath();

            ctx.arc(
                star.x,
                star.y,
                star.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(255,255,255,${alpha})`;

            ctx.fill();

        }

    }

    /*==============================================
        FLOATING DUST
    ==============================================*/

    function drawDust() {

        for (const particle of dustParticles) {

            particle.x += particle.speedX;
            particle.y += particle.speedY;

            if (particle.y > state.height + 10) {

                particle.y = -10;
                particle.x =
                    Math.random() * state.width;

            }

            if (particle.x < -10) {
                particle.x = state.width + 10;
            }

            if (particle.x > state.width + 10) {
                particle.x = -10;
            }

            ctx.beginPath();

            ctx.arc(
                particle.x,
                particle.y,
                particle.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(255,255,255,${particle.alpha})`;

            ctx.fill();

        }

    }

    /*==============================================
        TRUE OSCILLOSCOPE WAVEFORM
    ==============================================*/

    function drawWaveform() {

        const centerY = state.height * 0.54;

        const amplitude =
            mobile
                ? 34
                : 68;

        const mouseInfluence =
            Math.max(
                -1,
                Math.min(
                    1,
                    (
                        state.smoothMouseY -
                        centerY
                    ) / 300
                )
            );

        ctx.save();

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        drawWaveLayer(
            centerY,
            amplitude,
            mouseInfluence,
            0.22,
            mobile ? 1.4 : 2.1,
            mobile ? 8 : 16
        );

        drawWaveLayer(
            centerY,
            amplitude * 0.65,
            mouseInfluence,
            0.08,
            1,
            28,
            true
        );

        ctx.restore();

    }

    function drawWaveLayer(
        centerY,
        amplitude,
        mouseInfluence,
        opacity,
        lineWidth,
        glow,
        backgroundLayer = false
    ) {

        ctx.beginPath();

        for (
            let x = -20;
            x <= state.width + 20;
            x += 4
        ) {

            const normalizedX =
                x / state.width;

            const centerEnvelope =
                Math.sin(
                    normalizedX * Math.PI
                );

            const waveOne =
                Math.sin(
                    normalizedX *
                    Math.PI *
                    7 +
                    state.time * 0.0022
                );

            const waveTwo =
                Math.sin(
                    normalizedX *
                    Math.PI *
                    15 -
                    state.time * 0.0013
                ) * 0.38;

            const waveThree =
                Math.sin(
                    normalizedX *
                    Math.PI *
                    3 +
                    state.time * 0.0008
                ) * 0.55;

            const distanceFromMouse =
                Math.abs(
                    x - state.smoothMouseX
                );

            const mouseEnvelope =
                Math.max(
                    0,
                    1 -
                    distanceFromMouse /
                    (mobile ? 180 : 330)
                );

            const mouseBend =
                mouseInfluence *
                mouseEnvelope *
                amplitude *
                0.75;

            const waveform =
                (
                    waveOne +
                    waveTwo +
                    waveThree
                ) *
                amplitude *
                centerEnvelope *
                0.55;

            const y =
                centerY +
                waveform +
                mouseBend;

            if (x === -20) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);

            }

        }

        ctx.strokeStyle =
            backgroundLayer
                ? `rgba(255,255,255,${opacity})`
                : `rgba(255,255,255,${opacity})`;

        ctx.lineWidth = lineWidth;

        ctx.shadowBlur = glow;

        ctx.shadowColor =
            backgroundLayer
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.58)";

        ctx.stroke();

    }

    /*==============================================
        SHOOTING STARS
    ==============================================*/

    function createShootingStar() {

        if (
            reducedMotion ||
            shootingStars.length > 0
        ) {
            return;
        }

        shootingStars.push({
            x:
                Math.random() *
                state.width *
                0.65,
            y:
                Math.random() *
                state.height *
                0.35,
            length:
                Math.random() * 110 + 90,
            speed:
                Math.random() * 8 + 8,
            alpha: 1
        });

    }

    function updateShootingStars() {

        for (
            let i =
                shootingStars.length - 1;
            i >= 0;
            i--
        ) {

            const star =
                shootingStars[i];

            star.x += star.speed;
            star.y += star.speed * 0.42;
            star.alpha -= 0.018;

            const gradient =
                ctx.createLinearGradient(
                    star.x,
                    star.y,
                    star.x - star.length,
                    star.y - star.length * 0.42
                );

            gradient.addColorStop(
                0,
                `rgba(255,255,255,${star.alpha})`
            );

            gradient.addColorStop(
                1,
                "rgba(255,255,255,0)"
            );

            ctx.beginPath();

            ctx.moveTo(
                star.x,
                star.y
            );

            ctx.lineTo(
                star.x - star.length,
                star.y - star.length * 0.42
            );

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.6;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "white";

            ctx.stroke();

            if (
                star.alpha <= 0 ||
                star.x > state.width + 200
            ) {

                shootingStars.splice(i, 1);

            }

        }

    }

    setInterval(
        createShootingStar,
        mobile ? 18000 : 11000
    );

    /*==============================================
        ANIMATION LOOP
    ==============================================*/

    function animate(timestamp) {

        state.time = timestamp;

        state.smoothMouseX +=
            (
                state.mouseX -
                state.smoothMouseX
            ) * 0.035;

        state.smoothMouseY +=
            (
                state.mouseY -
                state.smoothMouseY
            ) * 0.035;

        ctx.clearRect(
            0,
            0,
            state.width,
            state.height
        );

        drawAurora();
        drawStars();
        drawDust();
        drawWaveform();
        updateShootingStars();

        requestAnimationFrame(animate);

    }

    resizeCanvas();

    requestAnimationFrame(animate);

})();