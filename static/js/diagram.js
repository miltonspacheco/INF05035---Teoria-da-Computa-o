class StateDiagram {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.nodes = [];
        this.edges = [];
        this.currentState = null;
        this.prevState = null;

        this.R = 26;
        this.FONT = '12px Inter, sans-serif';
        this.LABEL_FONT = '9px Fira Code, monospace';

        this.TAPE1 = '#22d3ee';
        this.TAPE2 = '#fb923c';
        this.ACTIVE = '#eab308';
        this.ACCEPT = '#10b981';
        this.REJECT = '#ef4444';
        this.NODE_FILL = '#1e293b';
        this.NODE_STROKE = '#475569';
        this.TEXT = '#f8fafc';
        this.EDGE = '#4b5563';
        this.MUTED = '#94a3b8';
        this.BG = '#0b1120';

        this._resizeHandler = () => { this.setupCanvas(); this.render(); };
        window.addEventListener('resize', this._resizeHandler);
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const parent = this.canvas.parentElement;
        const w = parent.clientWidth || 1350;
        const h = 550;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.W = w;
        this.H = h;
    }

    build(transicoes, config) {
        this.setupCanvas();
        this.currentState = null;
        this.prevState = null;

        const stateSet = new Set();
        stateSet.add(config.estado_inicial);
        stateSet.add(config.estado_aceitacao);
        stateSet.add(config.estado_rejeicao);
        transicoes.forEach(t => { stateSet.add(t.estado_origem); stateSet.add(t.estado_destino); });

        const ids = Array.from(stateSet).sort((a, b) => {
            const ord = s => {
                if (s === config.estado_inicial) return -1000;
                if (s === config.estado_aceitacao) return 9998;
                if (s === config.estado_rejeicao) return 9999;
                const n = parseInt(s.replace(/\D/g, ''));
                return isNaN(n) ? 500 : n;
            };
            return ord(a) - ord(b);
        });

        this.nodes = ids.map(id => ({
            id, x: 0, y: 0, vx: 0, vy: 0,
            isInitial: id === config.estado_inicial,
            isAccept: id === config.estado_aceitacao,
            isReject: id === config.estado_rejeicao
        }));

        const edgeMap = new Map();
        transicoes.forEach(t => {
            const key = t.estado_origem + '\x00' + t.estado_destino;
            if (!edgeMap.has(key)) edgeMap.set(key, { from: t.estado_origem, to: t.estado_destino, transitions: [] });
            edgeMap.get(key).transitions.push({ read: t.simbolos_lidos, write: t.simbolos_escritos, move: t.direcoes });
        });
        this.edges = Array.from(edgeMap.values());
        this.edges.forEach(e => {
            e.isSelf = e.from === e.to;
            e.hasReverse = !e.isSelf && this.edges.some(o => o.from === e.to && o.to === e.from);
        });

        this.layout();
        this.render();
    }

    layout() {
        const W = this.W, H = this.H, R = this.R, PAD = R + 50;

        
        const layers = new Map();
        const visited = new Set();
        const queue = [];
        const init = this.nodes.find(n => n.isInitial);
        if (init) { layers.set(init.id, 0); visited.add(init.id); queue.push(init.id); }
        while (queue.length) {
            const cur = queue.shift();
            const cl = layers.get(cur);
            this.edges.forEach(e => {
                if (e.from === cur && !visited.has(e.to) && !e.isSelf) {
                    visited.add(e.to); layers.set(e.to, cl + 1); queue.push(e.to);
                }
            });
        }
       
        let maxL = 0; layers.forEach(v => { if (v > maxL) maxL = v; });
        this.nodes.forEach(n => { if (!layers.has(n.id)) layers.set(n.id, ++maxL); });

        
        const groups = new Map();
        layers.forEach((l, id) => { if (!groups.has(l)) groups.set(l, []); groups.get(l).push(id); });
        const totalLayers = Math.max(...layers.values(), 0);

        groups.forEach((ids, layer) => {
            const x = PAD + (W - 2 * PAD) * (totalLayers > 0 ? layer / totalLayers : 0.5);
            ids.forEach((id, idx) => {
                const n = this.nodes.find(nd => nd.id === id);
                const count = ids.length;
                n.x = x;
                n.y = H / 2 + (idx - (count - 1) / 2) * 80;
            });
        });

        
        for (let iter = 0; iter < 150; iter++) {
            const cool = 1 - iter / 150;
            this.nodes.forEach(n => { n.fx = 0; n.fy = 0; });

            // Repulsion
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const a = this.nodes[i], b = this.nodes[j];
                    let dx = b.x - a.x, dy = b.y - a.y;
                    let d = Math.sqrt(dx * dx + dy * dy) || 1;
                    let f = 6000 / (d * d);
                    a.fx -= dx / d * f; a.fy -= dy / d * f;
                    b.fx += dx / d * f; b.fy += dy / d * f;
                }
            }
            
            this.edges.forEach(e => {
                if (e.isSelf) return;
                const a = this.nodes.find(n => n.id === e.from);
                const b = this.nodes.find(n => n.id === e.to);
                if (!a || !b) return;
                let dx = b.x - a.x, dy = b.y - a.y;
                let d = Math.sqrt(dx * dx + dy * dy) || 1;
                let f = 0.04 * (d - 120);
                a.fx += dx / d * f; a.fy += dy / d * f;
                b.fx -= dx / d * f; b.fy -= dy / d * f;
            });
            
            this.nodes.forEach(n => { n.fx += (W / 2 - n.x) * 0.003; n.fy += (H / 2 - n.y) * 0.008; });
            
            if (init) init.fx += (PAD + 10 - init.x) * 0.04;
            const acc = this.nodes.find(n => n.isAccept);
            if (acc) acc.fx += (W - PAD - 10 - acc.x) * 0.04;

            this.nodes.forEach(n => {
                n.vx = (n.vx + n.fx) * 0.5 * cool;
                n.vy = (n.vy + n.fy) * 0.5 * cool;
                n.x = Math.max(PAD, Math.min(W - PAD, n.x + n.vx));
                n.y = Math.max(PAD, Math.min(H - PAD, n.y + n.vy));
            });
        }
    }

    highlight(cur, prev) {
        this.currentState = cur;
        this.prevState = prev;
        this.render();
    }

    render() {
        if (!this.ctx || this.nodes.length === 0) return;
        const ctx = this.ctx;
        ctx.fillStyle = this.BG;
        ctx.fillRect(0, 0, this.W, this.H);

        
        this.edges.forEach(e => this.drawEdge(e));
       
        this.nodes.forEach(n => this.drawNode(n));
        
        const init = this.nodes.find(n => n.isInitial);
        if (init) this.drawInitialArrow(init);
       
        this.drawLegend();
    }

    drawNode(node) {
        const ctx = this.ctx, R = this.R;
        const active = node.id === this.currentState;

        
        if (active) {
            ctx.save();
            ctx.shadowColor = this.ACTIVE;
            ctx.shadowBlur = 25;
            ctx.beginPath(); ctx.arc(node.x, node.y, R, 0, Math.PI * 2);
            ctx.fillStyle = this.NODE_FILL; ctx.fill();
            ctx.restore();
        }

        
        const g = ctx.createRadialGradient(node.x - 4, node.y - 4, 2, node.x, node.y, R);
        g.addColorStop(0, '#2d3a50'); g.addColorStop(1, this.NODE_FILL);
        ctx.beginPath(); ctx.arc(node.x, node.y, R, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();

       
        ctx.lineWidth = active ? 3 : 2;
        ctx.strokeStyle = active ? this.ACTIVE : node.isAccept ? this.ACCEPT : node.isReject ? this.REJECT : this.NODE_STROKE;
        ctx.stroke();

        
        if (node.isAccept || node.isReject) {
            ctx.beginPath(); ctx.arc(node.x, node.y, R - 5, 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = node.isAccept ? this.ACCEPT : this.REJECT;
            ctx.stroke();
        }

        
        ctx.fillStyle = active ? this.ACTIVE : this.TEXT;
        ctx.font = active ? 'bold 12px Inter, sans-serif' : this.FONT;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y);
    }

    drawInitialArrow(node) {
        const ctx = this.ctx, R = this.R, len = 35;
        const x1 = node.x - R - len, y = node.y, x2 = node.x - R;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y);
        ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.stroke();
        this._arrowhead(x2, y, 0, '#60a5fa');
    }

    drawEdge(edge) {
        const from = this.nodes.find(n => n.id === edge.from);
        const to = this.nodes.find(n => n.id === edge.to);
        if (!from || !to) return;
        const isActive = this.prevState === edge.from && this.currentState === edge.to;

        if (edge.isSelf) { this._drawSelfLoop(from, edge, isActive); return; }

        const dx = to.x - from.x, dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const R = this.R;

       
        const px = -dy / dist, py = dx / dist;
        const off = edge.hasReverse ? 22 : 0;
        const mx = (from.x + to.x) / 2 + px * off;
        const my = (from.y + to.y) / 2 + py * off;

       
        const sa = Math.atan2(my - from.y, mx - from.x);
        const ea = Math.atan2(my - to.y, mx - to.x);
        const sx = from.x + R * Math.cos(sa), sy = from.y + R * Math.sin(sa);
        const ex = to.x + R * Math.cos(ea), ey = to.y + R * Math.sin(ea);

        const ctx = this.ctx;
        ctx.beginPath(); ctx.moveTo(sx, sy);
        if (off !== 0) {
            ctx.quadraticCurveTo(mx, my, ex, ey);
        } else {
           
            const sa2 = Math.atan2(to.y - from.y, to.x - from.x);
            const sx2 = from.x + R * Math.cos(sa2), sy2 = from.y + R * Math.sin(sa2);
            const ea2 = Math.atan2(from.y - to.y, from.x - to.x);
            const ex2 = to.x + R * Math.cos(ea2), ey2 = to.y + R * Math.sin(ea2);
            ctx.moveTo(sx2, sy2); ctx.lineTo(ex2, ey2);
            
            const ang = Math.atan2(ey2 - sy2, ex2 - sx2);
            ctx.strokeStyle = isActive ? this.ACTIVE : this.EDGE;
            ctx.lineWidth = isActive ? 2.5 : 1.5;
            if (isActive) { ctx.save(); ctx.shadowColor = this.ACTIVE; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore(); }
            else ctx.stroke();
            this._arrowhead(ex2, ey2, ang, isActive ? this.ACTIVE : this.EDGE);
            this._drawLabels(edge, (sx2 + ex2) / 2 + px * 12, (sy2 + ey2) / 2 + py * 12, isActive);
            return;
        }

        ctx.strokeStyle = isActive ? this.ACTIVE : this.EDGE;
        ctx.lineWidth = isActive ? 2.5 : 1.5;
        if (isActive) { ctx.save(); ctx.shadowColor = this.ACTIVE; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore(); }
        else ctx.stroke();

        const arrowAng = Math.atan2(ey - my, ex - mx);
        this._arrowhead(ex, ey, arrowAng, isActive ? this.ACTIVE : this.EDGE);
        this._drawLabels(edge, mx, my, isActive);
    }

    _drawSelfLoop(node, edge, isActive) {
        const ctx = this.ctx, R = this.R;
        // Cubic bezier loop above the node
        const sx = node.x - 12, sy = node.y - R;
        const cp1x = node.x - 38, cp1y = node.y - R - 55;
        const cp2x = node.x + 38, cp2y = node.y - R - 55;
        const ex = node.x + 12, ey = node.y - R;

        ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
        ctx.strokeStyle = isActive ? this.ACTIVE : this.EDGE;
        ctx.lineWidth = isActive ? 2.5 : 1.5;
        if (isActive) { ctx.save(); ctx.shadowColor = this.ACTIVE; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore(); }
        else ctx.stroke();

        
        const ang = Math.atan2(ey - cp2y, ex - cp2x);
        this._arrowhead(ex, ey, ang, isActive ? this.ACTIVE : this.EDGE);

     
        this._drawLabels(edge, node.x, node.y - R - 60, isActive);
    }

    _arrowhead(x, y, angle, color) {
        const ctx = this.ctx, s = 8;
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s, -s / 2.5); ctx.lineTo(-s, s / 2.5); ctx.closePath();
        ctx.fillStyle = color; ctx.fill();
        ctx.restore();
    }

    _drawLabels(edge, x, y, isActive) {
        const ctx = this.ctx;
        ctx.font = this.LABEL_FONT;
        const lh = 12;
        const maxShow = 3;
        const show = edge.transitions.slice(0, maxShow);
        const extra = edge.transitions.length - maxShow;
        const totalLines = show.length + (extra > 0 ? 1 : 0);
        const startY = y - (totalLines - 1) * lh / 2;

        
        let maxW = 0;
        show.forEach(t => {
            const txt = `(${t.read[0]},${t.read[1]})/(${t.write[0]},${t.write[1]});(${t.move[0]},${t.move[1]})`;
            maxW = Math.max(maxW, ctx.measureText(txt).width);
        });
        if (extra > 0) maxW = Math.max(maxW, ctx.measureText(`+${extra} mais...`).width);

        
        const pad = 3;
        ctx.fillStyle = isActive ? 'rgba(234,179,8,0.12)' : 'rgba(11,17,32,0.88)';
        ctx.fillRect(x - maxW / 2 - pad, startY - lh / 2 - pad, maxW + pad * 2, totalLines * lh + pad * 2);
        if (isActive) {
            ctx.strokeStyle = 'rgba(234,179,8,0.3)'; ctx.lineWidth = 1;
            ctx.strokeRect(x - maxW / 2 - pad, startY - lh / 2 - pad, maxW + pad * 2, totalLines * lh + pad * 2);
        }

        
        show.forEach((t, i) => this._colorLabel(t, x, startY + i * lh, isActive));
        if (extra > 0) {
            ctx.fillStyle = this.MUTED; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`+${extra} mais...`, x, startY + show.length * lh);
        }
    }

    _colorLabel(t, cx, y, isActive) {
        const ctx = this.ctx;
        ctx.font = this.LABEL_FONT; ctx.textBaseline = 'middle';
        const parts = [
            { t: '(', c: this.MUTED }, { t: t.read[0], c: this.TAPE1 }, { t: ',', c: this.MUTED }, { t: t.read[1], c: this.TAPE2 },
            { t: ')/(', c: this.MUTED }, { t: t.write[0], c: this.TAPE1 }, { t: ',', c: this.MUTED }, { t: t.write[1], c: this.TAPE2 },
            { t: ');(', c: this.MUTED }, { t: t.move[0], c: this.TAPE1 }, { t: ',', c: this.MUTED }, { t: t.move[1], c: this.TAPE2 },
            { t: ')', c: this.MUTED }
        ];
        let totalW = 0;
        parts.forEach(p => totalW += ctx.measureText(p.t).width);
        let curX = cx - totalW / 2;
        parts.forEach(p => {
            ctx.fillStyle = isActive ? this.ACTIVE : p.c;
            ctx.textAlign = 'left';
            ctx.fillText(p.t, curX, y);
            curX += ctx.measureText(p.t).width;
        });
    }

    drawLegend() {
        const ctx = this.ctx, x = 12, y = this.H - 12;
        ctx.font = '10px Inter, sans-serif'; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
        ctx.fillStyle = this.TAPE1; ctx.fillText('● Fita 1', x, y);
        ctx.fillStyle = this.TAPE2; ctx.fillText('● Fita 2', x + 60, y);
    }
}
