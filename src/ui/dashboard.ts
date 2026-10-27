export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Second Brain Core — 3D Cognitive Universe</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/3d-force-graph"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '#6366f1',
            accent: '#10b981',
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #080c14; color: #f3f4f6; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
    .glass { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .badge-limit { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-completed { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-user { background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
    #graph3d-canvas canvas { outline: none; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <!-- Top Navigation -->
  <header class="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-gray-800/80">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
        🧠
      </div>
      <div>
        <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          Second Brain Core
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Local Node</span>
        </h1>
        <p class="text-xs text-gray-400">Universal Memory Layer for AI Systems</p>
      </div>
    </div>
    <div class="flex items-center space-x-3">
      <button onclick="toggle3DView()" id="btnToggle3D" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white transition flex items-center gap-2 shadow-md shadow-cyan-500/30">
        <i class="fa-solid fa-cube"></i> <span id="toggleText">View in 3D Universe</span>
      </button>
      <button onclick="copyResumePrompt('Gemini')" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30">
        <i class="fa-solid fa-copy"></i> Copy Gemini Prompt
      </button>
      <button onclick="copyResumePrompt('Claude')" class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md shadow-purple-600/30">
        <i class="fa-solid fa-copy"></i> Copy Claude Prompt
      </button>
      <button onclick="loadAllData()" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition">
        <i class="fa-solid fa-rotate-right"></i>
      </button>
    </div>
  </header>

  <!-- Fullscreen 3D Cosmos Modal View (hidden by default) -->
  <div id="modal3D" class="hidden fixed inset-0 z-40 bg-black/90 flex flex-col pt-16">
    <!-- 3D Header Overlay -->
    <div class="absolute top-20 left-6 z-50 glass px-5 py-3 rounded-xl border border-gray-700/60 pointer-events-auto">
      <h3 class="text-sm font-bold text-white flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
        3D Cognitive Universe
      </h3>
      <p class="text-xs text-gray-400 mt-0.5">Drag left click to rotate • Scroll to zoom • Right click to pan</p>
      <div class="flex items-center gap-2 mt-3">
        <button onclick="toggleOrbit()" id="btnOrbit" class="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-[11px] font-medium text-gray-300 border border-gray-700">
          <i class="fa-solid fa-arrows-rotate"></i> Auto-Rotate: ON
        </button>
        <button onclick="resetCamera()" class="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-[11px] font-medium text-gray-300 border border-gray-700">
          <i class="fa-solid fa-crosshairs"></i> Reset View
        </button>
      </div>
    </div>

    <!-- Node Color Legend Overlay -->
    <div class="absolute bottom-6 left-6 z-50 glass px-4 py-3 rounded-xl border border-gray-800/80 pointer-events-auto text-xs space-y-1.5">
      <div class="font-bold text-gray-300 pb-1 border-b border-gray-800">Node Types:</div>
      <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span> User</div>
      <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Workspace</div>
      <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Project</div>
      <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Checkpoint</div>
      <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Decision</div>
      <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Blocker / Task</div>
    </div>

    <!-- 3D Canvas Mount Point -->
    <div id="graph3d-canvas" class="w-full flex-1 relative"></div>
  </div>

  <!-- Standard Dashboard Content -->
  <main id="mainDashboard" class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
    <!-- Active State Hero Card -->
    <div id="activeProjectHero" class="glass rounded-2xl p-6 relative overflow-hidden">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-400">Active Cognitive State</span>
            <span id="heroStopReason" class="text-xs px-2.5 py-0.5 rounded-full badge-user font-medium">Checking...</span>
          </div>
          <h2 id="heroProjectName" class="text-3xl font-extrabold text-white mt-1">Loading Brain...</h2>
          <p id="heroSummary" class="text-sm text-gray-400 mt-1 max-w-2xl">Retrieving latest cognitive state from disk...</p>
        </div>
        <div class="flex flex-col items-end">
          <div class="text-3xl font-black text-emerald-400" id="heroProgress">0%</div>
          <div class="w-48 bg-gray-800 rounded-full h-2.5 mt-2 overflow-hidden border border-gray-700">
            <div id="heroProgressBar" class="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2.5 rounded-full" style="width: 0%"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800/80">
        <div class="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-bolt text-yellow-400"></i> Active Current Task
          </div>
          <p id="heroCurrentTask" class="text-sm font-medium text-white mt-1">None</p>
        </div>
        <div class="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-arrow-right text-emerald-400"></i> Next Immediate Task
          </div>
          <p id="heroNextTask" class="text-sm font-medium text-white mt-1">None</p>
        </div>
      </div>
    </div>

    <!-- 2 Column Layout: Checkpoint Timeline & Decisions/Blockers -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Checkpoint Timeline (Left 2 cols) -->
      <div class="lg:col-span-2 glass rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-indigo-400"></i> Checkpoint History
          </h3>
          <span class="text-xs text-gray-400" id="checkpointCount">0 snapshots</span>
        </div>
        <div id="checkpointsTimeline" class="space-y-3 max-h-[480px] overflow-y-auto pr-2"></div>
      </div>

      <!-- Decisions & Blockers (Right 1 col) -->
      <div class="space-y-6">
        <!-- Key Decisions -->
        <div class="glass rounded-2xl p-6 space-y-4">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-landmark text-amber-400"></i> Key Decisions
          </h3>
          <ul id="decisionsList" class="space-y-2 text-sm text-gray-300 max-h-48 overflow-y-auto">
            <li class="text-gray-500 italic">No decisions recorded yet.</li>
          </ul>
        </div>

        <!-- Active Blockers -->
        <div class="glass rounded-2xl p-6 space-y-4">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-rose-400"></i> Blockers & Issues
          </h3>
          <ul id="blockersList" class="space-y-2 text-sm text-gray-300 max-h-48 overflow-y-auto">
            <li class="text-gray-500 italic">No active blockers. All clear!</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 3D Preview Quick Banner -->
    <div class="glass rounded-2xl p-6 flex items-center justify-between border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-blue-950/20">
      <div>
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-cube text-cyan-400"></i> Explore your Cognitive Map in Full 3D Space
        </h3>
        <p class="text-xs text-gray-400 mt-1">Visualize how all your projects, checkpoints, tools, and decisions connect in a WebGL 3D cosmos.</p>
      </div>
      <button onclick="toggle3DView()" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-gray-950 transition shadow-lg shadow-cyan-500/20">
        Launch 3D Universe
      </button>
    </div>
  </main>

  <footer class="glass border-t border-gray-800 py-4 px-6 text-center text-xs text-gray-500 mt-auto">
    Second Brain Core • Running locally on your machine • Zero Cloud Dependency
  </footer>

  <script>
    let activeProjectId = '';
    let graph3DInstance = null;
    let is3DActive = false;
    let isAutoRotating = true;

    async function loadAllData() {
      try {
        const resumeRes = await fetch('/api/resume');
        if (!resumeRes.ok) throw new Error('No active project');
        const resume = await resumeRes.json();
        activeProjectId = resume.projectId;

        // Render Hero
        document.getElementById('heroProjectName').textContent = resume.project;
        document.getElementById('heroSummary').textContent = resume.summary;
        document.getElementById('heroProgress').textContent = resume.completion + '%';
        document.getElementById('heroProgressBar').style.width = resume.completion + '%';
        document.getElementById('heroCurrentTask').textContent = resume.currentTask || 'None';
        document.getElementById('heroNextTask').textContent = resume.nextTask || 'None';
        
        const stopReasonBadge = document.getElementById('heroStopReason');
        stopReasonBadge.textContent = resume.stopReason;
        if (resume.stopReason === 'LIMIT_REACHED') {
          stopReasonBadge.className = 'text-xs px-2.5 py-0.5 rounded-full badge-limit font-medium';
        } else if (resume.stopReason === 'COMPLETED') {
          stopReasonBadge.className = 'text-xs px-2.5 py-0.5 rounded-full badge-completed font-medium';
        } else {
          stopReasonBadge.className = 'text-xs px-2.5 py-0.5 rounded-full badge-user font-medium';
        }

        // Render Decisions
        const decList = document.getElementById('decisionsList');
        if (resume.decisions && resume.decisions.length > 0) {
          decList.innerHTML = resume.decisions.map(d => 
            \`<li class="flex items-start gap-2 bg-gray-900/50 p-2.5 rounded-lg border border-gray-800/80">
              <span class="text-indigo-400 font-bold">•</span>
              <span>\${d}</span>
            </li>\`
          ).join('');
        } else {
          decList.innerHTML = '<li class="text-gray-500 italic">No decisions recorded yet.</li>';
        }

        // Render Blockers
        const blkList = document.getElementById('blockersList');
        if (resume.blockers && resume.blockers.length > 0) {
          blkList.innerHTML = resume.blockers.map(b => 
            \`<li class="flex items-start gap-2 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 text-rose-300">
              <span class="text-rose-400 font-bold">⛔</span>
              <span>\${b}</span>
            </li>\`
          ).join('');
        } else {
          blkList.innerHTML = '<li class="text-emerald-400 italic">No blockers! Progressing smoothly.</li>';
        }

        // Fetch checkpoints timeline
        const chkRes = await fetch('/api/checkpoints/' + activeProjectId);
        if (chkRes.ok) {
          const checkpoints = await chkRes.json();
          document.getElementById('checkpointCount').textContent = checkpoints.length + ' snapshots';
          const timelineEl = document.getElementById('checkpointsTimeline');
          timelineEl.innerHTML = checkpoints.map(c => \`
            <div class="bg-gray-900/60 hover:bg-gray-900 transition p-4 rounded-xl border border-gray-800 space-y-2">
              <div class="flex items-center justify-between text-xs text-gray-400">
                <span class="font-mono text-indigo-400">\${c.checkpointId}</span>
                <span>\${new Date(c.createdAt).toLocaleTimeString()} · \${new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p class="text-sm font-semibold text-white">\${c.summary}</p>
              <div class="flex items-center gap-2 pt-1">
                <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">Progress: \${c.progress}%</span>
                <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">\${c.stopReason}</span>
              </div>
            </div>
          \`).join('');
        }

      } catch (err) {
        document.getElementById('heroProjectName').textContent = 'No Active Project';
        document.getElementById('heroSummary').textContent = 'Create a project using the CLI or MCP server to get started.';
      }
    }

    // ==========================================
    // 3D FORCE GRAPH INITIALIZATION
    // ==========================================
    async function init3DGraph() {
      if (graph3DInstance) return;

      const res = await fetch('/api/graph/3d');
      const data = await res.json();

      const container = document.getElementById('graph3d-canvas');
      graph3DInstance = ForceGraph3D()(container)
        .graphData(data)
        .nodeLabel(node => \`<b>[\${node.type}]</b> \${node.name}\`)
        .nodeVal('val')
        .nodeColor('color')
        .nodeResolution(16)
        .linkColor('color')
        .linkWidth(1.2)
        .linkDirectionalParticles(2)
        .linkDirectionalParticleSpeed(0.005)
        .linkDirectionalParticleWidth(1.5)
        .linkDirectionalArrowLength(3.5)
        .linkDirectionalArrowRelPos(1)
        .backgroundColor('#050811')
        .onNodeClick(node => {
          // Smooth camera focus on clicked node
          const distance = 80;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          graph3DInstance.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node,
            1500
          );
        });

      // Camera auto-orbit
      let angle = 0;
      setInterval(() => {
        if (isAutoRotating && graph3DInstance) {
          angle += Math.PI / 1200;
          graph3DInstance.cameraPosition({
            x: 250 * Math.sin(angle),
            z: 250 * Math.cos(angle)
          });
        }
      }, 25);
    }

    function toggle3DView() {
      const modal = document.getElementById('modal3D');
      const main = document.getElementById('mainDashboard');
      const toggleBtn = document.getElementById('toggleText');

      is3DActive = !is3DActive;
      if (is3DActive) {
        modal.classList.remove('hidden');
        main.classList.add('hidden');
        toggleBtn.textContent = 'Back to 2D Dashboard';
        init3DGraph();
      } else {
        modal.classList.add('hidden');
        main.classList.remove('hidden');
        toggleBtn.textContent = 'View in 3D Universe';
      }
    }

    function toggleOrbit() {
      isAutoRotating = !isAutoRotating;
      document.getElementById('btnOrbit').innerHTML = isAutoRotating
        ? '<i class="fa-solid fa-arrows-rotate"></i> Auto-Rotate: ON'
        : '<i class="fa-solid fa-pause"></i> Auto-Rotate: OFF';
    }

    function resetCamera() {
      if (graph3DInstance) {
        graph3DInstance.cameraPosition({ x: 0, y: 0, z: 280 }, { x: 0, y: 0, z: 0 }, 1000);
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

    // Auto open 3D if URL has ?3d=true
    window.onload = async () => {
      await loadAllData();
      if (window.location.search.includes('3d=true')) {
        toggle3DView();
      }
    };
  </script>
</body>
</html>`;
}
