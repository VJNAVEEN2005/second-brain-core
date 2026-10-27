export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Second Brain Core — 3D Cognitive Universe</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
  <script src="https://unpkg.com/three-spritetext@1.8.2/dist/three-spritetext.min.js"></script>
  <script src="https://unpkg.com/3d-force-graph@1.73.4/dist/3d-force-graph.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #f1f5f9; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow-x: hidden; }
    .card-clean { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); }
    .canvas-container canvas { outline: none; border-radius: 1rem; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#eef2f6]">
  <!-- Top Global Header -->
  <header class="bg-white px-7 py-3 flex items-center justify-between border-b border-slate-200/90 shadow-sm z-30">
    <div class="flex items-center space-x-3.5">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-400 via-indigo-300 to-pink-300 flex items-center justify-center text-white font-bold text-xl shadow-sm">
        🧠
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold tracking-tight text-slate-900">Second Brain Core</h1>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Local Node
          </span>
        </div>
        <p class="text-xs text-slate-500 font-medium">Universal Memory Layer for AI Systems</p>
      </div>
    </div>

    <!-- Header Actions -->
    <div class="flex items-center space-x-3">
      <button onclick="toggleDashboardMode()" id="btnModeToggle" class="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-semibold transition flex items-center gap-2 shadow-xs">
        <i class="fa-solid fa-house"></i> <span id="modeText">Back to 2D Dashboard</span>
      </button>

      <button onclick="copyResumePrompt('Gemini')" class="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition flex items-center gap-2 shadow-xs">
        <i class="fa-solid fa-copy"></i> Copy Gemini Prompt
      </button>

      <button onclick="copyResumePrompt('Claude')" class="px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-semibold transition flex items-center gap-2 shadow-xs">
        <i class="fa-solid fa-copy"></i> Copy Claude Prompt
      </button>

      <button onclick="toggleTheme()" class="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center text-xs transition shadow-xs">
        <i class="fa-regular fa-sun"></i>
      </button>

      <button onclick="refreshData()" class="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center text-xs transition shadow-xs">
        <i class="fa-solid fa-rotate-right"></i>
      </button>
    </div>
  </header>

  <!-- Main 3-Column Layout -->
  <div class="flex-1 flex gap-5 p-5 max-w-[1920px] w-full mx-auto overflow-hidden h-[calc(100vh-65px)]">
    <!-- Column 1: Left Sidebar -->
    <aside class="w-60 flex flex-col gap-4 flex-shrink-0">
      <!-- Nav Menu Card -->
      <div class="card-clean rounded-2xl p-3 flex flex-col gap-1">
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50/90 text-blue-600 font-semibold text-xs border border-blue-100/80 transition text-left">
          <i class="fa-solid fa-cube text-sm w-4 text-center"></i>
          <span>Cognitive Universe</span>
        </button>
        <button onclick="filterByType('all')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs transition text-left">
          <i class="fa-solid fa-layer-group text-sm w-4 text-center text-slate-400"></i>
          <span>Nodes</span>
        </button>
        <button onclick="filterByType('Project')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs transition text-left">
          <i class="fa-regular fa-folder text-sm w-4 text-center text-slate-400"></i>
          <span>Projects</span>
        </button>
        <button onclick="focusSearch()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs transition text-left">
          <i class="fa-solid fa-magnifying-glass text-sm w-4 text-center text-slate-400"></i>
          <span>Search</span>
        </button>
        <button onclick="alert('Settings configured via brain CLI')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs transition text-left">
          <i class="fa-solid fa-gear text-sm w-4 text-center text-slate-400"></i>
          <span>Settings</span>
        </button>
      </div>

      <!-- Node Types Card (Bottom Left) -->
      <div class="card-clean rounded-2xl p-4 mt-auto">
        <h4 class="text-xs font-bold text-slate-900 pb-2.5 border-b border-slate-100 flex items-center gap-2">
          <i class="fa-solid fa-layer-group text-slate-400"></i> Node Types
        </h4>
        <div class="space-y-2.5 mt-3 text-xs font-medium text-slate-700">
          <div class="flex items-center gap-2.5 cursor-pointer hover:text-slate-900" onclick="filterByType('User')">
            <span class="w-3 h-3 rounded-full bg-purple-500 shadow-xs"></span> User
          </div>
          <div class="flex items-center gap-2.5 cursor-pointer hover:text-slate-900" onclick="filterByType('Workspace')">
            <span class="w-3 h-3 rounded-full bg-blue-500 shadow-xs"></span> Workspace
          </div>
          <div class="flex items-center gap-2.5 cursor-pointer hover:text-slate-900" onclick="filterByType('Project')">
            <span class="w-3 h-3 rounded-full bg-emerald-500 shadow-xs"></span> Project
          </div>
          <div class="flex items-center gap-2.5 cursor-pointer hover:text-slate-900" onclick="filterByType('Checkpoint')">
            <span class="w-3 h-3 rounded-full bg-cyan-400 shadow-xs"></span> Checkpoint
          </div>
          <div class="flex items-center gap-2.5 cursor-pointer hover:text-slate-900" onclick="filterByType('Decision')">
            <span class="w-3 h-3 rounded-full bg-amber-400 shadow-xs"></span> Decision
          </div>
          <div class="flex items-center gap-2.5 cursor-pointer hover:text-slate-900" onclick="filterByType('Task')">
            <span class="w-3 h-3 rounded-full bg-rose-500 shadow-xs"></span> Blocker / Task
          </div>
        </div>
      </div>
    </aside>

    <!-- Column 2: Center Main Graph View -->
    <main class="flex-1 card-clean rounded-2xl flex flex-col relative overflow-hidden">
      <!-- Toolbar Header inside the Center Card -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 bg-white/90 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
            <i class="fa-solid fa-cube"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 leading-tight">3D Cognitive Universe</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Drag to rotate • Scroll to zoom • Right click to pan</p>
          </div>
        </div>

        <!-- Toolbar Buttons -->
        <div class="flex items-center gap-2.5">
          <button onclick="toggleAutoRotate()" id="btnAutoRotate" class="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition">
            <i class="fa-solid fa-play text-[11px]"></i> Auto-Rotate
          </button>
          <button onclick="resetCamera()" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition">
            <i class="fa-solid fa-rotate-left text-[11px]"></i> Reset View
          </button>
          <button onclick="fitView()" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition">
            <i class="fa-solid fa-expand text-[11px]"></i> Fit View
          </button>
          <button onclick="alert('Second Brain Core v0.1.0 (Local)')" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition">
            <i class="fa-solid fa-ellipsis"></i> More
          </button>
        </div>
      </div>

      <!-- 3D WebGL Canvas Mount -->
      <div id="graph3d-canvas" class="flex-1 w-full h-full relative z-0"></div>
    </main>

    <!-- Column 3: Right Inspector Panel (Node Details) -->
    <aside id="inspectorPanel" class="w-80 card-clean rounded-2xl p-5 flex flex-col gap-4 flex-shrink-0 overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2 text-xs font-bold text-slate-900">
          <i class="fa-solid fa-file-lines text-blue-600"></i> Node Details
        </div>
        <button onclick="closeInspector()" class="text-slate-400 hover:text-slate-600 text-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Avatar & Title with Edit Button -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div id="insAvatar" class="w-12 h-12 rounded-full bg-blue-500 shadow-md shadow-blue-200 flex items-center justify-center text-white text-lg">
            <i class="fa-regular fa-folder"></i>
          </div>
          <div>
            <h4 id="insTitle" class="text-sm font-bold text-slate-900 leading-tight">Workspace</h4>
            <p id="insSubtitle" class="text-[11px] text-slate-500 font-medium">Workspace Node</p>
          </div>
        </div>
        <button onclick="alert('Node details are managed automatically by Second Brain')" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-semibold flex items-center gap-1 border border-blue-100">
          <i class="fa-solid fa-pen text-[9px]"></i> Edit
        </button>
      </div>

      <!-- Metadata List -->
      <div class="space-y-2 text-xs pt-1 border-t border-slate-100">
        <div class="flex items-center justify-between py-1">
          <span class="text-slate-500 flex items-center gap-2"><i class="fa-solid fa-fingerprint text-slate-400 w-3.5"></i> Node ID</span>
          <span class="flex items-center gap-1.5 font-mono font-medium text-slate-800">
            <span id="insId">WS_001</span>
            <button onclick="copyNodeId()" class="text-slate-400 hover:text-slate-600"><i class="fa-regular fa-copy text-[11px]"></i></button>
          </span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-slate-500 flex items-center gap-2"><i class="fa-solid fa-shapes text-slate-400 w-3.5"></i> Type</span>
          <span id="insType" class="font-medium text-slate-800 flex items-center gap-1.5">
            <span id="insTypeDot" class="w-2 h-2 rounded-full bg-blue-500"></span> Workspace
          </span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-slate-500 flex items-center gap-2"><i class="fa-solid fa-network-wired text-slate-400 w-3.5"></i> Connected Nodes</span>
          <span id="insConnections" class="font-bold text-slate-800">4</span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-slate-500 flex items-center gap-2"><i class="fa-regular fa-calendar text-slate-400 w-3.5"></i> Created</span>
          <span id="insCreated" class="font-medium text-slate-700">Oct 27, 2026 20:15</span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-slate-500 flex items-center gap-2"><i class="fa-regular fa-clock text-slate-400 w-3.5"></i> Last Updated</span>
          <span id="insUpdated" class="font-medium text-slate-700">Oct 27, 2026 20:15</span>
        </div>
      </div>

      <!-- Notes Section -->
      <div class="space-y-1.5 pt-1 border-t border-slate-100">
        <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <i class="fa-regular fa-file-lines text-slate-400"></i> Notes
        </div>
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 leading-relaxed" id="insNotes">
          Core workspace node. Connects projects, tasks and decisions.
        </div>
      </div>

      <!-- Connected Nodes Section -->
      <div class="space-y-2 pt-1 border-t border-slate-100">
        <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <i class="fa-solid fa-network-wired text-slate-400"></i> Connected Nodes
        </div>
        <div id="insConnectedList" class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- View Full Details Action Button -->
      <button onclick="alert('Viewing comprehensive state for ' + document.getElementById('insId').textContent)" class="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold transition flex items-center justify-center gap-2 mt-auto">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> View full details →
      </button>
    </aside>
  </div>

  <script>
    let graph3DInstance = null;
    let isAutoRotating = true;
    let graphData = { nodes: [], links: [] };
    let activeProjectId = '';

    const typeColors = {
      User: '#8b5cf6',
      Workspace: '#3b82f6',
      Project: '#10b981',
      Checkpoint: '#06b6d4',
      Decision: '#f59e0b',
      Task: '#f43f5e',
    };

    const typeIcons = {
      User: 'fa-user',
      Workspace: 'fa-folder',
      Project: 'fa-folder-open',
      Checkpoint: 'fa-flag',
      Decision: 'fa-code-branch',
      Task: 'fa-exclamation',
    };

    async function loadData() {
      try {
        const resumeRes = await fetch('/api/resume');
        if (resumeRes.ok) {
          const resume = await resumeRes.json();
          activeProjectId = resume.projectId;
        }

        const graphRes = await fetch('/api/graph/3d');
        if (graphRes.ok) {
          graphData = await graphRes.json();
          init3DGraph(graphData);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }

    function init3DGraph(data) {
      if (graph3DInstance) {
        graph3DInstance.graphData(data);
        return;
      }

      const container = document.getElementById('graph3d-canvas');

      graph3DInstance = ForceGraph3D()(container)
        .graphData(data)
        .backgroundColor('#ffffff')
        .showNavInfo(false)
        .nodeThreeObject(node => {
          const group = new THREE.Group();
          const nodeColor = node.color || typeColors[node.type] || '#3b82f6';
          const size = node.type === 'Workspace' ? 14 : node.type === 'Project' ? 13 : node.type === 'Checkpoint' ? 10 : 8;

          // Outer Soft Glow Halo
          const haloGeo = new THREE.SphereGeometry(size * 1.35, 24, 24);
          const haloMat = new THREE.MeshBasicMaterial({
            color: nodeColor,
            transparent: true,
            opacity: 0.18,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          group.add(halo);

          // Inner Vibrant Sphere
          const geometry = new THREE.SphereGeometry(size, 32, 32);
          const material = new THREE.MeshLambertMaterial({
            color: nodeColor,
            transparent: true,
            opacity: 0.95,
          });
          const sphere = new THREE.Mesh(geometry, material);
          group.add(sphere);

          // 2D Text Label right underneath node
          const labelText = node.name || node.type || node.id;
          const sprite = new SpriteText(labelText);
          sprite.color = '#0f172a';
          sprite.textHeight = 4.0;
          sprite.fontWeight = 'bold';
          sprite.position.y = -size - 5.5;
          group.add(sprite);

          // Count badge right below label
          const connectionCount = data.links.filter(
            l => (l.source.id || l.source) === node.id || (l.target.id || l.target) === node.id
          ).length;
          const badge = new SpriteText(String(connectionCount));
          badge.color = '#64748b';
          badge.textHeight = 3.2;
          badge.position.y = -size - 10.5;
          group.add(badge);

          return group;
        })
        .linkColor(() => '#cbd5e1')
        .linkWidth(1.2)
        .linkDirectionalParticles(2)
        .linkDirectionalParticleSpeed(0.0035)
        .linkDirectionalParticleWidth(1.5)
        .linkDirectionalParticleColor(() => '#94a3b8')
        .onNodeClick(node => {
          focusOnNode(node);
          inspectNode(node);
        });

      // Lighting & Ambience
      const scene = graph3DInstance.scene();

      // Soft white ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambientLight);

      // Key light
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
      dirLight.position.set(120, 200, 150);
      scene.add(dirLight);

      // Camera Position
      graph3DInstance.cameraPosition({ x: 0, y: 15, z: 230 }, { x: 0, y: 0, z: 0 }, 1000);

      // Select first node (e.g. Workspace or Project) by default
      const defaultNode = data.nodes.find(n => n.type === 'Workspace') || data.nodes[0];
      if (defaultNode) {
        inspectNode(defaultNode);
      }

      // Auto-Orbit Loop
      let angle = 0;
      setInterval(() => {
        if (isAutoRotating && graph3DInstance) {
          angle += Math.PI / 1800;
          graph3DInstance.cameraPosition({
            x: 230 * Math.sin(angle),
            z: 230 * Math.cos(angle)
          });
        }
      }, 25);
    }

    function focusOnNode(node) {
      const distance = 80;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      graph3DInstance.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio + 5, z: node.z * distRatio },
        node,
        1400
      );
    }

    function inspectNode(node) {
      const panel = document.getElementById('inspectorPanel');
      panel.classList.remove('hidden');

      const color = node.color || typeColors[node.type] || '#3b82f6';
      const avatar = document.getElementById('insAvatar');
      avatar.style.backgroundColor = color;
      avatar.style.boxShadow = \`0 8px 20px -3px \${color}55\`;

      const iconClass = typeIcons[node.type] || 'fa-circle';
      avatar.innerHTML = \`<i class="fa-solid \${iconClass}"></i>\`;

      document.getElementById('insTitle').textContent = node.name || node.id;
      document.getElementById('insSubtitle').textContent = node.type + ' Node';
      document.getElementById('insId').textContent = node.id;
      document.getElementById('insType').innerHTML = \`<span class="w-2 h-2 rounded-full" style="background-color: \${color}"></span> \${node.type}\`;

      // Find Connected Nodes
      const connected = [];
      for (const l of graphData.links) {
        const srcId = l.source.id || l.source;
        const tgtId = l.target.id || l.target;
        if (srcId === node.id) {
          const tgt = graphData.nodes.find(n => n.id === tgtId);
          if (tgt) connected.push(tgt);
        } else if (tgtId === node.id) {
          const src = graphData.nodes.find(n => n.id === srcId);
          if (src) connected.push(src);
        }
      }

      document.getElementById('insConnections').textContent = connected.length;

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      document.getElementById('insCreated').textContent = dateStr;
      document.getElementById('insUpdated').textContent = dateStr;

      // Description / Notes
      let note = 'Connected entity in the Second Brain knowledge graph.';
      if (node.type === 'Workspace') note = 'Core workspace node. Connects projects, tasks and decisions.';
      else if (node.type === 'Project') note = 'Active project tracked across multiple AI models (Claude, Gemini, GPT).';
      else if (node.type === 'Checkpoint') note = 'Cognitive snapshot saving progress, open tasks, blockers, and stop reason.';
      else if (node.type === 'Decision') note = 'Architectural decision preserved across model context boundaries.';
      else if (node.type === 'Task') note = 'Action item or blocker flagged for continuation.';
      document.getElementById('insNotes').textContent = note;

      // Render Connected Nodes List
      const connectedListEl = document.getElementById('insConnectedList');
      if (connected.length === 0) {
        connectedListEl.innerHTML = '<div class="text-slate-400 italic text-[11px]">No direct connections.</div>';
      } else {
        connectedListEl.innerHTML = connected.map(c => {
          const cColor = c.color || typeColors[c.type] || '#3b82f6';
          return \`
            <div class="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs" onclick='selectNodeById("\${c.id}")'>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" style="background-color: \${cColor}"></span>
                <span class="font-medium text-slate-800">\${c.name || c.id}</span>
              </div>
              <div class="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <span>\${c.id.substring(0, 8)}</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
              </div>
            </div>
          \`;
        }).join('');
      }
    }

    function selectNodeById(id) {
      const node = graphData.nodes.find(n => n.id === id);
      if (node) {
        focusOnNode(node);
        inspectNode(node);
      }
    }

    function closeInspector() {
      document.getElementById('inspectorPanel').classList.add('hidden');
    }

    function toggleAutoRotate() {
      isAutoRotating = !isAutoRotating;
      const btn = document.getElementById('btnAutoRotate');
      btn.className = isAutoRotating
        ? 'px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition'
        : 'px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition';
    }

    function resetCamera() {
      if (graph3DInstance) {
        graph3DInstance.cameraPosition({ x: 0, y: 15, z: 230 }, { x: 0, y: 0, z: 0 }, 1000);
      }
    }

    function fitView() {
      if (graph3DInstance) {
        graph3DInstance.zoomToFit(1000, 40);
      }
    }

    function copyNodeId() {
      const id = document.getElementById('insId').textContent;
      navigator.clipboard.writeText(id);
      alert('Node ID copied: ' + id);
    }

    function filterByType(type) {
      if (!graph3DInstance) return;
      if (type === 'all') {
        graph3DInstance.graphData(graphData);
      } else {
        const filteredNodes = graphData.nodes.filter(n => n.type === type);
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = graphData.links.filter(
          l => nodeIds.has(l.source.id || l.source) || nodeIds.has(l.target.id || l.target)
        );
        graph3DInstance.graphData({ nodes: filteredNodes, links: filteredLinks });
      }
    }

    function focusSearch() {
      const term = prompt('Enter node name or ID to search:');
      if (term) {
        const found = graphData.nodes.find(n => 
          (n.name && n.name.toLowerCase().includes(term.toLowerCase())) ||
          n.id.toLowerCase().includes(term.toLowerCase())
        );
        if (found) {
          focusOnNode(found);
          inspectNode(found);
        } else {
          alert('No node found matching "' + term + '"');
        }
      }
    }

    async function copyResumePrompt(model) {
      try {
        const res = await fetch('/api/continuation/' + model, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: activeProjectId })
        });
        const data = await res.json();
        await navigator.clipboard.writeText(data.prompt);
        alert('✅ ' + model + ' continuation prompt copied to clipboard!');
      } catch (err) {
        alert('Failed to copy prompt: ' + err.message);
      }
    }

    function toggleDashboardMode() {
      window.location.href = '/';
    }

    function toggleTheme() {
      alert('Second Brain Core is optimized in Ultra-Clean Studio Light Mode.');
    }

    function refreshData() {
      loadData();
    }

    window.onload = loadData;
  </script>
</body>
</html>`;
}
