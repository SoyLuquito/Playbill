import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// ==================== MOSAICO DE FUNDO ====================
(function gerarMosaico() {
    const grid = document.getElementById('mosaicGrid');
    const bg = document.querySelector('.mosaic-bg');
    if (!grid || !bg) return;

    const totalImagens = 14;
    const imagens = [];
    for (let i = 1; i <= totalImagens; i++) {
        imagens.push(`img/img${i}.png`);
    }

    // Tamanhos: desktop 180x260 / mobile 110x160
    function getTileSize() {
        const isMobile = window.innerWidth <= 640;
        return isMobile
            ? { w: 110, h: 160 }
            : { w: 180, h: 260 };
    }

    // Embaralha (Fisher-Yates)
    function embaralhar(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function build() {
        const { w: tileW, h: tileH } = getTileSize();

        const cols = Math.ceil(window.innerWidth / tileW) + 1;

        const docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
        const rows = Math.ceil(docHeight / tileH) + 1;
        const totalTiles = cols * rows;

        grid.style.gridTemplateColumns = `repeat(${cols}, ${tileW}px)`;
        grid.style.gridAutoRows = `${tileH}px`;
        grid.style.width = `${cols * tileW}px`;
        grid.style.height = `${rows * tileH}px`;
        bg.style.height = `${rows * tileH}px`;

        let sequencia = [];
        while (sequencia.length < totalTiles) {
            sequencia = sequencia.concat(embaralhar(imagens));
        }
        sequencia = sequencia.slice(0, totalTiles);

        const fragment = document.createDocumentFragment();
        sequencia.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.className = 'mosaic-tile';
            img.alt = '';
            img.loading = 'lazy';
            img.style.width = `${tileW}px`;
            img.style.height = `${tileH}px`;
            fragment.appendChild(img);
        });

        grid.innerHTML = '';
        grid.appendChild(fragment);
    }

    window.addEventListener('load', build);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 250);
    });
})();

// ==================== FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyDobbByDr06LwZCpozM2dvEn33oHCgIVNo",
    authDomain: "cabaret-921fc.firebaseapp.com",
    projectId: "cabaret-921fc",
    storageBucket: "cabaret-921fc.firebasestorage.app",
    messagingSenderId: "586204605835",
    appId: "1:586204605835:web:9c7fd1b42923208d84938e",
    measurementId: "G-ZP6HG0FWJW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== LOCALSTORAGE ====================
let userDeviceId = localStorage.getItem('cabaret_device_id');
if (!userDeviceId) {
    userDeviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('cabaret_device_id', userDeviceId);
}

let userNome = localStorage.getItem('cabaret_user_nome');
let userConfirmado = localStorage.getItem('cabaret_user_confirmado') === 'true';

function atualizarUserInfo() {
    const userMatchDiv = document.getElementById('userMatchInfo');
    const userMatchDivLista = document.getElementById('userMatchInfoLista');
    const msg = userNome && userConfirmado ?
        `<i class="fas fa-user-check"></i> Olá, ${userNome}! Seu nome será vinculado automaticamente.` :
        userNome ? `<i class="fas fa-user"></i> Olá, ${userNome}!` : '';

    if (msg) {
        userMatchDiv.style.display = 'block';
        userMatchDiv.innerHTML = msg;
        userMatchDivLista.style.display = 'block';
        userMatchDivLista.innerHTML = msg;
    }
}

// ==================== PIX - ALICIA (só chave) ====================
const pixKeyAlicia = "58623800869";

// ==================== LISTA DE PRESENTES ====================
const listaPresentes = {
    Alicia: [
        { id: 'a1', nome: 'Perfume', detalhe: 'Doces' },
        { id: 'a2', nome: 'Camisa / Blusa', detalhe: 'Tamanho M' },
        { id: 'a3', nome: 'Bijuteria', detalhe: 'Dourada' },
        { id: 'a4', nome: 'Livros', detalhe: '' },
        { id: 'a5', nome: 'Kit de Maquiagem', detalhe: '' }
    ]
};

const iconesMap = {
    'Perfume': 'fa-spray-can-sparkles',
    'Camisa / Blusa': 'fa-tshirt',
    'Bijuteria': 'fa-gem',
    'Livros': 'fa-book',
    'Kit de Maquiagem': 'fa-wand-magic-sparkles'
};

// ==================== VARIÁVEIS ====================
let selectedPersonPix = null;
let selectedPersonLista = null;

const pixArea = document.getElementById('pixArea');
const pixLabel = document.getElementById('pixLabel');
const msgArea = document.getElementById('msgArea');
const toggleMsgBtn = document.getElementById('toggleMsgBtn');
const feedbackPresente = document.getElementById('feedbackPresente');

// ==================== PIX: SÓ MOSTRAR CHAVE ====================
function resetarSelecaoPix() {
    selectedPersonPix = null;
    pixArea.style.display = 'none';
    msgArea.classList.remove('show');
    toggleMsgBtn.innerHTML = '<i class="fas fa-comment"></i> Quero deixar uma mensagem';
    document.getElementById('nomePresente').value = '';
    document.getElementById('mensagemPresente').value = '';
    feedbackPresente.textContent = '';
    document.getElementById('chooseAlicia').classList.remove('active');
}

