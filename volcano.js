const noise = new SimplexNoise(Math.random);
const teclasPressionadas = {};
// Cena, câmera e renderizador
const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.shadowMap.enabled = true;
document.getElementById('container').appendChild(renderizador.domElement);

// Luzes
cena.add(new THREE.AmbientLight(0x404040, 2));
const luzFocal = new THREE.SpotLight(0xffffff, 2);
luzFocal.position.set(50, 50, 40);
luzFocal.castShadow = true;
luzFocal.angle = Math.PI / 4;
cena.add(luzFocal);
const luzDirecional = new THREE.DirectionalLight(0xffffff, 1);
luzDirecional.position.set(50, 100, 50);
cena.add(luzDirecional);

// Carregamento de texturas
const carregador = new THREE.TextureLoader();
const texturaGrama = carregador.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
const texturaPedra = carregador.load('fundo-de-textura-de-pedra-granulada-aspera_653449-5500.avif');
const texturaLava = carregador.load('https://threejs.org/examples/textures/lava/lavatile.jpg');
texturaGrama.wrapS = texturaGrama.wrapT = THREE.RepeatWrapping;
texturaGrama.repeat.set(10, 5);

// Ilha
const tamanhoIlha = 80;
const resolucaoIlha = 200;
const geometriaIlha = new THREE.PlaneGeometry(tamanhoIlha, tamanhoIlha, resolucaoIlha - 1, resolucaoIlha - 1);
gerarTerreno(geometriaIlha);

const materialIlha = new THREE.MeshStandardMaterial({ 
    map: texturaGrama,
    normalMap: carregador.load('grama.png'),
    roughness: 0.8,
    metalness: 0.2
});
const ilha = new THREE.Mesh(geometriaIlha, materialIlha);
ilha.rotation.x = -Math.PI / 2;
ilha.receiveShadow = true;
cena.add(ilha);

// Vulcão
const grupoVulcao = new THREE.Group();
const vulcao = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 8, 12, 32, 1, true),
    new THREE.MeshPhongMaterial({ map: texturaPedra })
);
const cratera = new THREE.Mesh(
    new THREE.CircleGeometry(2, 32),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
);
cratera.rotation.x = -Math.PI / 2;
cratera.position.y = 5;
grupoVulcao.add(vulcao, cratera);
grupoVulcao.position.set(0, 6, 0);
cena.add(grupoVulcao);

// Lava
const luzLava = new THREE.PointLight(0xff4500, 3, 20);
luzLava.position.set(0, 12, 0);
grupoVulcao.add(luzLava);

// Árvores
const texturaTronco = carregador.load('tronco.jpeg');
const texturaFolhas = carregador.load('folhas.jpg');
function getAlturaTerreno(x, z) {
    const raycaster = new THREE.Raycaster(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
    const intersects = raycaster.intersectObject(ilha);
    if (intersects.length > 0) {
        return {
            altura: intersects[0].point.y,
            normal: intersects[0].face.normal
        };
    }
    return null; // Retorna null se não houver interseção com a ilha
}







function criarArvore(x, z) {
    const alturaTerreno = getAlturaTerreno(x, z);
    if (!alturaTerreno) return; // Não cria a árvore se não estiver na ilha

    const grupoArvore = new THREE.Group();

    const tronco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 2, 12),
        new THREE.MeshStandardMaterial({ map: texturaTronco, roughness: 0.8, metalness: 0.2 })
    );
    tronco.position.y = 1; // Metade da altura do tronco
    tronco.castShadow = tronco.receiveShadow = true;
    grupoArvore.add(tronco);

    const folhas = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshStandardMaterial({ map: texturaFolhas, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5, roughness: 0.8, metalness: 0.2 })
    );
    folhas.position.y = 3; // Topo do tronco + 1 unidade
    folhas.castShadow = folhas.receiveShadow = true;
    grupoArvore.add(folhas);

    // Alinhar a árvore com a normal da superfície
    const normalTerreno = alturaTerreno.normal;
    const eixoRotacao = new THREE.Vector3(0, 1, 0).cross(normalTerreno).normalize();
    const anguloRotacao = Math.acos(new THREE.Vector3(0, 1, 0).dot(normalTerreno));
    grupoArvore.setRotationFromAxisAngle(eixoRotacao, anguloRotacao);

    // Posicionar o grupo da árvore
    grupoArvore.position.set(x, alturaTerreno.altura, z);

    ilha.add(grupoArvore);
}

