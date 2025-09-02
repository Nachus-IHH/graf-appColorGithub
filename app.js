document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------------------
    // Elementos del DOM (Selector de Colores)
    // ---------------------------------------------------------------------

    const r = document.getElementById("rangeR");
    const g = document.getElementById("rangeG");
    const b = document.getElementById("rangeB");
    const inR = document.getElementById("inputR");
    const inG = document.getElementById("inputG");
    const inB = document.getElementById("inputB");
    const colorPicker = document.getElementById("colorPicker");
    const preview = document.getElementById("preview");
    const hexInput = document.getElementById("hexCode");
    const hexText = document.getElementById("hexText");
    const rgbText = document.getElementById("rgbText");
    const copyBtn = document.getElementById("copyBtn");

    // ---------------------------------------------------------------------
    // Elementos del DOM (Lupa de Píxeles)
    // ---------------------------------------------------------------------

    const imageLoader = document.getElementById('imageLoader');
    const imageContainer = document.getElementById('image-container');
    const imageCanvas = document.getElementById('imageCanvas');
    const ctx = imageCanvas.getContext('2d', { willReadFrequently: true });
    const magnifier = document.getElementById('magnifier');
    const pixelRgbValue = document.getElementById('rgb-value');
    const pixelHexValue = document.getElementById('hex-value');
    const pixelInfoContainer = document.getElementById('pixel-info');

    // ---------------------------------------------------------------------
    // Variables de estado
    // ---------------------------------------------------------------------

    let image = new Image();
    let imageLoaded = false;

    // ---------------------------------------------------------------------
    // Funciones de conversión de color
    // ---------------------------------------------------------------------

    const clamp = (n, min, max) => Math.min(Math.max(parseInt(n) || 0, min), max);

    function toHex(n) {
        return clamp(n, 0, 255).toString(16).padStart(2, "0").toUpperCase();
    }

    function rgbToHex(r, g, b) {
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function hexToRgb(hex) {
        hex = hex.replace(/^#/, "");
        if (hex.length === 3) {
            hex = hex.split("").map((c) => c + c).join("");
        }
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
        };
    }

    // ---------------------------------------------------------------------
    // Lógica del Selector de Colores
    // ---------------------------------------------------------------------

    function updateColorSelectorUI(fromPicker = false, fromHexInput = false) {
        if (imageLoaded) return; // Evita que se actualice si hay una imagen

        let rv, gv, bv;

        if (fromHexInput) {
            const { r: rr, g: gg, b: bb } = hexToRgb(hexInput.value);
            rv = rr;
            gv = gg;
            bv = bb;
        } else if (fromPicker) {
            const { r: rr, g: gg, b: bb } = hexToRgb(colorPicker.value);
            rv = rr;
            gv = gg;
            bv = bb;
        } else {
            rv = clamp(r.value, 0, 255);
            gv = clamp(g.value, 0, 255);
            bv = clamp(b.value, 0, 255);
        }

        const rgb = `rgb(${rv}, ${gv}, ${bv})`;
        const hex = rgbToHex(rv, gv, bv);

        preview.style.background = rgb;
        rgbText.textContent = `${rv}, ${gv}, ${bv}`;
        hexText.textContent = hex;

        inR.value = rv;
        inG.value = gv;
        inB.value = bv;

        r.value = rv;
        g.value = gv;
        b.value = bv;

        if (!fromHexInput) {
            hexInput.value = hex;
        }
        if (!fromPicker) {
            colorPicker.value = hex;
        }
    }

    // Función para sincronizar el panel del selector con un color dado
    function syncColorSelector(rv, gv, bv) {
        const rgb = `rgb(${rv}, ${gv}, ${bv})`;
        const hex = rgbToHex(rv, gv, bv);

        preview.style.background = rgb;
        rgbText.textContent = `${rv}, ${gv}, ${bv}`;
        hexText.textContent = hex;

        inR.value = rv;
        inG.value = gv;
        inB.value = bv;

        r.value = rv;
        g.value = gv;
        b.value = bv;

        hexInput.value = hex;
        colorPicker.value = hex;
    }


    // Eventos del selector de colores
    [r, g, b].forEach((el) => el.addEventListener("input", () => updateColorSelectorUI(false, false)));
    [inR, inG, inB].forEach((el) => {
        el.addEventListener("input", () => {
            if (el.value === "") el.value = 0;
            updateColorSelectorUI(false, false);
        });
        el.addEventListener("keypress", (e) => {
            if (e.key === "Enter" || e.keyCode === 13) {
                updateColorSelectorUI(false, false);
            }
        });
    });

    colorPicker.addEventListener("input", () => updateColorSelectorUI(true, false));
    hexInput.addEventListener("input", () => {
        const val = hexInput.value.trim().toUpperCase();
        if (val.length === 7 && val.startsWith('#') && /^[0-9A-F]{6}$/.test(val.substring(1))) {
            updateColorSelectorUI(false, true);
        }
    });
    hexInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.keyCode === 13) {
            updateColorSelectorUI(false, true);
        }
    });

    copyBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(hexInput.value);
            copyBtn.textContent = "¡Copiado!";
            setTimeout(() => (copyBtn.textContent = "Copiar"), 1200);
        } catch {
            hexInput.select();
            document.execCommand("copy");
            copyBtn.textContent = "¡Copiado!";
            setTimeout(() => (copyBtn.textContent = "Copiar"), 1200);
        }
    });

    updateColorSelectorUI();

    // ---------------------------------------------------------------------
    // Lógica de la Lupa de Píxeles
    // ---------------------------------------------------------------------

    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                image.onload = () => {
                    imageLoaded = true;
                    imageContainer.classList.remove('d-none');
                    imageCanvas.width = image.width;
                    imageCanvas.height = image.height;
                    ctx.drawImage(image, 0, 0);
                    pixelInfoContainer.classList.remove('d-none');
                };
                image.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    imageContainer.addEventListener('mousemove', (e) => {
        if (!imageLoaded) return;
        updatePixelInfo(e);
    });

    imageContainer.addEventListener('mouseleave', () => {
        if (!imageLoaded) return;
        magnifier.classList.add('d-none');
    });

    imageContainer.addEventListener('click', (e) => {
        if (!imageLoaded) return;
        const { hex } = getPixelData(e);
        copyToClipboard(hex);
        showCopyAlert(hex);
    });

    function getPixelData(e) {
        const rect = imageCanvas.getBoundingClientRect();
        const scaleX = imageCanvas.width / rect.width;
        const scaleY = imageCanvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        
        if (x < 0 || x >= imageCanvas.width || y < 0 || y >= imageCanvas.height) {
            return { r: 0, g: 0, b: 0, hex: "#000000" };
        }

        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        const hex = rgbToHex(r, g, b);
        return { r, g, b, hex };
    }

    function updatePixelInfo(e) {
        const rect = imageCanvas.getBoundingClientRect();
        const { r, g, b, hex } = getPixelData(e);

        // Actualiza los valores de RGB y HEX en el panel
        pixelRgbValue.textContent = `${r}, ${g}, ${b}`;
        pixelHexValue.textContent = hex;
        pixelInfoContainer.style.backgroundColor = hex;

        // Tamaño y zoom de la lupa
        const magnifierSize = magnifier.offsetWidth;
        const zoomLevel = 12; // Más zoom
        const pixelSizeInMagnifier = magnifierSize / zoomLevel;

        const imgX = Math.floor((e.clientX - rect.left) * (image.width / rect.width));
        const imgY = Math.floor((e.clientY - rect.top) * (image.height / rect.height));

        const backgroundPosX = -(imgX * pixelSizeInMagnifier) + (magnifierSize / 2) - (pixelSizeInMagnifier / 2);
        const backgroundPosY = -(imgY * pixelSizeInMagnifier) + (magnifierSize / 2) - (pixelSizeInMagnifier / 2);

        magnifier.style.backgroundSize = `${image.width * pixelSizeInMagnifier}px ${image.height * pixelSizeInMagnifier}px`;
        magnifier.style.backgroundPosition = `${backgroundPosX}px ${backgroundPosY}px`;
        magnifier.style.backgroundImage = `url(${image.src})`;

        // 📌 Posiciona la lupa un poco arriba y a la derecha del mouse
        magnifier.style.left = `${e.clientX - rect.left + 30}px`;
        magnifier.style.top = `${e.clientY - rect.top - magnifierSize - 10}px`;

        magnifier.classList.remove('d-none');

        // Sincroniza el selector de colores
        syncColorSelector(r, g, b);
    }


    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('No se pudo copiar el texto: ', err);
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }

    function showCopyAlert(text) {
        let alertDiv = document.querySelector('.copy-alert');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.className = 'copy-alert';
            document.body.appendChild(alertDiv);
        }
        alertDiv.textContent = `¡Código ${text} copiado!`;
        alertDiv.classList.add('show');
        setTimeout(() => {
            alertDiv.classList.remove('show');
        }, 1500);
    }
});