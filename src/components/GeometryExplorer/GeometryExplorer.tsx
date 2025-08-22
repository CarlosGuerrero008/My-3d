import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

export default function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const currentMeshRef = useRef<THREE.Mesh | null>(null)
  const animRef = useRef<number | null>(null)

  const [wireframe, setWireframe] = useState<boolean>(() => {
    return localStorage.getItem("wireframe") === "true"
  })
  const [autoRotate, setAutoRotate] = useState<boolean>(() => {
    return localStorage.getItem("autoRotate") !== "false"
  })

  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  // Geometrías disponibles
  const geometries = useMemo(() => ({
    Esfera: {
      label: 'Esfera',
      create: () => new THREE.SphereGeometry(1, 32, 16)
    },
    Plano: {
      label: 'Plano',
      create: () => new THREE.PlaneGeometry(2, 2)
    },
    Cono: {
      label: 'Cono',
      create: () => new THREE.ConeGeometry(1, 2, 16)
    },
    Cilindro: {
      label: 'Cilindro',
      create: () => new THREE.CylinderGeometry(1, 1, 2, 16)
    },
    Toro: {
      label: 'Toro',
      create: () => new THREE.TorusGeometry(1, 0.3, 16, 64)
    },
    Nudo: {
      label: 'Nudo Toroidal',
      create: () => new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
    },
    Círculo: {
      label: 'Círculo',
      create: () => new THREE.CircleGeometry(1, 32)
    },
    Anillo: {
      label: 'Anillo',
      create: () => new THREE.RingGeometry(0.5, 1, 32)
    },
  }), [])

  // Sync React -> Ref + localStorage
  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
    console.log("🎨 Wireframe actualizado:", wireframe)
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
    console.log("🔄 AutoRotate actualizado:", autoRotate)
  }, [autoRotate])

  // Inicialización de escena
  useEffect(() => {
    if (!mountRef.current) return
    console.log("🎬 Inicializando escena...")

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshPhongMaterial({ color: '#44aa88', wireframe: wireframeRef.current })
    const cube = new THREE.Mesh(geometry, material)
    currentMeshRef.current = cube
    scene.add(cube)

    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (autoRotateRef.current && currentMeshRef.current) {
        currentMeshRef.current.rotation.x += 0.01
        currentMeshRef.current.rotation.y += 0.015
      }
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      camera.aspect = rect.width / rect.height
      camera.updateProjectionMatrix()
      renderer.setSize(rect.width, rect.height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      console.log("🧹 Limpiando escena...")
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      scene.clear()
    }
  }, [])

  // Reemplazo dinámico de geometría
  const replaceGeometry = (createGeometry: () => THREE.BufferGeometry) => {
    const mesh = currentMeshRef.current
    if (!mesh) return
    const oldGeometry = mesh.geometry
    const newGeometry = createGeometry()
    mesh.geometry = newGeometry
    oldGeometry.dispose()
    console.log("🔁 Geometría reemplazada")
  }

  // Aplicar wireframe a material
  useEffect(() => {
    const mesh = currentMeshRef.current
    if (!mesh) return
    const mat = mesh.material as THREE.MeshPhongMaterial
    mat.wireframe = wireframe
    mat.needsUpdate = true
    console.log("✅ Wireframe aplicado:", wireframe)
  }, [wireframe])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Canvas Three.js */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Panel lateral de geometrías */}
      <div style={{
        position: 'absolute',
        left: 12,
        top: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 6
      }}>
        {Object.entries(geometries).map(([key, { label, create }]) => (
          <button key={key} onClick={() => replaceGeometry(create)}>
            {label}
          </button>
        ))}
      </div>

      {/* Controles UI */}
      <div style={{
        position: 'absolute',
        right: 12,
        top: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 6
      }}>
        <button onClick={() => setAutoRotate(!autoRotate)}>
          {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
        </button>
        <button onClick={() => setWireframe(!wireframe)}>
          {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
        </button>
      </div>
    </div>
  )
}