document.getElementById('chooseAlicia').addEventListener('click', () => {
    if (selectedPersonPix === 'Alicia') {
        resetarSelecaoPix();
    } else {
        resetarSelecaoPix();
        selectedPersonPix = 'Alicia';
        document.getElementById('chooseAlicia').classList.add('active');
        pixLabel.innerHTML = `<i class="fas fa-gift"></i> Pix para Alicia - Chave: <strong>${pixKeyAlicia}</strong>`;
        pixArea.style.display = 'block';
    }
});

// Copiar PIX
document.getElementById('copyPixBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(pixKeyAlicia);
    const btn = document.getElementById('copyPixBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Chave copiada!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
});

// Toggle mensagem
toggleMsgBtn.addEventListener('click', () => {
    msgArea.classList.toggle('show');
    if (msgArea.classList.contains('show')) {
        toggleMsgBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar mensagem';
        if (userNome) {
            document.getElementById('nomePresente').value = userNome;
        }
    } else {
        toggleMsgBtn.innerHTML = '<i class="fas fa-comment"></i> Quero deixar uma mensagem';
        document.getElementById('nomePresente').value = '';
        document.getElementById('mensagemPresente').value = '';
    }
});

// Enviar mensagem
document.getElementById('btnEnviarMsg').addEventListener('click', async () => {
    let nome = document.getElementById('nomePresente').value.trim();
    const mensagem = document.getElementById('mensagemPresente').value.trim();

    if (!selectedPersonPix) {
        feedbackPresente.textContent = 'Escolha a aniversariante primeiro';
        feedbackPresente.className = 'feedback-msg error';
        return;
    }
    if (!nome && userNome) {
        nome = userNome;
        document.getElementById('nomePresente').value = nome;
    }
    if (!nome) {
        feedbackPresente.textContent = 'Por favor, digite seu nome e sobrenome';
        feedbackPresente.className = 'feedback-msg error';
        return;
    }
    if (!mensagem) {
        feedbackPresente.textContent = 'Por favor, escreva sua mensagem';
        feedbackPresente.className = 'feedback-msg error';
        return;
    }

    const btn = document.getElementById('btnEnviarMsg');
    btn.disabled = true;
    btn.innerHTML = 'ENVIANDO...';
    feedbackPresente.textContent = '';

    try {
        const q = query(collection(db, "convidados"), where("nome", "==", nome));
        const querySnapshot = await getDocs(q);

        const presenteData = {
            nome: nome,
            deviceId: userDeviceId,
            presentePara: selectedPersonPix,
            mensagem: mensagem,
            timestamp: serverTimestamp(),
            tipo: 'pix'
        };

        if (!querySnapshot.empty) {
            await updateDoc(querySnapshot.docs[0].ref, {
                presente: {
                    para: selectedPersonPix,
                    mensagem: mensagem,
                    timestamp: new Date()
                }
            });
            presenteData.convidadoVinculado = true;

            if (!userNome) {
                localStorage.setItem('cabaret_user_nome', nome);
                localStorage.setItem('cabaret_user_confirmado', 'true');
                userNome = nome;
                userConfirmado = true;
                atualizarUserInfo();
            }
        } else {
            presenteData.convidadoVinculado = false;
        }

        await addDoc(collection(db, "presentes"), presenteData);

        feedbackPresente.textContent = `Mensagem enviada para ${selectedPersonPix}! Muito obrigado!`;
        feedbackPresente.className = 'feedback-msg success';

        document.getElementById('nomePresente').value = '';
        document.getElementById('mensagemPresente').value = '';
        msgArea.classList.remove('show');
        toggleMsgBtn.innerHTML = '<i class="fas fa-comment"></i> Quero deixar uma mensagem';

    } catch (error) {
        console.error("Erro:", error);
        feedbackPresente.textContent = `Erro ao enviar: ${error.message}`;
        feedbackPresente.className = 'feedback-msg error';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> ENVIAR MENSAGEM';
    }
});

// ==================== LISTA DE PRESENTES ====================
function renderizarListaPresentes(pessoa) {
    const container = document.getElementById('presenteListaContainer');
    const presentes = listaPresentes[pessoa] || [];
    container.innerHTML = '';

    if (presentes.length === 0) {
        container.innerHTML = `
            <div class="lista-vazia" style="grid-column: 1 / -1;">
                <i class="fas fa-box-open"></i>
                <p>Nenhum presente cadastrado ainda para ${pessoa}.</p>
            </div>
        `;
        return;
    }

    presentes.forEach(item => {
        const div = document.createElement('div');
        div.className = 'presente-item';
        const icone = iconesMap[item.nome] || 'fa-gift';
        div.innerHTML = `
            <span class="presente-icon"><i class="fas ${icone}"></i></span>
            <span class="presente-nome">${item.nome}</span>
            ${item.detalhe ? `<span class="presente-detalhe">${item.detalhe}</span>` : ''}
        `;
        container.appendChild(div);
    });
}