// Distribuir árvores no terreno
const numeroArvores = 30;
let tentativas = 0;
const maxTentativas = 400;
let arvoresCriadas = 0;
const distanciaMinima = 2; // Distância mínima entre árvores
const arvoresExistentes = []; // Array para armazenar as posições das árvores existentes

function distanciaMinimaSuficiente(x, z) {
    for (let arvore of arvoresExistentes) {
        const dx = x - arvore.x;
        const dz = z - arvore.z;
        const distancia = Math.sqrt(dx * dx + dz * dz);
        if (distancia < distanciaMinima) {
            return false;
        }
    }
    return true;
}

while (arvoresCriadas < numeroArvores && tentativas < maxTentativas) {
    let x = (Math.random() - 0.5) * tamanhoIlha;
    let z = (Math.random() - 0.5) * tamanhoIlha;
    
    const distanciaCentro = Math.sqrt(x*x + z*z);
    if (distanciaCentro <= tamanhoIlha / 2) { // Permite árvores em toda a ilha, exceto no centro imediato
        const alturaTerreno = getAlturaTerreno(x, z);
        if (alturaTerreno && alturaTerreno.altura > 0 && distanciaMinimaSuficiente(x, z)) {
            criarArvore(x, z);
            arvoresExistentes.push({x, z});
            arvoresCriadas++;
        }
    }
    
    tentativas++;
}

console.log(`Árvores criadas: ${arvoresCriadas}`);




// Pedras
function criarPedra(x, z) {
    const alturaTerreno = getAlturaTerreno(x, z);
    const pedra = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1, 1),
        new THREE.MeshStandardMaterial({ map: texturaPedra })
    );
    pedra.position.set(x, alturaTerreno + 0.5, z);
    pedra.castShadow = true;
    cena.add(pedra);
}
for (let i = 0; i < 6; i++) {
    criarPedra((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
}





// Plano de fundo
const fundo = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ map: carregador.load('Agua.jpeg') })
);
fundo.rotation.x = -Math.PI / 2;
fundo.position.y = -0.1;
cena.add(fundo);



// Partículas de erupção
const contagemParticulas = 20000;
const particulas = new THREE.BufferGeometry();
const posicoesParticulas = new Float32Array(contagemParticulas * 3);
const velocidadesParticulas = new Float32Array(contagemParticulas * 3);
for (let i = 0; i < contagemParticulas; i++) reiniciarParticula(i);
function reiniciarParticula(indice) {
    const angulo = Math.random() * Math.PI * 2;
    const raio = Math.random() * 2;
    posicoesParticulas[indice * 3] = Math.cos(angulo) * raio;
    posicoesParticulas[indice * 3 + 1] = 5;
    posicoesParticulas[indice * 3 + 2] = Math.sin(angulo) * raio;
    const velocidade = 0.2 + Math.random() * 0.1;
    const angulo3D = Math.random() * Math.PI * 2;
    const elevacao = Math.random() * Math.PI / 6 + Math.PI / 12;
    velocidadesParticulas[indice * 3] = Math.cos(angulo3D) * Math.sin(elevacao) * velocidade;
    velocidadesParticulas[indice * 3 + 1] = Math.cos(elevacao) * velocidade;
    velocidadesParticulas[indice * 3 + 2] = Math.sin(angulo3D) * Math.sin(elevacao) * velocidade;
}
particulas.setAttribute('position', new THREE.BufferAttribute(posicoesParticulas, 3));
const sistemaParticulas = new THREE.Points(particulas, new THREE.PointsMaterial({
    map: texturaLava,
    color: 0xff4500,
    size: 0.3,
    transparent: true,
    opacity: 0.9
}));
grupoVulcao.add(sistemaParticulas);

