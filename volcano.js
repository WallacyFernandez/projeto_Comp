// Cena, câmera e renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Ativar sombras
document.getElementById('container').appendChild(renderer.domElement);

// Luz ambiente e luz direcional
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Luz suave ambiente
scene.add(ambientLight);

// Luz focal posicionada acima da ilha
const spotlight = new THREE.SpotLight(0xffffff, 2);
spotlight.position.set(50, 50, 40); // Posição da luz acima da ilha
spotlight.castShadow = true;
spotlight.angle = Math.PI / 4;
scene.add(spotlight);

// Luz direcional adicional para melhor clareza de sombras
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 100, 50); // Posição da luz (acima e à direita da ilha)
scene.add(directionalLight);

// TEXTURAS (corrigindo os links quebrados)
const loader = new THREE.TextureLoader();
const grassTexture = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
const rockTexture = loader.load('fundo-de-textura-de-pedra-granulada-aspera_653449-5500.avif');
const lavaTexture = loader.load('https://threejs.org/examples/textures/lava/lavatile.jpg');

// Configuração da textura da grama
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10, 5); // Ajuste este valor para controlar a repetição da textura

// Criação da ilha
const islandGeometry = new THREE.CircleGeometry(20, 32);
const grassNormalMap = loader.load('grama.png');
const islandMaterial = new THREE.MeshStandardMaterial({ 
    map: grassTexture,
    normalMap: grassNormalMap,
    roughness: 0.8,
    metalness: 0.2
});
const island = new THREE.Mesh(islandGeometry, islandMaterial);
island.rotation.x = -Math.PI / 2;
island.receiveShadow = true;
scene.add(island);

// Vulcão (cone truncado com cratera)
const volcanoRadius = 8;
const volcanoHeight = 10;
const craterRadius = 2;
const volcanoGeometry = new THREE.CylinderGeometry(craterRadius, volcanoRadius, volcanoHeight, 32, 1, true);
const volcanoMaterial = new THREE.MeshPhongMaterial({ map: rockTexture });
const volcano = new THREE.Mesh(volcanoGeometry, volcanoMaterial);

// Cratera (topo do vulcão)
const craterGeometry = new THREE.CircleGeometry(craterRadius, 32);
const craterMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
const crater = new THREE.Mesh(craterGeometry, craterMaterial);
crater.rotation.x = -Math.PI / 2;
crater.position.y = volcanoHeight / 2;

// Grupo para o vulcão e suas partículas
const volcanoGroup = new THREE.Group();
volcanoGroup.add(volcano);
volcanoGroup.add(crater);

// Ajuste a posição do grupo do vulcão para ficar no mesmo nível da ilha
volcanoGroup.position.set(0, 5, 0);

scene.add(volcanoGroup);

// Lava brilhante no topo do vulcão
const lavaLight = new THREE.PointLight(0xff4500, 3, 20);
lavaLight.position.set(0, volcanoHeight / 2 + 5, 0);
volcanoGroup.add(lavaLight);

const barkTexture = loader.load('tronco.jpeg');
const leavesTexture = loader.load('folhas.jpg');

// Árvores
function createTree(x, z) {
    // Tronco
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 12);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        map: barkTexture,
        roughness: 0.8,
        metalness: 0.2
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

    // Folhas
    const leavesGeometry = new THREE.SphereGeometry(2, 8, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
        map: leavesTexture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        roughness: 0.8,
        metalness: 0.2
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 3, z);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    scene.add(leaves);
}

// Adicionar árvores
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 15;
    const z = Math.sin(angle) * 15;
    createTree(x, z);
}

// Pedras
function createRock(x, z) {
    const rockGeometry = new THREE.IcosahedronGeometry(1, 1);
    const rockMaterial = new THREE.MeshStandardMaterial({ map: rockTexture });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 0.5, z);
    rock.castShadow = true;
    scene.add(rock);
}

// Adicionar pedras
for (let i = 0; i < 6; i++) {
    const x = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    createRock(x, z);
}

// Controle de câmera (OrbitControls)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 10;
controls.maxDistance = 50;

// Configuração da câmera inicial
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// Sistema de partículas para simular erupção
const particleCount = 10000;
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleVelocities = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    resetParticle(i);
}

function resetParticle(index) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * craterRadius;
    particlePositions[index * 3] = Math.cos(angle) * radius;
    particlePositions[index * 3 + 1] = volcanoHeight / 2;
    particlePositions[index * 3 + 2] = Math.sin(angle) * radius;

    const speed = 0.2 + Math.random() * 0.1;
    const angle3D = Math.random() * Math.PI * 2;
    const elevation = Math.random() * Math.PI / 6 + Math.PI / 12; // Entre 15 e 45 graus
    particleVelocities[index * 3] = Math.cos(angle3D) * Math.sin(elevation) * speed;
    particleVelocities[index * 3 + 1] = Math.cos(elevation) * speed;
    particleVelocities[index * 3 + 2] = Math.sin(angle3D) * Math.sin(elevation) * speed;
}

particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
    map: lavaTexture,
    color: 0xff4500,
    size: 0.3,
    transparent: true,
    opacity: 0.9
});

const particleSystem = new THREE.Points(particles, particleMaterial);
volcanoGroup.add(particleSystem);

// Variáveis de controle para a erupção
let isErupting = false;
let eruptionTimer = 0;
const eruptionInterval = 10000; // 10 segundos em milissegundos

// Função para iniciar a erupção
function startEruption() {
    isErupting = true;
    // Reiniciar todas as partículas
    for (let i = 0; i < particleCount; i++) {
        resetParticle(i);
    }
}

// Função para parar a erupção
function stopEruption() {
    isErupting = false;
}

// Animação de erupção
function animate() {
    requestAnimationFrame(animate);

    const currentTime = Date.now();
    if (currentTime - eruptionTimer > eruptionInterval) {
        if (isErupting) {
            stopEruption();
        } else {
            startEruption();
        }
        eruptionTimer = currentTime;
    }

    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        if (isErupting) {
            positions[i * 3] += particleVelocities[i * 3];
            positions[i * 3 + 1] += particleVelocities[i * 3 + 1];
            positions[i * 3 + 2] += particleVelocities[i * 3 + 2];

            // Aplica gravidade
            particleVelocities[i * 3 + 1] -= 0.006;

            // Verifica se a partícula atingiu a base da ilha
            if (positions[i * 3 + 1] + volcanoGroup.position.y <= 0) {
                resetParticle(i);
            }

            // Se a partícula sair muito longe, reinicie-a
            if (Math.abs(positions[i * 3]) > 20 || Math.abs(positions[i * 3 + 2]) > 20) {
                resetParticle(i);
            }
        } else {
            // Quando não está em erupção, esconde as partículas dentro do vulcão
            positions[i * 3] = 0;
            positions[i * 3 + 1] = -volcanoHeight / 2;
            positions[i * 3 + 2] = 0;
        }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);
}

// Inicializa o temporizador
eruptionTimer = Date.now();

animate();

// Ajuste de redimensionamento
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
