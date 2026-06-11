// 1. Inicialización y Variables Globales
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let reconocimiento;
let escuchando = false;
let bloqueoPorBorrado = false;

// Variables para el Cronómetro
let timerInterval;
let segundosTotales = 0;

// Elementos del DOM
const btnGrabar = document.getElementById('btn-grabar');
const ondasVoz = document.getElementById('ondas-voz');
const estadoTexto = document.getElementById('estado-texto');
const cuadroTexto = document.getElementById('texto-resultado');
const selectIdioma = document.getElementById('select-idioma');
const countPalabras = document.getElementById('count-palabras');
const countLetras = document.getElementById('count-letras');
const cronometroElement = document.getElementById('cronometro');
const listaHistorial = document.getElementById('lista-historial');

if (!SpeechRecognition) {
    estadoTexto.textContent = "Navegador no compatible. Usa Chrome.";
    btnGrabar.disabled = true;
} else {
    reconocimiento = new SpeechRecognition();
    reconocimiento.continuous = true;
    reconocimiento.interimResults = false;

    reconocimiento.onresult = (event) => {
        const resultadoActual = event.results[event.results.length - 1][0].transcript.trim();
        if (resultadoActual.length < 2) return; 

        if (cuadroTexto.value.trim() === "") {
            cuadroTexto.value = resultadoActual;
        } else {
            cuadroTexto.value += "\n\n" + resultadoActual;
        }
        actualizarContadores();
        cuadroTexto.scrollTop = cuadroTexto.scrollHeight;
    };

    reconocimiento.onerror = (event) => {
        if(event.error === 'not-allowed') alert("Permite el acceso al micrófono.");
        detenerEscucha();
    };

    reconocimiento.onend = () => {
        if (escuchando && !bloqueoPorBorrado) reconocimiento.start();
    };
}

// 2. Control de Grabación e Inyección del Cronómetro
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
    estadoTexto.textContent = "Grabando conversación...";

    // Iniciar el Cronómetro
    segundosTotales = 0;
    cronometroElement.textContent = "00:00";
    cronometroElement.classList.remove('oculto');
    timerInterval = setInterval(actualizarCronometro, 1000);
}

function detenerEscucha() {
    escuchando = false;
    if (reconocimiento) reconocimiento.stop();
    
    btnGrabar.classList.remove('grabando');
    btnGrabar.querySelector('span').textContent = "mic";
    ondasVoz.classList.add('oculto');
    estadoTexto.textContent = "Dictado pausado";

    // Detener el Cronómetro
    clearInterval(timerInterval);
}

function actualizarCronometro() {
    segundosTotales++;
    const minutos = String(Math.floor(segundosTotales / 60)).padStart(2, '0');
    const segundos = String(segundosTotales % 60).padStart(2, '0');
    cronometroElement.textContent = `${minutos}:${segundos}`;
}

// 3. Contadores
function actualizarContadores() {
    const texto = cuadroTexto.value.trim();
    countPalabras.textContent = `${texto === "" ? 0 : texto.split(/\s+/).length} palabras`;
    countLetras.textContent = `${texto.length} caracteres`;
}

