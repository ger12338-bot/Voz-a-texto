// 1. Inicialización del Reconocimiento de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let reconocimiento;
let escuchando = false;
let bloqueoPorBorrado = false; // Evita que se reactive si el usuario limpia la pantalla

// Elementos del DOM
const btnGrabar = document.getElementById('btn-grabar');
const ondasVoz = document.getElementById('ondas-voz');
const estadoTexto = document.getElementById('estado-texto');
const cuadroTexto = document.getElementById('texto-resultado');
const selectIdioma = document.getElementById('select-idioma');
const countPalabras = document.getElementById('count-palabras');
const countLetras = document.getElementById('count-letras');

if (!SpeechRecognition) {
    estadoTexto.textContent = "Navegador no compatible. Usa Google Chrome.";
    btnGrabar.disabled = true;
} else {
    reconocimiento = new SpeechRecognition();
    reconocimiento.continuous = true;
    reconocimiento.interimResults = false;

    // [MEJORA 2 Y 3] Procesamiento inteligente de voz y párrafos
    reconocimiento.onresult = (event) => {
        const resultadoActual = event.results[event.results.length - 1][0].transcript.trim();
        
        // FILTRO DE RUIDO: Si lo detectado es extremadamente corto (ej. un golpe o respiración), lo ignora
        if (resultadoActual.length < 2) return; 

        // SEPARACIÓN POR PÁRRAFOS: Si el cuadro ya tiene texto, añade un salto de línea
        // para separar las ideas de la conversación en lugar de amontonar todo.
        if (cuadroTexto.value.trim() === "") {
            cuadroTexto.value = resultadoActual;
        } else {
            cuadroTexto.value += "\n\n" + resultadoActual;
        }
        
        actualizarContadores();
        
        // Auto-scroll para que el texto nuevo siempre sea visible abajo
        cuadroTexto.scrollTop = cuadroTexto.scrollHeight;
    };

    // Control de errores
    reconocimiento.onerror = (event) => {
        console.error("Error: ", event.error);
        if (event.error === 'not-allowed') {
            alert("Por favor, permite el acceso al micrófono en tu navegador.");
            detenerEscucha();
        }
        // Los errores de "no-speech" (silencio) los ignoramos para que el auto-reconectado actúe
    };

    // [MEJORA 1] El Sistema de Vigilancia (Autoreconectado)
    // Cuando el reconocimiento se detiene por un silencio largo, validamos si el usuario
    // realmente quería apagarlo. Si no es así, la app se enciende sola de inmediato.
    reconocimiento.onend = () => {
        if (escuchando && !bloqueoPorBorrado) {
            console.log("Reconectando micrófono automáticamente...");
            reconocimiento.start(); 
        }
    };
}

// 2. Lógica del Botón Principal (Grabar / Detener)
btnGrabar.addEventListener('click', () => {
    if (!escuchando) {
        iniciarEscucha();
    } else {
        detenerEscucha();
    }
});

function iniciarEscucha() {
    bloqueoPorBorrado = false;
    reconocimiento.lang = selectIdioma.value; 
    reconocimiento.start();
    escuchando = true;
    
    btnGrabar.classList.add('grabando');
    btnGrabar.querySelector('span').textContent = "mic_off";
    ondasVoz.classList.remove('oculto');
    estadoTexto.textContent = "Modo Conversación Activo...";
}

function detenerEscucha() {
    escuchando = false;
    if (reconocimiento) reconocimiento.stop();
    
    btnGrabar.classList.remove('grabando');
    btnGrabar.querySelector('span').textContent = "mic";
    ondasVoz.classList.add('oculto');
    estadoTexto.textContent = "Dictado guardado";
}

// 3. Contadores de Palabras y Caracteres
function actualizarContadores() {
    const texto = cuadroTexto.value.trim();
    const numeroLetras = texto.length;
    const numeroPalabras = texto === "" ? 0 : texto.split(/\s+/).length;
    
    countPalabras.textContent = `${numeroPalabras} palabras`;
    countLetras.textContent = `${numeroLetras} caracteres`;
}

// 4. Botón de Copiar con Alerta Flotante (Toast)
document.getElementById('btn-copiar').addEventListener('click', () => {
    if (cuadroTexto.value.trim() === "") return;
    
    navigator.clipboard.writeText(cuadroTexto.value);
    
    const toast = document.getElementById('toast');
    toast.classList.add('mostrar');
    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 2500);
});

// 5. Botón de Limpiar todo
document.getElementById('btn-borrar').addEventListener('click', () => {
    if (cuadroTexto.value.trim() === "") return;

    if (confirm("¿Seguro que quieres borrar todo el texto?")) {
        bloqueoPorBorrado = true; // Evita que el bucle lo reactive mientras borramos
        detenerEscucha();
        cuadroTexto.value = "";
        actualizarContadores();
    }
});

// 6. Lógica del Modo Oscuro
const btnTheme = document.getElementById('btn-theme');
btnTheme.addEventListener('click', () => {
    const temaActual = document.documentElement.getAttribute('data-theme');
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', nuevoTema);
    
    const icono = btnTheme.querySelector('span');
    icono.textContent = nuevoTema === 'dark' ? 'light_mode' : 'dark_mode';
});
