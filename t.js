// Sistema de partículas para a erupção do vulcão
const particleCount = 10000; // Define o número total de partículas
const particles = new THREE.BufferGeometry(); // Cria uma geometria para as partículas
const particlePositions = new Float32Array(particleCount * 3); // Array para armazenar as posições das partículas (x, y, z para cada partícula)
const particleVelocities = new Float32Array(particleCount * 3); // Array para armazenar as velocidades das partículas

// Inicializa todas as partículas
for (let i = 0; i < particleCount; i++) {
    resetParticle(i);
}

// Função para resetar uma partícula individual
function resetParticle(index) {
    const angle = Math.random() * Math.PI * 2; // Ângulo aleatório
    const radius = Math.random() * craterRadius; // Raio aleatório dentro da cratera
    // Define a posição inicial da partícula na borda da cratera
    particlePositions[index * 3] = Math.cos(angle) * radius;
    particlePositions[index * 3 + 1] = volcanoHeight / 2; // Altura do vulcão
    particlePositions[index * 3 + 2] = Math.sin(angle) * radius;

    const speed = 0.2 + Math.random() * 0.1; // Velocidade aleatória
    const angle3D = Math.random() * Math.PI * 2; // Ângulo 3D aleatório
    const elevation = Math.random() * Math.PI / 6 + Math.PI / 12; // Ângulo de elevação entre 15 e 45 graus
    // Define a velocidade inicial da partícula
    particleVelocities[index * 3] = Math.cos(angle3D) * Math.sin(elevation) * speed;
    particleVelocities[index * 3 + 1] = Math.cos(elevation) * speed;
    particleVelocities[index * 3 + 2] = Math.sin(angle3D) * Math.sin(elevation) * speed;
}

// ... (código para criar o material e o sistema de partículas)

// Dentro da função animate()
function animate() {
    // ... (outro código)

    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        if (isErupting) {
            // Atualiza a posição das partículas
            positions[i * 3] += particleVelocities[i * 3]; // Atualiza posição X
            positions[i * 3 + 1] += particleVelocities[i * 3 + 1]; // Atualiza posição Y
            positions[i * 3 + 2] += particleVelocities[i * 3 + 2]; // Atualiza posição Z

            // Aplica gravidade
            particleVelocities[i * 3 + 1] -= 0.006; // Reduz a velocidade vertical (simula gravidade)

            // Verifica se a partícula atingiu a base da ilha
            if (positions[i * 3 + 1] + volcanoGroup.position.y <= 0) {
                resetParticle(i); // Reseta a partícula se atingir o chão
            }

            // Se a partícula sair muito longe, reinicia-a
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

    particleSystem.geometry.attributes.position.needsUpdate = true; // Informa ao Three.js que as posições foram atualizadas
}