// 4. NUEVA MEJORA: Exportar a Microsoft Word (.doc)
document.getElementById('btn-word').addEventListener('click', () => {
    const texto = cuadroTexto.value.trim();
    if (texto === "") {
        mostrarToast("No hay texto para exportar");
        return;
    }

    // Convertimos el texto plano agregándole saltos de línea compatibles con Word
    const contenidoFormateado = texto.replace(/\n/g, '<br>');
    
    // Creamos un archivo binario (Blob) con formato de texto enriquecido/HTML que Word entiende perfectamente
    const datosWord = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><title>Transcripción</title><style>body {font-family:Arial;}</style></head><body>${contenidoFormateado}</body></html>`;
    
    const blob = new Blob(['\ufeff' + datosWord], {
        type: 'application/msword'
    });
    
    // Generamos un enlace oculto en la página para forzar la descarga del archivo
    const url Descarga = URL.createObjectURL(blob);
    const enlaceOculto = document.createElement('a');
    enlaceOculto.href = urlDescarga;
    enlaceOculto.download = `Transcripcion_${new Date().toLocaleDateString()}.doc`;
    document.body.appendChild(enlaceOculto);
    enlaceOculto.click();
    document.body.removeChild(enlaceOculto);
    mostrarToast("¡Documento de Word descargado!");
});

// 5. NUEVA MEJORA: Sistema de Historial Local
document.getElementById('btn-guardar').addEventListener('click', () => {
    const texto = cuadroTexto.value.trim();
    if(texto === "") return;

    const notasGuardadas = JSON.parse(localStorage.getItem('notas_dictado')) || [];
    const nuevaNota = {
        id: Date.now(),
        fecha: new Date().toLocaleString(),
        contenido: texto
    };

    notasGuardadas.unshift(nuevaNota); // Guarda la más reciente al principio
    localStorage.setItem('notas_dictado', JSON.stringify(notasGuardadas));
    
    cargarHistorial();
    mostrarToast("¡Nota guardada en el historial!");
});

function cargarHistorial() {
    const notasGuardadas = JSON.parse(localStorage.getItem('notas_dictado')) || [];
    listaHistorial.innerHTML = "";

    if(notasGuardadas.length === 0) {
        listaHistorial.innerHTML = '<p class="text-vacio">No hay notas guardadas localmente.</p>';
        return;
    }

    notasGuardadas.forEach(nota => {
        const div = document.createElement('div');
        div.className = "item-nota";
        div.innerHTML = `
            <h4>${nota.fecha}</h4>
            <p>${nota.contenido}</p>
            <button class="btn-delete-nota" onclick="eliminarNota(${nota.id})">
                <span class="material-icons" style="font-size:18px;">delete</span>
            </button>
        `;
        // Al hacer clic en la nota del historial, la recupera en la pantalla principal
        div.addEventListener('click', (e) => {
            if(!e.target.closest('.btn-delete-nota')) {
                cuadroTexto.value = nota.contenido;
                actualizarContadores();
                mostrarToast("Nota recuperada");
            }
        });
        listaHistorial.appendChild(div);
    });
}

window.eliminarNota = function(id) {
    let notasGuardadas = JSON.parse(localStorage.getItem('notas_dictado')) || [];
    notasGuardadas = notasGuardadas.filter(nota => nota.id !== id);
    localStorage.setItem('notas_dictado', JSON.stringify(notasGuardadas));
    cargarHistorial();
    mostrarToast("Nota eliminada");
};

// 6. Funciones comunes modificadas (Copiar, Borrar, Modo Oscuro, Toast)
document.getElementById('btn-copiar').addEventListener('click', () => {
    if(cuadroTexto.value.trim() === "") return;
    navigator.clipboard.writeText(cuadroTexto.value);
    mostrarToast("¡Copiado al portapapeles!");
});

document.getElementById('btn-borrar').addEventListener('click', () => {
    if(cuadroTexto.value.trim() === "") return;
    if (confirm("¿Seguro que quieres borrar todo el texto actual?")) {
        bloqueoPorBorrado = true;
        detenerEscucha();
        cuadroTexto.value = "";
        cronometroElement.classList.add('oculto');
        actualizarContadores();
    }
});

function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.classList.add('mostrar');
    setTimeout(() => toast.classList.remove('mostrar'), 2500);
}

// Inicializar el historial al abrir la app
cargarHistorial();

// Modo Oscuro
const btnTheme = document.getElementById('btn-theme');
btnTheme.addEventListener('click', () => {
    const nuevoTema = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nuevoTema);
    btnTheme.querySelector('span').textContent = nuevoTema === 'dark' ? 'light_mode' : 'dark_mode';
});
