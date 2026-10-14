
const FILAS = 8;
const COLUMNAS = 8;
const TOTAL_MINAS = 10;

const tableroHTML = document.getElementById("tablero");
const contadorMinas = document.getElementById("minas");
const estadoHTML = document.getElementById("estado");
const botonReiniciar = document.getElementById("reiniciar");

let tablero = [];
let juegoTerminado = false;
let juegoIniciado = false;
let banderas = 0;
let casillasDescubiertas = 0;

// Iniciar o reiniciar el juego
function iniciarJuego() {
    tablero = [];
    juegoTerminado = false;
    juegoIniciado = false;
    banderas = 0;
    casillasDescubiertas = 0;

    estadoHTML.textContent = "¡Buena suerte!";
    contadorMinas.textContent = TOTAL_MINAS;
    tableroHTML.innerHTML = "";

    for (let fila = 0; fila < FILAS; fila++) {
        tablero[fila] = [];

        for (let columna = 0; columna < COLUMNAS; columna++) {
            tablero[fila][columna] = {
                mina: false,
                descubierta: false,
                bandera: false,
                minasCercanas: 0
            };

            const casilla = document.createElement("button");
            casilla.classList.add("casilla");
            casilla.type = "button";
            casilla.setAttribute(
                "aria-label",
                `Fila ${fila + 1}, columna ${columna + 1}`
            );

            casilla.addEventListener("click", () => {
                descubrirCasilla(fila, columna);
            });

            casilla.addEventListener("contextmenu", (evento) => {
                evento.preventDefault();
                colocarBandera(fila, columna);
            });

            tableroHTML.appendChild(casilla);
        }
    }
}

// Generar minas evitando la primera casilla y sus vecinos
function generarMinas(filaSegura, columnaSegura) {
    const posiciones = [];

    for (let fila = 0; fila < FILAS; fila++) {
        for (let columna = 0; columna < COLUMNAS; columna++) {
            const esZonaSegura =
                Math.abs(fila - filaSegura) <= 1 &&
                Math.abs(columna - columnaSegura) <= 1;

            if (!esZonaSegura) {
                posiciones.push({ fila, columna });
            }
        }
    }

    // Mezclar las posiciones aleatoriamente
    for (let i = posiciones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posiciones[i], posiciones[j]] =
            [posiciones[j], posiciones[i]];
    }

    // Colocar las 10 minas
    for (let i = 0; i < TOTAL_MINAS; i++) {
        const posicion = posiciones[i];
        tablero[posicion.fila][posicion.columna].mina = true;
    }

    // Calcular las minas vecinas de cada casilla
    for (let fila = 0; fila < FILAS; fila++) {
        for (let columna = 0; columna < COLUMNAS; columna++) {
            if (!tablero[fila][columna].mina) {
                tablero[fila][columna].minasCercanas =
                    contarMinasVecinas(fila, columna);
            }
        }
    }
}

// Contar las minas que rodean una casilla
function contarMinasVecinas(fila, columna) {
    let total = 0;

    for (let df = -1; df <= 1; df++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nuevaFila = fila + df;
            const nuevaColumna = columna + dc;

            if (
                nuevaFila >= 0 &&
                nuevaFila < FILAS &&
                nuevaColumna >= 0 &&
                nuevaColumna < COLUMNAS &&
                tablero[nuevaFila][nuevaColumna].mina
            ) {
                total++;
            }
        }
    }

    return total;
}

// Obtener el botón que corresponde a una posición
function obtenerCasillaHTML(fila, columna) {
    return tableroHTML.children[fila * COLUMNAS + columna];
}

// Descubrir una casilla
function descubrirCasilla(fila, columna) {
    if (juegoTerminado) return;

    const casilla = tablero[fila][columna];

    if (casilla.descubierta || casilla.bandera) return;

    if (!juegoIniciado) {
        generarMinas(fila, columna);
        juegoIniciado = true;
    }

    // Si hay una mina, el jugador pierde
    if (casilla.mina) {
        casilla.descubierta = true;
        actualizarCasilla(fila, columna);
        finalizarJuego(false);
        return;
    }

    // Descubrir casillas vacías y sus vecinas
    descubrirZona(fila, columna);
    comprobarVictoria();
}

// Descubrir una zona sin minas vecinas
function descubrirZona(fila, columna) {
    if (
        fila < 0 || fila >= FILAS ||
        columna < 0 || columna >= COLUMNAS
    ) {
        return;
    }

    const casilla = tablero[fila][columna];

    if (
        casilla.descubierta ||
        casilla.bandera ||
        casilla.mina
    ) {
        return;
    }

    casilla.descubierta = true;
    casillasDescubiertas++;
    actualizarCasilla(fila, columna);

    if (casilla.minasCercanas === 0) {
        for (let df = -1; df <= 1; df++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (df !== 0 || dc !== 0) {
                    descubrirZona(fila + df, columna + dc);
                }
            }
        }
    }
}

// Actualizar el aspecto de una casilla
function actualizarCasilla(fila, columna) {
    const casilla = tablero[fila][columna];
    const boton = obtenerCasillaHTML(fila, columna);

    boton.classList.remove("bandera", "mina");

    if (casilla.bandera) {
        boton.textContent = "🚩";
        boton.classList.add("bandera");
        return;
    }

    if (!casilla.descubierta) {
        boton.textContent = "";
        return;
    }

    boton.classList.add("descubierta");

    if (casilla.mina) {
        boton.textContent = "💣";
        boton.classList.add("mina");
    } else if (casilla.minasCercanas > 0) {
        boton.textContent = casilla.minasCercanas;
        boton.classList.add(`numero-${casilla.minasCercanas}`);
    } else {
        boton.textContent = "";
    }
}

// Colocar o quitar una bandera
function colocarBandera(fila, columna) {
    if (juegoTerminado) return;

    const casilla = tablero[fila][columna];

    if (casilla.descubierta) return;

    if (!casilla.bandera && banderas >= TOTAL_MINAS) {
        estadoHTML.textContent = "No quedan banderas disponibles";
        return;
    }

    casilla.bandera = !casilla.bandera;
    banderas += casilla.bandera ? 1 : -1;

    actualizarCasilla(fila, columna);
    contadorMinas.textContent = TOTAL_MINAS - banderas;

    estadoHTML.textContent = "¡Sigue buscando!";
}

// Comprobar si todas las casillas seguras fueron descubiertas
function comprobarVictoria() {
    if (casillasDescubiertas === FILAS * COLUMNAS - TOTAL_MINAS) {
        finalizarJuego(true);
    }
}

// Terminar la partida
function finalizarJuego(victoria) {
    juegoTerminado = true;

    if (victoria) {
        estadoHTML.textContent = "¡Ganaste! 🎉";
    } else {
        estadoHTML.textContent = "¡Explotaste una mina! 💥";
    }

    // Mostrar todas las minas
    for (let fila = 0; fila < FILAS; fila++) {
        for (let columna = 0; columna < COLUMNAS; columna++) {
            const casilla = tablero[fila][columna];

            if (casilla.mina) {
                casilla.descubierta = true;
                actualizarCasilla(fila, columna);
            }

            obtenerCasillaHTML(fila, columna).disabled = true;
        }
    }
}

// Botón para comenzar otra partida
botonReiniciar.addEventListener("click", iniciarJuego);

// Crear el tablero al cargar la página
iniciarJuego();