document.getElementById('chooseAliciaLista').addEventListener('click', () => {
    if (selectedPersonLista === 'Alicia') {
        selectedPersonLista = null;
        document.getElementById('chooseAliciaLista').classList.remove('active');
        document.getElementById('listaPresentesArea').style.display = 'none';
        return;
    }
    selectedPersonLista = 'Alicia';
    document.getElementById('chooseAliciaLista').classList.add('active');
    document.getElementById('listaPresentesArea').style.display = 'block';
    renderizarListaPresentes('Alicia');
});

// ==================== CONFIRMAR PRESENÇA ====================
window.confirmarPresenca = async function(nome, deviceId) {
    try {
        const q = query(collection(db, "convidados"), where("nome", "==", nome));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, error: "Este nome já confirmou presença!" };
        }

        await addDoc(collection(db, "convidados"), {
            nome: nome,
            deviceId: deviceId,
            timestamp: serverTimestamp(),
            presente: null
        });

        localStorage.setItem('cabaret_user_nome', nome);
        localStorage.setItem('cabaret_user_confirmado', 'true');
        userNome = nome;
        userConfirmado = true;
        atualizarUserInfo();

        return { success: true };
    } catch (error) {
        console.error("Erro ao salvar:", error);
        return { success: false, error: error.message };
    }
};

const btnConfirmar = document.getElementById('btnConfirmar');
const nomeInput = document.getElementById('nomeConvidado');
const feedbackDiv = document.getElementById('mensagemFeedback');

btnConfirmar.addEventListener('click', async () => {
    const nome = nomeInput.value.trim();
    if (!nome) {
        feedbackDiv.textContent = 'Por favor, digite seu nome.';
        feedbackDiv.className = 'feedback-msg error';
        return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'ENVIANDO...';
    feedbackDiv.textContent = '';

    try {
        const result = await window.confirmarPresenca(nome, userDeviceId);
        if (result.success) {
            feedbackDiv.textContent = 'Presença confirmada! Te esperamos lá!';
            feedbackDiv.className = 'feedback-msg success';
            nomeInput.value = '';
        } else {
            feedbackDiv.textContent = result.error;
            feedbackDiv.className = 'feedback-msg error';
        }
    } catch (error) {
        feedbackDiv.textContent = 'Erro ao confirmar. Tente novamente.';
        feedbackDiv.className = 'feedback-msg error';
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-calendar-check"></i> CONFIRMAR';
    }
});

nomeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnConfirmar.click();
});

// ==================== TABS ====================
document.querySelectorAll('.presente-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.presente-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.presente-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`tab-${target}`).classList.add('active');
    });
});

// ==================== CALENDÁRIO ====================
document.getElementById('addToCalendarBtn').addEventListener('click', function() {
    const titulo = 'Alicia 20 Anos - Playbill';
    const descricao = 'Um musical inesquecível para celebrar os 20 anos da Alicia!';
    const local = 'Duplexx House - R. Ushikichi Kamiya, 611';
    const dataInicio = '20261114T220000';
    const dataFim = '20261115T010000';
    const fuso = 'America/Sao_Paulo';

    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${dataInicio}/${dataFim}&details=${encodeURIComponent(descricao)}&location=${encodeURIComponent(local)}&ctz=${encodeURIComponent(fuso)}`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Alicia//Playbill//EN
BEGIN:VEVENT
UID:${Date.now()}@playbill.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${dataInicio}
DTEND:${dataFim}
SUMMARY:${titulo}
DESCRIPTION:${descricao}
LOCATION:${local}
END:VEVENT
END:VCALENDAR`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Alicia_20_Playbill.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } else {
        window.open(googleUrl, '_blank');
    }
});

// ==================== MAPA ====================
const address = encodeURIComponent('R. Ushikichi Kamiya, 611');
function openMap() {
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
}
const mapTrigger = document.getElementById('mapTrigger');
if (mapTrigger) mapTrigger.addEventListener('click', openMap);

// ==================== SCROLL REVEAL ====================
const revealElements = document.querySelectorAll('.reveal');
function checkReveal() {
    const windowHeight = window.innerHeight;
    const revealThreshold = 100;
    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        if (elementTop < windowHeight - revealThreshold) {
            element.classList.add('active');
        }
    });
}
window.addEventListener('scroll', checkReveal);
window.addEventListener('resize', checkReveal);
checkReveal();

// ==================== MÚSICA DE FUNDO ====================
(function configurarMusica() {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicToggle');
    if (!audio || !btn) return;

    // Tenta tocar automaticamente (a maioria dos navegadores bloqueia)
    audio.volume = 0.4;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            btn.classList.add('playing');
        }).catch(() => {
            // Autoplay bloqueado — usuário precisa clicar
        });
    }

    // Toggle manual
    btn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            btn.classList.add('playing');
        } else {
            audio.pause();
            btn.classList.remove('playing');
        }
    });
})();

// ==================== INICIALIZAÇÃO ====================
atualizarUserInfo();

if (userNome) {
    nomeInput.value = userNome;
    nomeInput.disabled = true;
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = 'PRESENÇA JÁ CONFIRMADA';
}