// Advanced 3D Alpine Mountain Environment with PBR Materials
class AlpineMountainBackground {
   constructor(canvasId) {
        this.canvasId = canvasId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.terrain = null;
        this.snowParticles = null;
        this.clouds = null;
        this.textures = {};
        this.uniforms = {};
        this.mouse = { x: 0, y: 0 };
        this.time = 0;
        this.isLoading = true;
        
        this.init();
        this.loadTextures();
        this.setupLighting();
        this.addEventListeners();
        this.animate();
    }

    init() {
        // Scene setup with atmospheric fog
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 200);
        this.scene.background = new THREE.Color(0x87CEEB);

        // Camera setup with cinematic positioning
        this.camera = new THREE.PerspectiveCamera(
            60, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 15, 25);
        this.camera.lookAt(0, 0, -10);

        // WebGL renderer with advanced settings
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('bg-canvas'),
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x87CEEB, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Initialize uniforms for shaders
        this.uniforms = {
            time: { value: 0 },
            fogColor: { value: new THREE.Color(0x87CEEB) },
            fogNear: { value: 10 },
            fogFar: { value: 200 }
        };
    }

    async loadTextures() {
        const loader = new THREE.TextureLoader();
        const texturePromises = [];

        // Define texture mapping based on your files
        const textureConfig = {
            albedo: 'textures/4.webp',      // Base color/albedo for rock surfaces
            normal: 'textures/5.webp',      // Normal map for surface detail
            noise: 'textures/1.webp',       // Procedural noise for surface variation
            roughness: 'textures/2.webp',   // General noise for displacement/roughness
            perlin: 'textures/3.webp',      // Perlin noise for terrain generation
            snow: 'textures/6.webp'         // Snow covered texture (alpine environment)
        };

        // Load all textures asynchronously
        for (const [key, path] of Object.entries(textureConfig)) {
            const promise = new Promise((resolve, reject) => {
                loader.load(
                    path,
                    (texture) => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.flipY = false;
                        
                        // Specific settings for different texture types
                        if (key === 'normal') {
                            texture.format = THREE.RGBFormat;
                        }
                        
                        this.textures[key] = texture;
                        resolve(texture);
                    },
                    undefined,
                    reject
                );
            });
            texturePromises.push(promise);
        }

        try {
            await Promise.all(texturePromises);
            console.log('All textures loaded successfully');
            this.createTerrain();
            this.createSnowParticles();
            this.createAtmosphericEffects();
            this.isLoading = false;
        } catch (error) {
            console.warn('Some textures failed to load, using fallbacks:', error);
            this.createFallbackTextures();
            this.createTerrain();
            this.createSnowParticles();
            this.createAtmosphericEffects();
            this.isLoading = false;
        }
    }

    createFallbackTextures() {
        // Create procedural fallback textures if loading fails
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Fallback rock texture
        this.textures.albedo = this.generateNoiseTexture(canvas, ctx, '#666666', '#999999');
        this.textures.normal = this.generateNormalTexture(canvas, ctx);
        this.textures.noise = this.generateNoiseTexture(canvas, ctx, '#000000', '#ffffff');
        this.textures.roughness = this.generateNoiseTexture(canvas, ctx, '#333333', '#cccccc');
        this.textures.perlin = this.generatePerlinTexture(canvas, ctx);
        this.textures.snow = this.generateNoiseTexture(canvas, ctx, '#eeeeee', '#ffffff');
    }

    generateNoiseTexture(canvas, ctx, color1, color2) {
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = Math.random();
            const gray = Math.floor(255 * noise);
            imageData.data[i] = gray;
            imageData.data[i + 1] = gray;
            imageData.data[i + 2] = gray;
            imageData.data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }

    generateNormalTexture(canvas, ctx) {
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 128;     // R
            imageData.data[i + 1] = 128; // G  
            imageData.data[i + 2] = 255; // B (pointing up)
            imageData.data[i + 3] = 255; // A
        }
        ctx.putImageData(imageData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }

    generatePerlinTexture(canvas, ctx) {
        // Simplified Perlin-like noise
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        for (let x = 0; x < canvas.width; x++) {
            for (let y = 0; y < canvas.height; y++) {
                const noise = this.perlinNoise(x * 0.01, y * 0.01);
                const value = Math.floor((noise + 1) * 127.5);
                const index = (y * canvas.width + x) * 4;
                imageData.data[index] = value;
                imageData.data[index + 1] = value;
                imageData.data[index + 2] = value;
                imageData.data[index + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }

    perlinNoise(x, y) {
        return Math.sin(x * 2) * Math.cos(y * 3) * 0.5 + 
               Math.sin(x * 4) * Math.cos(y * 2) * 0.25 +
               Math.sin(x * 8) * Math.cos(y * 6) * 0.125;
    }

    createTerrain() {
        // Create terrain geometry with displacement
        const geometry = new THREE.PlaneGeometry(100, 100, 128, 128);
        
        // Custom PBR material with multiple textures
        const material = new THREE.ShaderMaterial({
            uniforms: {
                ...this.uniforms,
                
                // Texture uniforms
                albedoMap: { value: this.textures.albedo },
                normalMap: { value: this.textures.normal },
                noiseMap: { value: this.textures.noise },
                roughnessMap: { value: this.textures.roughness },
                perlinMap: { value: this.textures.perlin },
                snowMap: { value: this.textures.snow },
                
                // Material properties
                uScale: { value: 4.0 },
                uDisplacementScale: { value: 8.0 },
                uSnowLevel: { value: 0.6 },
                uSnowBlend: { value: 0.3 },
                
                // Lighting
                lightDirection: { value: new THREE.Vector3(-1, 1, 1).normalize() },
                lightColor: { value: new THREE.Color(0xffffff) },
                ambientColor: { value: new THREE.Color(0x404040) }
            },
            
            vertexShader: `
                uniform float time;
                uniform sampler2D perlinMap;
                uniform sampler2D noiseMap;
                uniform float uScale;
                uniform float uDisplacementScale;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vElevation;
                varying vec3 vWorldPosition;
                
                void main() {
                    vUv = uv * uScale;
                    
                    // Sample displacement textures
                    float perlinNoise = texture2D(perlinMap, uv * 0.5).r;
                    float detailNoise = texture2D(noiseMap, uv * 2.0).r;
                    
                    // Combine noises for terrain displacement
                    float displacement = perlinNoise * 0.8 + detailNoise * 0.2;
                    displacement = smoothstep(0.2, 1.0, displacement);
                    
                    // Apply displacement
                    vec3 newPosition = position;
                    newPosition.z += displacement * uDisplacementScale;
                    
                    // Add subtle animation
                    newPosition.z += sin(time * 0.5 + position.x * 0.1) * 0.2;
                    
                    vElevation = displacement;
                    vPosition = newPosition;
                    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
                    
                    // Calculate normal (approximation)
                    vNormal = normalize(normalMatrix * normal);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            
            fragmentShader: `
                uniform float time;
                uniform sampler2D albedoMap;
                uniform sampler2D normalMap;
                uniform sampler2D roughnessMap;
                uniform sampler2D snowMap;
                uniform float uSnowLevel;
                uniform float uSnowBlend;
                uniform vec3 lightDirection;
                uniform vec3 lightColor;
                uniform vec3 ambientColor;
                uniform vec3 fogColor;
                uniform float fogNear;
                uniform float fogFar;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vElevation;
                varying vec3 vWorldPosition;
                
                void main() {
                    // Sample textures
                    vec3 albedo = texture2D(albedoMap, vUv).rgb;
                    vec3 normalColor = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
                    float roughness = texture2D(roughnessMap, vUv).r;
                    vec3 snowColor = texture2D(snowMap, vUv).rgb;
                    
                    // Apply normal mapping
                    vec3 normal = normalize(vNormal + normalColor * 0.5);
                    
                    // Snow blending based on elevation and slope
                    float snowFactor = smoothstep(uSnowLevel - uSnowBlend, uSnowLevel + uSnowBlend, vElevation);
                    float slopeFactor = max(0.0, dot(normal, vec3(0, 0, 1)));
                    snowFactor *= slopeFactor;
                    
                    // Mix rock and snow materials
                    vec3 finalAlbedo = mix(albedo, snowColor, snowFactor);
                    float finalRoughness = mix(roughness, 0.1, snowFactor);
                    
                    // Simple PBR lighting
                    float NdotL = max(0.0, dot(normal, lightDirection));
                    vec3 diffuse = finalAlbedo * lightColor * NdotL;
                    vec3 ambient = finalAlbedo * ambientColor;
                    
                    // Atmospheric perspective
                    float distance = length(vWorldPosition - cameraPosition);
                    float fogFactor = smoothstep(fogNear, fogFar, distance);
                    
                    vec3 color = diffuse + ambient;
                    color = mix(color, fogColor, fogFactor);
                    
                    // Add subtle color variation
                    color += sin(time + vPosition.x * 0.1) * 0.02;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.position.y = -5;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);

        // Create additional mountain peaks
        this.createMountainPeaks();
    }

    createMountainPeaks() {
        const peakGeometry = new THREE.ConeGeometry(8, 20, 8);
        
        for (let i = 0; i < 5; i++) {
            const peakMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color().setHSL(0.1, 0.1, 0.3 + Math.random() * 0.3),
                transparent: true,
                opacity: 0.8
            });
            
            const peak = new THREE.Mesh(peakGeometry, peakMaterial);
            peak.position.set(
                (Math.random() - 0.5) * 80,
                5 + Math.random() * 10,
                -30 - Math.random() * 20
            );
            peak.rotation.y = Math.random() * Math.PI;
            peak.castShadow = true;
            this.scene.add(peak);
        }
    }

    createSnowParticles() {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random positions
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = Math.random() * 50 + 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;
            
            // Random velocities (falling snow)
            velocities[i3] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 1] = -Math.random() * 2 - 0.5;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
            
            sizes[i] = Math.random() * 3 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createSnowFlakeTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 velocity;
                uniform float time;
                varying float vOpacity;
                
                void main() {
                    vec3 pos = position;
                    
                    // Animate snow falling
                    pos += velocity * time;
                    
                    // Reset particles that fall too low
                    if (pos.y < -10.0) {
                        pos.y += 60.0;
                    }
                    
                    // Wind effect
                    pos.x += sin(time * 0.5 + pos.z * 0.1) * 2.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Fade particles based on distance
                    vOpacity = 1.0 - smoothstep(20.0, 50.0, length(mvPosition.xyz));
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying float vOpacity;
                
                void main() {
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    gl_FragColor = vec4(1.0, 1.0, 1.0, texColor.a * vOpacity * 0.8);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });

        this.snowParticles = new THREE.Points(geometry, material);
        this.scene.add(this.snowParticles);
    }

    createSnowFlakeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        return new THREE.CanvasTexture(canvas);
    }

    createAtmosphericEffects() {
        // Create volumetric clouds
        this.createVolumetricClouds();
        
        // Create atmospheric particles
        this.createAtmosphericParticles();
    }

    createVolumetricClouds() {
        const cloudGeometry = new THREE.SphereGeometry(15, 16, 16);
        
        for (let i = 0; i < 8; i++) {
            const cloudMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    noiseMap: { value: this.textures.noise },
                    opacity: { value: 0.3 + Math.random() * 0.2 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    uniform float time;
                    
                    void main() {
                        vUv = uv;
                        vPosition = position;
                        
                        vec3 pos = position;
                        pos += sin(time * 0.2 + position.x * 0.1) * 0.5;
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform sampler2D noiseMap;
                    uniform float opacity;
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    
                    void main() {
                        float noise = texture2D(noiseMap, vUv + time * 0.01).r;
                        float alpha = smoothstep(0.3, 0.7, noise) * opacity;
                        
                        gl_FragColor = vec4(0.9, 0.95, 1.0, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.NormalBlending,
                side: THREE.DoubleSide
            });
            
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 80,
                20 + Math.random() * 15,
                -40 - Math.random() * 20
            );
            cloud.scale.setScalar(0.5 + Math.random() * 0.5);
            this.scene.add(cloud);
        }
    }

    createAtmosphericParticles() {
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = Math.random() * 100;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
            
            const intensity = 0.3 + Math.random() * 0.4;
            colors[i3] = intensity;
            colors[i3 + 1] = intensity;
            colors[i3 + 2] = intensity * 1.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });

        const atmosphericParticles = new THREE.Points(geometry, material);
        this.scene.add(atmosphericParticles);
    }

    setupLighting() {
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(-10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.4);
        this.scene.add(ambientLight);

        // Hemisphere light for atmospheric lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x362d1d, 0.3);
        this.scene.add(hemisphereLight);
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        document.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        window.addEventListener('scroll', () => this.onScroll(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = Math.min(scrollTop / maxScroll, 1);
        
        // Subtle camera movement based on scroll
        this.camera.position.y = 15 + scrollProgress * 5;
        this.camera.position.z = 25 + scrollProgress * 10;
        this.camera.lookAt(0, scrollProgress * -5, -10);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016; // ~60fps
        
        // Update all time-based uniforms
        if (this.terrain && this.terrain.material.uniforms) {
            this.terrain.material.uniforms.time.value = this.time;
        }
        
        if (this.snowParticles && this.snowParticles.material.uniforms) {
            this.snowParticles.material.uniforms.time.value = this.time;
        }
        
        // Update cloud materials
        this.scene.traverse((child) => {
            if (child.material && child.material.uniforms && child.material.uniforms.time) {
                child.material.uniforms.time.value = this.time;
            }
        });
        
        // Subtle camera sway
        const baseX = this.mouse.x * 2;
        const baseY = this.mouse.y * 1;
        
        this.camera.position.x += (baseX - this.camera.position.x) * 0.02;
        this.camera.position.y += (15 + baseY - this.camera.position.y) * 0.02;
        
        // Gentle rotation
        this.camera.lookAt(
            Math.sin(this.time * 0.1) * 2,
            Math.cos(this.time * 0.1) * 1,
            -10
        );
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the 3D alpine background when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AlpineMountainBackground();
});

class GlobeBackground {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globe = null;
        this.particles = null;
        this.textures = {};
        this.controls = null;
        this.time = 0;
        this.isLoading = true;
        
        this.init();
        this.loadTextures();
        this.setupLighting();
        this.addEventListeners();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020924);
        this.scene.fog = new THREE.Fog(0x020924, 15, 30);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 20);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById(this.canvasId),
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Orbit controls for interactive globe
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 15;
        this.controls.maxDistance = 30;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
    }

    async loadTextures() {
        const loader = new THREE.TextureLoader();
        
        try {
            this.textures.map = await loader.loadAsync('textures/earth-map.webp');
            this.textures.bump = await loader.loadAsync('textures/earth-bump.webp');
            this.textures.specular = await loader.loadAsync('textures/earth-specular.webp');
            
            this.createGlobe();
            this.createAtmosphere();
            this.createStarfield();
            this.isLoading = false;
        } catch (error) {
            console.error('Error loading globe textures:', error);
            this.createFallbackGlobe();
            this.isLoading = false;
        }
    }

    createGlobe() {
        const geometry = new THREE.SphereGeometry(10, 64, 64);
        
        const material = new THREE.MeshPhongMaterial({
            map: this.textures.map,
            bumpMap: this.textures.bump,
            bumpScale: 0.05,
            specularMap: this.textures.specular,
            specular: new THREE.Color('grey'),
            shininess: 5
        });

        this.globe = new THREE.Mesh(geometry, material);
        this.globe.rotation.y = Math.PI;
        this.scene.add(this.globe);

        // Add wireframe
        const wireframe = new THREE.LineSegments(
            new THREE.WireframeGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.1 })
        );
        wireframe.scale.set(1.001, 1.001, 1.001);
        this.globe.add(wireframe);
    }

    createFallbackGlobe() {
        const geometry = new THREE.SphereGeometry(10, 64, 64);
        
        // Create procedural texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Draw simple earth-like pattern
        ctx.fillStyle = '#1a3b8b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add continents
        ctx.fillStyle = '#3a5f0b';
        ctx.beginPath();
        ctx.arc(300, 200, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(700, 300, 120, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            specular: new THREE.Color('grey'),
            shininess: 5
        });

        this.globe = new THREE.Mesh(geometry, material);
        this.scene.add(this.globe);
    }

    createAtmosphere() {
        const geometry = new THREE.SphereGeometry(10.2, 64, 64);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x00aaff) },
                viewVector: { value: this.camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    vec3 actual_normal = normalize(normalMatrix * normal);
                    intensity = pow(0.7 - dot(actual_normal, normalize(viewVector)), 2.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 0.3);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const atmosphere = new THREE.Mesh(geometry, material);
        this.globe.add(atmosphere);
    }

    createStarfield() {
        const particles = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particles * 3);
        const sizes = new Float32Array(particles);

        for (let i = 0; i < particles; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 2000;
            positions[i3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i3 + 2] = (Math.random() - 0.5) * 2000;
            sizes[i] = Math.random() * 1.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setupLighting() {
        // Main light (sun)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(5, 3, 5);
        this.scene.add(mainLight);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Hemisphere light
        const hemisphereLight = new THREE.HemisphereLight(0x00aaff, 0xff6600, 0.1);
        this.scene.add(hemisphereLight);
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016; // ~60fps
        
        // Auto-rotate globe
        if (this.globe) {
            this.globe.rotation.y += 0.0005;
        }
        
        // Update controls if they exist
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Background Manager to handle switching between backgrounds
class BackgroundManager {
    constructor() {
        this.heroBg = new AlpineMountainBackground('hero-bg');
        this.globeBg = new GlobeBackground('globe-bg');
        this.currentSection = 0;
        this.sections = document.querySelectorAll('section');
        
        this.init();
    }

    init() {
        // Show hero BG initially
        document.getElementById('hero-bg').style.display = 'block';
        document.getElementById('globe-bg').style.display = 'none';
        
        // Set up scroll listener
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    }

    handleScroll() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Determine which section is currently in view
        let newSection = 0;
        for (let i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop - windowHeight * 0.5 && 
                scrollPosition < sectionTop + sectionHeight - windowHeight * 0.5) {
                newSection = i;
                break;
            }
        }
        
        // Only update if section changed
        if (newSection !== this.currentSection) {
            this.currentSection = newSection;
            this.updateBackground();
        }
    }

    updateBackground() {
        if (this.currentSection === 0) {
            // Hero section - show alpine background
            document.getElementById('hero-bg').style.display = 'block';
            document.getElementById('globe-bg').style.display = 'none';
        } else {
            // Other sections - show globe background
            document.getElementById('hero-bg').style.display = 'none';
            document.getElementById('globe-bg').style.display = 'block';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BackgroundManager();
});