// Controle de erupção
let estaEruptando = false;
let temporizadorErupcao = Date.now();
const intervaloErupcao = 10000;
let jaEruptou = false;
let tempoInicioErupcao = 0;
const duracaoErupcaoIntensa = 20000; // 20 segundos

// Adicione esta função para controlar o movimento da aeronave
function moverAeronave() {
    if (teclasPressionadas['ArrowUp']) {
        grupoAeronave.translateZ(-velocidadeAeronave);
    }
    if (teclasPressionadas['ArrowDown']) {
        grupoAeronave.translateZ(velocidadeAeronave);
    }
    if (teclasPressionadas['ArrowLeft']) {
        grupoAeronave.rotateY(rotacaoAeronave);
    }
    if (teclasPressionadas['ArrowRight']) {
        grupoAeronave.rotateY(-rotacaoAeronave);
    }
    // Adicione estas linhas para o movimento vertical
    if (teclasPressionadas['KeyW']) {
        grupoAeronave.translateY(velocidadeAeronave);
    }
    if (teclasPressionadas['KeyS']) {
        grupoAeronave.translateY(-velocidadeAeronave);
    }
}

// Adicione estes event listeners após a declaração da função moverAeronave
window.addEventListener('keydown', (event) => {
    teclasPressionadas[event.code] = true;
});

window.addEventListener('keyup', (event) => {
    teclasPressionadas[event.code] = false;
});

function iniciarErupcao() {
    estaEruptando = true;
    tempoInicioErupcao = Date.now();
    for (let i = 0; i < contagemParticulas; i++) reiniciarParticula(i);
}

function animar() {
    requestAnimationFrame(animar);
    const tempoAtual = Date.now();
    
    if (!jaEruptou && tempoAtual - temporizadorErupcao >= intervaloErupcao) {
        iniciarErupcao();
        temporizadorErupcao = tempoAtual;
        jaEruptou = true;
    }
    
    const posicoes = sistemaParticulas.geometry.attributes.position.array;
    const tempoDecorrido = tempoAtual - tempoInicioErupcao;
    
    for (let i = 0; i < contagemParticulas; i++) {
        if (estaEruptando) {
            posicoes[i * 3] += velocidadesParticulas[i * 3];
            posicoes[i * 3 + 1] += velocidadesParticulas[i * 3 + 1];
            posicoes[i * 3 + 2] += velocidadesParticulas[i * 3 + 2];
            
            // Calcula a taxa de desaceleração com base no tempo decorrido
            let taxaDesaceleracao = 0.002;
            if (tempoDecorrido > duracaoErupcaoIntensa) {
                const tempoAposIntensidade = tempoDecorrido - duracaoErupcaoIntensa;
                taxaDesaceleracao = 0.002 + (tempoAposIntensidade / 1000) * 0.0008; // Aumenta gradualmente até 0.02
                taxaDesaceleracao = Math.min(taxaDesaceleracao, 0.02); // Limita a 0.02
            }
            
            velocidadesParticulas[i * 3 + 1] -= taxaDesaceleracao;
            
            if (posicoes[i * 3 + 1] + grupoVulcao.position.y <= 0 || Math.abs(posicoes[i * 3]) > 20 || Math.abs(posicoes[i * 3 + 2]) > 20) {
                reiniciarParticula(i);
            }
        } else {
            posicoes[i * 3] = 0;
            posicoes[i * 3 + 1] = -5;
            posicoes[i * 3 + 2] = 0;
        }
    }
    sistemaParticulas.geometry.attributes.position.needsUpdate = true;
    moverAeronave();
    renderizador.render(cena, camera);
}

animar();
window.addEventListener('resize', () => {
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    renderizador.setSize(largura, altura);
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
});

