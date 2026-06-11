// 1. Inicialización del Reconocimiento de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let reconocimiento;
let escuchando = false;

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

    // Cuando el navegador procesa la voz
    reconocimiento.onresult = (event) => {
        const resultadoActual = event.results[event.results.length - 1][0].transcript;
        cuadroTexto.value += resultadoActual + " ";
        actualizarContadores();
    };

    // Control de errores
    reconocimiento.onerror = (event) => {
        console.error("Error: ", event.error);
        if(event.error === 'not-allowed') {
            alert("Por favor, permite el acceso al micrófono en tu navegador.");
        }
        detenerEscucha();
    };

    reconocimiento.onend = () => {
        if (escuchando) reconocimiento.start(); // Forzar a que siga si no se ha apagado manualmente
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
    reconocimiento.lang = selectIdioma.value; // Toma el idioma seleccionado
    reconocimiento.start();
    escuchando = true;
    
    btnGrabar.classList.add('grabando');
    btnGrabar.querySelector('span').textContent = "mic_off";
    ondasVoz.classList.remove('oculto');
    estadoTexto.textContent = "Escuchando... habla ahora";
}

function detenerEscucha() {
    if(reconocimiento) reconocimiento.stop();
    escuchando = false;
    
    btnGrabar.classList.remove('grabando');
    btnGrabar.querySelector('span').textContent = "mic";
    ondasVoz.classList.add('oculto');
    estadoTexto.textContent = "Dictado detenido";
}

// 3. Contadores de Palabras y Caracteres
function actualizarContadores() {
    const texto = cuadroTexto.value.trim();
    const numeroLetras = texto.length;
    // Cuenta palabras filtrando espacios vacíos
    const numeroPalabras = texto === "" ? 0 : texto.split(/\s+/).length;
    
    countPalabras.textContent = `${numeroPalabras} palabras`;
    countLetras.textContent = `${numeroLetras} caracteres`;
}

// 4. Botón de Copiar con Alerta Flotante (Toast)
document.getElementById('btn-copiar').addEventListener('click', () => {
    if(cuadroTexto.value.trim() === "") return;
    
    navigator.clipboard.writeText(cuadroTexto.value);
    
    // Mostrar Toast
    const toast = document.getElementById('toast');
    toast.classList.add('mostrar');
    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 2500);
});

// 5. Botón de Limpiar todo
document.getElementById('btn-borrar').addEventListener('click', () => {
    if(confirm("¿Seguro que quieres borrar todo el texto?")) {
        cuadroTexto.value = "";
        actualizarContadores();
        detenerEscucha();
    }
});

// 6. Lógica del Modo Oscuro
const btnTheme = document.getElementById('btn-theme');
btnTheme.addEventListener('click', () => {
    const temaActual = document.documentElement.getAttribute('data-theme');
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', nuevoTema);
    
    // Cambia el icono del botón
    const icono = btnTheme.querySelector('span');
    icono.textContent = nuevoTema === 'dark' ? 'light_mode' : 'dark_mode';
});