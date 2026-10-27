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
  <link rel="icon" type="image/png" href="/assets/logo.png?v=2">
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
      <img src="/assets/logo.png?v=2" alt="Second Brain Core" class="w-10 h-10 rounded-2xl object-contain drop-shadow-sm border border-slate-200/80 bg-white p-0.5 hover:scale-105 transition transform" />
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
    <aside class="w-64 flex flex-col gap-4 flex-shrink-0 overflow-y-auto">
      <!-- Nav & Search Card -->
      <div class="card-clean rounded-2xl p-3.5 flex flex-col gap-2">
        <button onclick="resetGraphView()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-xs border border-blue-100 transition text-left">
          <i class="fa-solid fa-cube text-sm w-4 text-center"></i>
          <span>Cognitive Universe</span>
        </button>
        <button onclick="filterByType('Project')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs transition text-left">
          <i class="fa-regular fa-folder text-sm w-4 text-center text-slate-400"></i>
          <span>Projects</span>
        </button>

        <!-- Live Instant Search Bar -->
        <div class="relative pt-1">
          <div class="relative flex items-center">
            <i class="fa-solid fa-magnifying-glass absolute left-3 text-slate-400 text-xs pointer-events-none"></i>
            <input 
              type="text" 
              id="searchInput" 
              placeholder="Search nodes or projects..." 
              oninput="handleSearch(this.value)"
              onkeydown="handleSearchKey(event)"
              class="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-400 text-slate-800 placeholder-slate-400 transition"
            />
            <button id="btnClearSearch" onclick="clearSearch()" class="hidden absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <!-- Live Search Results Dropdown -->
          <div id="searchResults" class="hidden mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-1.5 space-y-1 text-xs z-50"></div>
        </div>
      </div>

      <!-- Node Types Card (Placed right below Nav Menu, 100% clearly visible!) -->
      <div class="card-clean rounded-2xl p-4">
        <div class="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <h4 class="text-xs font-bold text-slate-900 flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-slate-400"></i> Node Types
          </h4>
          <button onclick="filterByType('all')" class="text-[10px] text-blue-600 hover:text-blue-800 font-semibold transition">Show All</button>
        </div>
        <div class="space-y-1.5 mt-3 text-xs font-medium text-slate-700" id="nodeTypeList">
          <!-- Populated dynamically with node counts -->
        </div>
      </div>
    </aside>

    <!-- Column 2: Center Main Graph View -->
    <main class="flex-1 card-clean rounded-2xl flex flex-col relative overflow-hidden h-full">
      <!-- Toolbar Header inside the Center Card -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 bg-white/95 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm shadow-xs">
            <i class="fa-solid fa-cube"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 leading-tight">3D Cognitive Universe</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Drag to rotate • Scroll to zoom • Right click to pan</p>
          </div>
        </div>

        <!-- Toolbar Buttons -->
        <div class="flex items-center gap-2.5">
          <button onclick="toggleAutoRotate()" id="btnAutoRotate" class="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs">
            <i class="fa-solid fa-play text-[11px]"></i> Auto-Rotate
          </button>
          <button onclick="resetCamera()" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition shadow-xs">
            <i class="fa-solid fa-rotate-left text-[11px]"></i> Center View
          </button>
          <button onclick="fitView()" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition shadow-xs">
            <i class="fa-solid fa-expand text-[11px]"></i> Fit All
          </button>
          <button onclick="alert('Second Brain Core v0.1.0 (Local)')" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition shadow-xs">
            <i class="fa-solid fa-ellipsis"></i> More
          </button>
        </div>
      </div>

      <!-- 3D WebGL Canvas Mount (flex child with min-height: 0 so it centers accurately) -->
      <div id="graph3d-canvas" class="flex-1 w-full relative z-0" style="min-height: 0; height: 100%;"></div>
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
          <div id="insAvatar" class="w-12 h-12 rounded-full bg-blue-600 shadow-md shadow-blue-200 flex items-center justify-center text-white text-lg font-bold">
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
            <span id="insTypeDot" class="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Workspace
          </span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-slate-500 flex items-center gap-2"><i class="fa-solid fa-network-wired text-slate-400 w-3.5"></i> Connected Nodes</span>
          <span id="insConnections" class="font-bold text-slate-800">4</span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-slate-500 flex items-center gap-2"><i class="fa-regular fa-calendar text-slate-400 w-3.5"></i> Created</span>
          <span id="insCreated" class="font-medium text-slate-700">Oct 27, 2026</span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-slate-500 flex items-center gap-2"><i class="fa-regular fa-clock text-slate-400 w-3.5"></i> Last Updated</span>
          <span id="insUpdated" class="font-medium text-slate-700">Oct 27, 2026</span>
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
      <button onclick="alert('Viewing comprehensive state for ' + document.getElementById('insId').textContent)" class="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold transition flex items-center justify-center gap-2 mt-auto shadow-xs">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> View full details →
      </button>
    </aside>
  </div>

  <script>
    let graph3DInstance = null;
    let isAutoRotating = true;
    let graphData = { nodes: [], links: [] };
    let activeProjectId = '';

    // Solid, Rich, Dark Colors (No washed out transparency!)
    const typeColors = {
      Workspace: '#1d4ed8',   // Solid Deep Cobalt Blue
      Project: '#047857',     // Solid Deep Emerald Green
      Checkpoint: '#0284c7',  // Solid Deep Ocean Cyan
      Decision: '#b45309',    // Solid Deep Amber / Bronze
      Task: '#be123c',        // Solid Deep Crimson Red
      User: '#6d28d9',        // Solid Deep Royal Purple
    };

    const typeIcons = {
      Workspace: 'fa-folder',
      Project: 'fa-folder-open',
      Checkpoint: 'fa-flag',
      Decision: 'fa-code-branch',
      Task: 'fa-exclamation',
      User: 'fa-user',
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
          updateNodeTypesLegend(graphData);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }

    function init3DGraph(data) {
      const container = document.getElementById('graph3d-canvas');
      if (!container) return;

      if (graph3DInstance) {
        graph3DInstance.graphData(data);
        updateNodeTypesLegend(data);
        return;
      }

      // Explicit pixel measurement of container to guarantee dead-center alignment
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;

      graph3DInstance = ForceGraph3D()(container)
        .width(w)
        .height(h)
        .graphData(data)
        .backgroundColor('#ffffff')
        .showNavInfo(false)
        .nodeThreeObject(node => {
          const group = new THREE.Group();
          const nodeColor = node.color || typeColors[node.type] || '#1d4ed8';
          const size = node.type === 'Workspace' ? 14 : node.type === 'Project' ? 13 : node.type === 'Checkpoint' ? 11 : 9;

          // Pure Matte Finish Solid Ball (No ring, no specular lighting glare)
          const geometry = new THREE.SphereGeometry(size, 32, 32);
          const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(nodeColor),
          });
          const sphere = new THREE.Mesh(geometry, material);
          group.add(sphere);

          // 2D Text Label right underneath node
          const labelText = node.name || node.type || node.id;
          const sprite = new SpriteText(labelText);
          sprite.color = '#0f172a';
          sprite.textHeight = 4.4;
          sprite.fontWeight = 'bold';
          sprite.position.y = -size - 6.0;
          group.add(sprite);

          // Count badge right below label
          const connectionCount = data.links.filter(
            l => (l.source.id || l.source) === node.id || (l.target.id || l.target) === node.id
          ).length;
          const badge = new SpriteText(String(connectionCount));
          badge.color = '#475569';
          badge.textHeight = 3.3;
          badge.fontWeight = 'bold';
          badge.position.y = -size - 11.5;
          group.add(badge);

          return group;
        })
        .linkColor(() => '#94a3b8')
        .linkWidth(1.4)
        .linkDirectionalParticles(2)
        .linkDirectionalParticleSpeed(0.0035)
        .linkDirectionalParticleWidth(1.8)
        .linkDirectionalParticleColor(() => '#64748b')
        .onNodeClick(node => {
          focusOnNode(node);
          inspectNode(node);
        });

      // Soft, Even Diffuse Lighting for Pure Matte Finish (No harsh glare spots)
      const scene = graph3DInstance.scene();

      // Soft ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
      scene.add(ambientLight);

      // Subtle diffuse directional light for gentle depth without shiny spots
      const subtleLight = new THREE.DirectionalLight(0xffffff, 0.25);
      subtleLight.position.set(80, 120, 100);
      scene.add(subtleLight);

      // Initial Camera Position centered directly at (0, 0, 0)
      graph3DInstance.cameraPosition({ x: 0, y: 0, z: 240 }, { x: 0, y: 0, z: 0 }, 600);

      // Fit and center view after initial simulation stabilizes
      setTimeout(() => {
        if (graph3DInstance) {
          graph3DInstance.zoomToFit(700, 50);
        }
      }, 500);

      // Select default node (Workspace or Project) in Inspector
      const defaultNode = data.nodes.find(n => n.type === 'Workspace') || data.nodes[0];
      if (defaultNode) {
        inspectNode(defaultNode);
      }

      // Auto-Orbit Loop: Kept locked strictly on center (0, 0, 0)
      let angle = 0;
      setInterval(() => {
        if (isAutoRotating && graph3DInstance) {
          angle += Math.PI / 2400;
          const dist = 240;
          graph3DInstance.cameraPosition(
            {
              x: dist * Math.sin(angle),
              y: 15 * Math.sin(angle * 0.7),
              z: dist * Math.cos(angle)
            },
            { x: 0, y: 0, z: 0 } // Keeps camera locked in center!
          );
        }
      }, 25);

      // ResizeObserver to always keep canvas matched to container size
      const handleResize = () => {
        if (!graph3DInstance || !container) return;
        const curW = container.clientWidth;
        const curH = container.clientHeight;
        if (curW > 0 && curH > 0) {
          graph3DInstance.width(curW);
          graph3DInstance.height(curH);
        }
      };

      if (window.ResizeObserver) {
        new ResizeObserver(handleResize).observe(container);
      }
      window.addEventListener('resize', handleResize);
    }

    function updateNodeTypesLegend(data) {
      const counts = { Workspace: 0, Project: 0, Checkpoint: 0, Decision: 0, Task: 0, User: 0 };
      for (const n of data.nodes) {
        if (counts[n.type] !== undefined) counts[n.type]++;
        else counts[n.type] = (counts[n.type] || 0) + 1;
      }
      const legendEl = document.getElementById('nodeTypeList');
      if (!legendEl) return;

      const types = [
        { type: 'Workspace', color: '#1d4ed8', label: 'Workspace' },
        { type: 'Project', color: '#047857', label: 'Project' },
        { type: 'Checkpoint', color: '#0284c7', label: 'Checkpoint' },
        { type: 'Decision', color: '#b45309', label: 'Decision' },
        { type: 'Task', color: '#be123c', label: 'Blocker / Task' },
        { type: 'User', color: '#6d28d9', label: 'User / Founder' },
      ];

      legendEl.innerHTML = types.map(t => \`
        <div class="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition text-xs" onclick="filterByType('\${t.type}')">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full shadow-xs" style="background-color: \${t.color}"></span>
            <span class="text-slate-700 font-medium">\${t.label}</span>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">\${counts[t.type] || 0}</span>
        </div>
      \`).join('');
    }

    function focusOnNode(node) {
      if (!node || !graph3DInstance) return;
      const distance = 85;
      const hyp = Math.hypot(node.x || 0, node.y || 0, node.z || 0) || 1;
      const distRatio = 1 + distance / hyp;
      graph3DInstance.cameraPosition(
        { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio + 8, z: (node.z || 0) * distRatio },
        node,
        1200
      );
    }

    function inspectNode(node) {
      const panel = document.getElementById('inspectorPanel');
      panel.classList.remove('hidden');

      const color = node.color || typeColors[node.type] || '#1d4ed8';
      const avatar = document.getElementById('insAvatar');
      avatar.style.backgroundColor = color;
      avatar.style.boxShadow = \`0 8px 20px -3px \${color}66\`;

      const iconClass = typeIcons[node.type] || 'fa-circle';
      avatar.innerHTML = \`<i class="fa-solid \${iconClass}"></i>\`;

      document.getElementById('insTitle').textContent = node.name || node.id;
      document.getElementById('insSubtitle').textContent = node.type + ' Node';
      document.getElementById('insId').textContent = node.id;
      document.getElementById('insType').innerHTML = \`<span class="w-2.5 h-2.5 rounded-full" style="background-color: \${color}"></span> \${node.type}\`;

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

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      document.getElementById('insCreated').textContent = dateStr;
      document.getElementById('insUpdated').textContent = dateStr;

      // Description / Notes
      let note = 'Connected entity in the Second Brain knowledge graph.';
      if (node.type === 'Workspace') note = 'Core workspace node. Connects projects, tasks and decisions.';
      else if (node.type === 'Project') note = 'Active project tracked across multiple AI models (Claude, Gemini, GPT).';
      else if (node.type === 'Checkpoint') note = 'Cognitive snapshot saving progress, open tasks, blockers, and stop reason.';
      else if (node.type === 'Decision') note = 'Architectural decision preserved across model context boundaries.';
      else if (node.type === 'Task') note = 'Action item or blocker flagged for continuation.';
      else if (node.type === 'User') note = 'Master User Profile & Founder context.';
      document.getElementById('insNotes').textContent = note;

      // Render Connected Nodes List
      const connectedListEl = document.getElementById('insConnectedList');
      if (connected.length === 0) {
        connectedListEl.innerHTML = '<div class="text-slate-400 italic text-[11px] p-1">No direct connections.</div>';
      } else {
        connectedListEl.innerHTML = connected.map(c => {
          const cColor = c.color || typeColors[c.type] || '#1d4ed8';
          return \`
            <div class="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs border border-transparent hover:border-slate-100 transition" onclick='selectNodeById("\${c.id}")'>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" style="background-color: \${cColor}"></span>
                <span class="font-medium text-slate-800">\${c.name || c.id}</span>
              </div>
              <div class="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                <span>\${c.id.substring(0, 8)}</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
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
        ? 'px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs'
        : 'px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs';
    }

    function resetCamera() {
      if (graph3DInstance) {
        graph3DInstance.cameraPosition({ x: 0, y: 0, z: 240 }, { x: 0, y: 0, z: 0 }, 800);
      }
    }

    function fitView() {
      if (graph3DInstance) {
        graph3DInstance.zoomToFit(800, 50);
      }
    }

    function resetGraphView() {
      clearSearch();
      filterByType('all');
      fitView();
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
      setTimeout(() => fitView(), 200);
    }

    // Instant Search functionality
    function handleSearch(query) {
      const resultsEl = document.getElementById('searchResults');
      const clearBtn = document.getElementById('btnClearSearch');
      const q = query.trim().toLowerCase();

      if (!q) {
        resultsEl.classList.add('hidden');
        clearBtn.classList.add('hidden');
        return;
      }

      clearBtn.classList.remove('hidden');

      const matches = graphData.nodes.filter(n => 
        (n.name && n.name.toLowerCase().includes(q)) ||
        (n.type && n.type.toLowerCase().includes(q)) ||
        (n.id && n.id.toLowerCase().includes(q))
      );

      if (matches.length === 0) {
        resultsEl.innerHTML = '<div class="text-slate-400 italic text-[11px] p-2 text-center">No matching nodes found</div>';
        resultsEl.classList.remove('hidden');
        return;
      }

      resultsEl.innerHTML = matches.slice(0, 8).map(m => {
        const cColor = typeColors[m.type] || '#1d4ed8';
        return \`
          <div class="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50/70 cursor-pointer transition" onclick='onSelectSearchResult("\${m.id}")'>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" style="background-color: \${cColor}"></span>
              <span class="font-semibold text-slate-800 text-xs">\${m.name || m.id}</span>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">\${m.type}</span>
          </div>
        \`;
      }).join('');
      resultsEl.classList.remove('hidden');
    }

    function handleSearchKey(event) {
      if (event.key === 'Enter') {
        const resultsEl = document.getElementById('searchResults');
        const firstMatch = resultsEl.querySelector('[onclick]');
        if (firstMatch) {
          firstMatch.click();
        }
      } else if (event.key === 'Escape') {
        clearSearch();
      }
    }

    function onSelectSearchResult(nodeId) {
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (node) {
        document.getElementById('searchInput').value = node.name || node.id;
        document.getElementById('searchResults').classList.add('hidden');
        focusOnNode(node);
        inspectNode(node);
      }
    }

    function clearSearch() {
      const input = document.getElementById('searchInput');
      input.value = '';
      document.getElementById('searchResults').classList.add('hidden');
      document.getElementById('btnClearSearch').classList.add('hidden');
      fitView();
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