function gerarTerreno(geometria) {
    const posicoes = geometria.attributes.position.array;
    const tamanho = Math.sqrt(posicoes.length / 3);
    
    for (let i = 0; i < posicoes.length; i += 3) {
        const x = (i / 3) % tamanho;
        const y = Math.floor(i / 3 / tamanho);
        
        // Aumentar a escala do ruído para criar elevações mais pronunciadas
        let elevacao = noise.noise2D(x / 50, y / 50) * 5;
        elevacao += noise.noise2D(x / 25, y / 25) * 2.5;
        elevacao += noise.noise2D(x / 12.5, y / 12.5) * 1.25;
        
        // Criar uma depressão no centro para o vulcão
        const centroX = tamanho / 2;
        const centroY = tamanho / 2;
        const distanciaCentro = Math.sqrt(Math.pow(x - centroX, 2) + Math.pow(y - centroY, 2));
        const raioDepressao = tamanho / 4;
        if (distanciaCentro < raioDepressao) {
            elevacao -= (1 - distanciaCentro / raioDepressao) * 3;
        }
        
        // Aplicar a elevação
        posicoes[i + 2] = elevacao;
    }
    
    geometria.attributes.position.needsUpdate = true;
    geometria.computeVertexNormals();
}

// Após a declaração da câmera e antes da criação do renderizador

const grupoAeronave = new THREE.Group();
const carregadorGLTF = new THREE.GLTFLoader();

carregadorGLTF.load(
    'airship/scene.gltf',
    function (gltf) {
        const modelo = gltf.scene;
        modelo.scale.set(0.1, 0.1, 0.1); // Ajuste a escala conforme necessário
        
        // Rotacionar o modelo para que fique virado para frente
        modelo.rotation.y = Math.PI / 2; // Rotação de 90 graus em torno do eixo Y
        
        grupoAeronave.add(modelo);
        cena.add(grupoAeronave);
    },
    undefined,
    function (error) {
        console.error('Erro ao carregar o modelo:', error);
    }
);

// Posição inicial da aeronave
grupoAeronave.position.set(0, 15, 25);

// Após a criação do grupoAeronave
const velocidadeAeronave = 0.1;
const rotacaoAeronave = 0.02;

// Remova ou comente a linha que adiciona os controles OrbitControls
// const controles = new THREE.OrbitControls(camera, renderizador.domElement);

// Substitua a configuração inicial da câmera por:
camera.position.set(0, 1.2, 3);
grupoAeronave.add(camera);

// Modifique a função animar para incluir o movimento da aeronave
function animar() {
    requestAnimationFrame(animar);
    const tempoAtual = Date.now();
    
    if (!jaEruptou && tempoAtual - temporizadorErupcao >= intervaloErupcao) {
        iniciarErupcao();
        temporizadorErupcao = tempoAtual;
        jaEruptou = true;
    }
    
    const posicoes = sistemaParticulas.geometry.attributes.position.array;
    const tempoDecorrido = tempoAtual - tempoInicioErupcao;
    
    for (let i = 0; i < contagemParticulas; i++) {
        if (estaEruptando) {
            posicoes[i * 3] += velocidadesParticulas[i * 3];
            posicoes[i * 3 + 1] += velocidadesParticulas[i * 3 + 1];
            posicoes[i * 3 + 2] += velocidadesParticulas[i * 3 + 2];
            
            // Calcula a taxa de desaceleração com base no tempo decorrido
            let taxaDesaceleracao = 0.002;
            if (tempoDecorrido > duracaoErupcaoIntensa) {
                const tempoAposIntensidade = tempoDecorrido - duracaoErupcaoIntensa;
                taxaDesaceleracao = 0.002 + (tempoAposIntensidade / 1000) * 0.0008; // Aumenta gradualmente até 0.02
                taxaDesaceleracao = Math.min(taxaDesaceleracao, 0.02); // Limita a 0.02
            }
            
            velocidadesParticulas[i * 3 + 1] -= taxaDesaceleracao;
            
            if (posicoes[i * 3 + 1] + grupoVulcao.position.y <= 0 || Math.abs(posicoes[i * 3]) > 20 || Math.abs(posicoes[i * 3 + 2]) > 20) {
                reiniciarParticula(i);
            }
        } else {
            posicoes[i * 3] = 0;
            posicoes[i * 3 + 1] = -5;
            posicoes[i * 3 + 2] = 0;
        }
    }
    sistemaParticulas.geometry.attributes.position.needsUpdate = true;
    moverAeronave();
    renderizador.render(cena, camera);
}


