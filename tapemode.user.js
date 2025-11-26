// ==UserScript==
// @name         TypeRacer: Tape Mode 
// @namespace    http://tampermonkey.net/
// @version      42.0
// @description  Tape-mode for Typeracer
// @author       TapeMod
// @match        *://play.typeracer.com/*
// @match        *://staging.typeracer.com/*
// @match        *://data.typeracer.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@300..700&family=IBM+Plex+Mono:wght@100..700&family=Inconsolata:wght@200..900&family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&family=Merriweather:wght@300..900&family=Montserrat:wght@100..900&family=Nunito:wght@200..1000&family=Open+Sans:wght@300..800&family=Oxygen+Mono&family=PT+Mono&family=Playfair+Display:wght@400..900&family=Raleway:wght@100..900&family=Roboto+Mono:wght@100..700&family=Roboto+Slab:wght@100..900&family=Roboto:wght@100..900&family=Source+Code+Pro:wght@200..900&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Ubuntu+Mono:wght@400;700&display=swap";

    const DEFAULTS = {
        coverMode: true,
        smartLock: false,
        hideInput: true,
        tapeWidth: 900,
        tapeHeight: 80,
        fontSize: 32,
        fontWeight: 400,
        letterSpacing: 0,
        fontFamily: "'Roboto Mono', monospace",
        cursorWidth: 2,
        manualPositioning: false,
        manualX: 100,
        manualY: 100,
        smoothness: 1.0,
        blinkSpeed: 1.0,
        windowOpacity: 100,
        showLiveWpm: true,
        pacemakerMode: true,
        pacemakerWpm: 100,
        pacemakerColor: "#00ff00",
        bg: "#000000",
        textMain: "#666666",
        textCorrect: "#d1d0c5",
        textError: "#ff0000",
        cursorColor: "#ffffff",
    };

    const FONT_OPTIONS = [
        { name: "Roboto Mono", val: "'Roboto Mono', monospace" },
        { name: "JetBrains Mono", val: "'JetBrains Mono', monospace" },
        { name: "Fira Code", val: "'Fira Code', monospace" },
        { name: "Source Code Pro", val: "'Source Code Pro', monospace" },
        { name: "IBM Plex Mono", val: "'IBM Plex Mono', monospace" },
        { name: "Space Mono", val: "'Space Mono', monospace" },
        { name: "Ubuntu Mono", val: "'Ubuntu Mono', monospace" },
        { name: "Inconsolata", val: "'Inconsolata', monospace" },
        { name: "PT Mono", val: "'PT Mono', monospace" },
        { name: "Courier Prime", val: "'Courier Prime', monospace" },
        { name: "Oxygen Mono", val: "'Oxygen Mono', monospace" },
        { name: "Inter (Sans)", val: "'Inter', sans-serif" },
        { name: "Roboto (Sans)", val: "'Roboto', sans-serif" },
        { name: "Open Sans (Sans)", val: "'Open Sans', sans-serif" },
        { name: "Montserrat (Sans)", val: "'Montserrat', sans-serif" },
        { name: "Nunito (Sans)", val: "'Nunito', sans-serif" },
        { name: "Raleway (Sans)", val: "'Raleway', sans-serif" },
        { name: "Merriweather (Serif)", val: "'Merriweather', serif" },
        { name: "Roboto Slab (Serif)", val: "'Roboto Slab', serif" },
        { name: "Playfair Display (Serif)", val: "'Playfair Display', serif" }
    ];

    let CFG = { ...DEFAULTS, ...JSON.parse(localStorage.getItem('tr_tape_suite_v14') || '{}') };

    function saveConfig() {
        localStorage.setItem('tr_tape_suite_v14', JSON.stringify(CFG));
    }

    function hexToRgba(hex, alphaPercent) {
        const alpha = alphaPercent / 100;
        let c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3) c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
        }
        return hex;
    }

    function loadFonts() {
        if (!document.getElementById('tr-google-fonts')) {
            const link = document.createElement('link');
            link.id = 'tr-google-fonts';
            link.rel = 'stylesheet';
            link.href = GOOGLE_FONTS_URL;
            document.head.appendChild(link);
        }
    }

    function updateGameStyles() {
        let positionCSS = '';
        const widthVal = `${CFG.tapeWidth}px`;
        const hideInputCSS = CFG.hideInput ? `.txtInput { opacity: 0 !important; }` : ``;

        if (!CFG.coverMode) {
            if (!CFG.manualPositioning) {
                positionCSS = CFG.smartLock ?
                    `position: absolute; z-index: 999999;` :
                    `position: absolute; left: 50%; transform: translateX(-50%); width: ${widthVal}; z-index: 999999;`;
            } else {
                 positionCSS = `position: absolute; z-index: 999999; width: ${widthVal};`;
            }
        } else {
            positionCSS = `position: absolute; z-index: 999999; transform: none;`;
        }

        const bgRgba = hexToRgba(CFG.bg, CFG.windowOpacity);
        const pointerEvents = CFG.manualPositioning && !CFG.coverMode ? 'auto' : 'none';
        const cursorStyle = CFG.manualPositioning && !CFG.coverMode ? 'grab' : 'default';

        const css = `
            ${hideInputCSS}
            #tr-tape-overlay {
                ${positionCSS}
                height: ${CFG.tapeHeight}px;
                background: ${bgRgba};
                border-radius: 6px;
                overflow: visible;
                display: none;
                align-items: center;
                pointer-events: ${pointerEvents};
                cursor: ${cursorStyle};
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transition: background 0.2s;
                user-select: none;
            }
            #tr-tape-overlay:active {
                cursor: ${CFG.manualPositioning && !CFG.coverMode ? 'grabbing' : 'default'};
            }
            #tr-tape-mask {
                width: 100%;
                height: 100%;
                overflow: hidden;
                position: relative;
                border-radius: 6px;
            }
            #tr-tape-strip {
                position: absolute;
                left: 50%;
                top: 0; bottom: 0;
                display: flex; align-items: center;
                white-space: pre;
                font-family: ${CFG.fontFamily};
                font-size: ${CFG.fontSize}px;
                font-weight: ${CFG.fontWeight};
                letter-spacing: ${CFG.letterSpacing}px;
                color: ${CFG.textMain};
                will-change: transform;
                transition: transform ${CFG.smoothness}s cubic-bezier(0.25, 1, 0.5, 1);
            }
            #tr-tape-cursor {
                position: absolute;
                left: 50%;
                top: 25%;
                bottom: 25%;
                width: ${CFG.cursorWidth}px;
                background-color: ${CFG.cursorColor};
                z-index: 20;
                border-radius: 2px;
                box-shadow: 0 0 10px ${CFG.cursorColor};
                animation: tr-blink ${CFG.blinkSpeed}s infinite;
                transform: translateX(-50%);
            }
            #tr-tape-ghost {
                position: absolute;
                left: 0;
                top: 25%;
                bottom: 25%;
                width: ${CFG.cursorWidth}px;
                background-color: ${CFG.pacemakerColor};
                z-index: 10;
                opacity: 0.6;
                border-radius: 2px;
                will-change: transform;
                pointer-events: none;
            }
            #tr-live-wpm {
                position: absolute;
                left: 50%;
                bottom: 100%;
                transform: translateX(-50%);
                margin-bottom: 12px;
                background: ${bgRgba};
                color: ${CFG.cursorColor};
                font-family: 'Segoe UI', Roboto, sans-serif;
                font-size: 24px;
                font-weight: bold;
                padding: 4px 12px;
                border-radius: 4px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 1000002;
                pointer-events: none;
                text-shadow: 0 2px 5px rgba(0,0,0,0.5);
            }
            @keyframes tr-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            .tr-char { display: inline-block; }
            .tr-char.c { color: ${CFG.textCorrect}; }
            .tr-char.e { color: ${CFG.textError}; text-decoration: underline; }
        `;

        let styleEl = document.getElementById('tr-tape-css');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'tr-tape-css';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;
    }

    function applyMenuStyles() {
        const menuCSS = `
            #tr-ui-btn {
                position: fixed; bottom: 30px; right: 30px;
                width: 50px; height: 50px;
                background: #111; color: #eee;
                border-radius: 50%; border: 2px solid #333;
                display: flex; justify-content: center; align-items: center;
                font-size: 24px; cursor: pointer;
                z-index: 1000000; opacity: 0.5;
                transition: all 0.2s ease;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            #tr-ui-btn:hover { opacity: 1; transform: scale(1.1) rotate(90deg); border-color: #e2b714; }
            #tr-ui-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); backdrop-filter: blur(3px);
                z-index: 1000001; display: none;
                justify-content: center; align-items: center;
            }
            #tr-ui-modal {
                width: 750px; height: 650px;
                background: #181818; border: 1px solid #333;
                border-radius: 12px;
                display: flex; overflow: hidden;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                font-family: 'Segoe UI', Roboto, Helvetica, sans-serif;
                color: #eee;
            }
            .tr-sidebar { width: 180px; background: #111; border-right: 1px solid #222; padding: 20px 0; display: flex; flex-direction: column; }
            .tr-sidebar-header { padding: 0 20px 20px 20px; font-size: 18px; font-weight: bold; color: #e2b714; border-bottom: 1px solid #222; margin-bottom: 10px; }
            .tr-tab-btn { padding: 12px 20px; cursor: pointer; color: #888; transition: 0.2s; font-size: 14px; border-left: 3px solid transparent; }
            .tr-tab-btn:hover { background: #222; color: #fff; }
            .tr-tab-btn.active { background: #222; color: #fff; border-left-color: #e2b714; }
            .tr-content { flex: 1; padding: 30px; overflow-y: auto; position: relative; }
            .tr-tab-pane { display: none; }
            .tr-tab-pane.active { display: block; animation: tr-fade 0.3s; }
            @keyframes tr-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            .tr-group { margin-bottom: 25px; }
            .tr-group-title { font-size: 12px; text-transform: uppercase; color: #555; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 5px; }
            .tr-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .tr-label { font-size: 14px; color: #ccc; }
            .tr-sublabel { font-size: 11px; color: #666; display: block; margin-top: 2px; }
            .tr-slider-container { display: flex; align-items: center; gap: 10px; width: 220px; }
            .tr-range { flex: 1; cursor: pointer; accent-color: #e2b714; }
            .tr-range-val { font-family: monospace; font-size: 12px; color: #e2b714; width: 35px; text-align: right; }
            .tr-select { background: #222; border: 1px solid #444; color: #fff; padding: 5px; border-radius: 4px; width: 220px; }
            .tr-input-color { -webkit-appearance: none; border: none; width: 30px; height: 30px; background: none; cursor: pointer; }
            .tr-input-color::-webkit-color-swatch-wrapper { padding: 0; }
            .tr-input-color::-webkit-color-swatch { border: 2px solid #444; border-radius: 50%; }
            .tr-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
            .tr-switch input { opacity: 0; width: 0; height: 0; }
            .tr-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 34px; }
            .tr-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .tr-slider { background-color: #e2b714; }
            input:checked + .tr-slider:before { transform: translateX(20px); }
            .tr-footer { position: absolute; bottom: 0; left: 0; width: 100%; padding: 15px 30px; background: #181818; border-top: 1px solid #222; display: flex; justify-content: flex-end; gap: 10px; box-sizing: border-box; }
            .tr-btn { padding: 8px 20px; border-radius: 4px; cursor: pointer; font-size: 13px; border: 1px solid transparent; font-weight: 600; }
            .tr-btn-ghost { background: transparent; color: #888; border-color: #333; }
            .tr-btn-ghost:hover { border-color: #666; color: #fff; }
            .tr-btn-primary { background: #e2b714; color: #111; }
            .tr-btn-primary:hover { background: #f3c928; }
            .tr-input-num-small { background: #222; border: 1px solid #444; color: #fff; padding: 4px; width: 50px; text-align: center; border-radius: 4px; }
            .tr-credit-box {
                margin-top: 15px; padding: 12px;
                background: linear-gradient(135deg, rgba(226, 183, 20, 0.1), rgba(0,0,0,0));
                border: 1px solid rgba(226, 183, 20, 0.3);
                border-radius: 6px; text-align: center;
                transition: all 0.3s ease;
            }
            .tr-credit-box:hover { border-color: #e2b714; box-shadow: 0 0 15px rgba(226, 183, 20, 0.2); }
            .tr-credit-label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
            .tr-credit-link { color: #e2b714; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block; }
            .tr-credit-link:hover { text-decoration: underline; text-shadow: 0 0 8px rgba(226, 183, 20, 0.6); }
        `;
        let styleEl = document.getElementById('tr-menu-css');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'tr-menu-css';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = menuCSS;
    }

    let state = {
        activeText: "",
        charWidths: [],
        dom: { tape: null, strip: null, input: null, target: null, ghost: null, wpm: null },
        committedIndex: 0,
        lastInputVal: "",
        lastInputType: "",
        isReady: false,
        startTime: null,
        isRacing: false,
        lastWpmUpdate: 0
    };

    function buildUI() {
        if (document.getElementById('tr-ui-btn')) return;
        const btn = document.createElement('div');
        btn.id = 'tr-ui-btn';
        btn.innerHTML = '⚙️';
        btn.title = "Tape Mode Settings";
        btn.onclick = toggleMenu;
        document.body.appendChild(btn);

        const overlay = document.createElement('div');
        overlay.id = 'tr-ui-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) toggleMenu(); };

        let fontOpts = FONT_OPTIONS.map(f => `<option value="${f.val}" ${CFG.fontFamily === f.val ? 'selected' : ''}>${f.name}</option>`).join('');

        overlay.innerHTML = `
            <div id="tr-ui-modal">
                <div class="tr-sidebar">
                    <div class="tr-sidebar-header">Tape Mode</div>
                    <div class="tr-tab-btn active" data-tab="tab-layout">Layout</div>
                    <div class="tr-tab-btn" data-tab="tab-typography">Typography</div>
                    <div class="tr-tab-btn" data-tab="tab-colors">Colors</div>
                    <div class="tr-tab-btn" data-tab="tab-behavior">Behavior</div>
                </div>
                <div class="tr-content">
                    <div id="tab-layout" class="tr-tab-pane active">
                        <div class="tr-group">
                            <div class="tr-group-title">Sizing Mode</div>
                            <div class="tr-row">
                                <div><div class="tr-label">Cover Mode (Fit Box)</div><span class="tr-sublabel">Matches exact game box dimensions</span></div>
                                <label class="tr-switch"><input type="checkbox" id="cfg-coverMode" ${CFG.coverMode ? 'checked' : ''}><span class="tr-slider"></span></label>
                            </div>
                            <div class="tr-row">
                                <div><div class="tr-label">Smart Lock</div><span class="tr-sublabel">Matches width (If Cover Mode is OFF)</span></div>
                                <label class="tr-switch"><input type="checkbox" id="cfg-smartLock" ${CFG.smartLock ? 'checked' : ''}><span class="tr-slider"></span></label>
                            </div>
                        </div>
                        <div class="tr-group">
                            <div class="tr-group-title">Visibility</div>
                            <div class="tr-row">
                                <div><div class="tr-label">Hide Input Box</div><span class="tr-sublabel">Invisible typing field</span></div>
                                <label class="tr-switch"><input type="checkbox" id="cfg-hideInput" ${CFG.hideInput ? 'checked' : ''}><span class="tr-slider"></span></label>
                            </div>
                        </div>
                        <div class="tr-group">
                            <div class="tr-group-title">Manual Dimensions</div>
                            <div class="tr-row"><div><div class="tr-label">Tape Height</div><span class="tr-sublabel">Pixels</span></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-tapeHeight" min="40" max="200" value="${CFG.tapeHeight}" oninput="document.getElementById('val-height').innerText=this.value"><span id="val-height" class="tr-range-val">${CFG.tapeHeight}</span></div></div>
                            <div class="tr-row"><div><div class="tr-label">Custom Width</div><span class="tr-sublabel">Pixels</span></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-tapeWidth" min="200" max="1500" value="${CFG.tapeWidth}" oninput="document.getElementById('val-width').innerText=this.value"><span id="val-width" class="tr-range-val">${CFG.tapeWidth}</span></div></div>
                        </div>
                        <div class="tr-group">
                            <div class="tr-group-title">Positioning</div>
                            <div class="tr-row"><div><div class="tr-label">Enable Dragging</div><span class="tr-sublabel">Only active if Cover Mode is OFF</span></div><label class="tr-switch"><input type="checkbox" id="cfg-manualPositioning" ${CFG.manualPositioning ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                        </div>
                    </div>
                    <div id="tab-typography" class="tr-tab-pane">
                        <div class="tr-group">
                            <div class="tr-group-title">Font Selection</div>
                            <div class="tr-row"><div class="tr-label">Font Family</div><select class="tr-select" id="cfg-fontFamily">${fontOpts}</select></div>
                            <div class="tr-row">
                                <div><div class="tr-label">Font Weight</div><span class="tr-sublabel">Thin (100) to Black (900)</span></div>
                                <div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-fontWeight" min="100" max="900" step="100" value="${CFG.fontWeight}" oninput="document.getElementById('val-weight').innerText=this.value"><span id="val-weight" class="tr-range-val">${CFG.fontWeight}</span></div>
                            </div>
                            <div class="tr-row">
                                <div><div class="tr-label">Font Size (px)</div></div>
                                <div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-fontSize" min="12" max="64" value="${CFG.fontSize}" oninput="document.getElementById('val-font').innerText=this.value"><span id="val-font" class="tr-range-val">${CFG.fontSize}</span></div>
                            </div>
                        </div>
                        <div class="tr-group">
                            <div class="tr-group-title">Cursor Style</div>
                            <div class="tr-row">
                                <div><div class="tr-label">Caret Width</div><span class="tr-sublabel">Thickness in pixels</span></div>
                                <div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-cursorWidth" min="1" max="10" step="1" value="${CFG.cursorWidth}" oninput="document.getElementById('val-cursorW').innerText=this.value"><span id="val-cursorW" class="tr-range-val">${CFG.cursorWidth}</span></div>
                            </div>
                        </div>
                    </div>
                    <div id="tab-colors" class="tr-tab-pane">
                        <div class="tr-group">
                            <div class="tr-group-title">Interface</div>
                            <div class="tr-row"><div class="tr-label">Background</div><input type="color" class="tr-input-color" id="cfg-bg" value="${CFG.bg}"></div>
                            <div class="tr-row"><div class="tr-label">Cursor</div><input type="color" class="tr-input-color" id="cfg-cursorColor" value="${CFG.cursorColor}"></div>
                        </div>
                        <div class="tr-group">
                            <div class="tr-group-title">Text</div>
                            <div class="tr-row"><div class="tr-label">Main Text</div><input type="color" class="tr-input-color" id="cfg-textMain" value="${CFG.textMain}"></div>
                            <div class="tr-row"><div class="tr-label">Correct Text</div><input type="color" class="tr-input-color" id="cfg-textCorrect" value="${CFG.textCorrect}"></div>
                            <div class="tr-row"><div class="tr-label">Error Text</div><input type="color" class="tr-input-color" id="cfg-textError" value="${CFG.textError}"></div>
                        </div>
                    </div>
                    <div id="tab-behavior" class="tr-tab-pane">
                        <div class="tr-group">
                            <div class="tr-group-title">Information</div>
                            <div class="tr-row">
                                <div><div class="tr-label">Show Live WPM</div><span class="tr-sublabel">Monkeytype Formula</span></div>
                                <label class="tr-switch"><input type="checkbox" id="cfg-showLiveWpm" ${CFG.showLiveWpm ? 'checked' : ''}><span class="tr-slider"></span></label>
                            </div>
                        </div>
                        <div class="tr-group">
                            <div class="tr-group-title">Pacemaker Compatibility</div>
                            <div class="tr-row">
                                <div><div class="tr-label">Pacemaker Mode</div><span class="tr-sublabel">Native Ghost Cursor</span></div>
                                <label class="tr-switch"><input type="checkbox" id="cfg-pacemakerMode" ${CFG.pacemakerMode ? 'checked' : ''}><span class="tr-slider"></span></label>
                            </div>
                            <div class="tr-row"><div class="tr-label">Ghost Speed (WPM)</div><input type="number" class="tr-input-num-small" id="cfg-pacemakerWpm" value="${CFG.pacemakerWpm}"></div>
                            <div class="tr-row"><div class="tr-label">Ghost Color</div><input type="color" class="tr-input-color" id="cfg-pacemakerColor" value="${CFG.pacemakerColor}"></div>
                            <div class="tr-credit-box">
                                <div class="tr-credit-label">Pacemaker Concept by</div>
                                <a href="https://github.com/PoemOnTyperacer/" target="_blank" class="tr-credit-link">PoemOnTyperacer</a>
                            </div>
                        </div>
                        <div class="tr-group">
                            <div class="tr-group-title">Animation</div>
                            <div class="tr-row"><div><div class="tr-label">Smoothness</div><span class="tr-sublabel">Higher = Slower Drag (0 - 50s)</span></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-smoothness" min="0" max="50" step="0.1" value="${CFG.smoothness}" oninput="document.getElementById('val-smooth').innerText=this.value"><span id="val-smooth" class="tr-range-val">${CFG.smoothness}</span></div></div>
                            <div class="tr-row"><div><div class="tr-label">Background Opacity</div><span class="tr-sublabel">0% to 100%</span></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-windowOpacity" min="0" max="100" step="1" value="${CFG.windowOpacity}" oninput="document.getElementById('val-opac').innerText=this.value"><span id="val-opac" class="tr-range-val">${CFG.windowOpacity}</span></div></div>
                        </div>
                        <div class="tr-group"><div class="tr-group-title">Reset</div><div class="tr-row"><button class="tr-btn tr-btn-ghost" id="tr-btn-reset" style="width:100%; text-align:center;">Reset All to Defaults</button></div></div>
                    </div>
                </div>
                <div class="tr-footer"><button class="tr-btn tr-btn-ghost" id="tr-btn-cancel">Cancel</button><button class="tr-btn tr-btn-primary" id="tr-btn-save">Save</button></div>
            </div>
        `;
        document.body.appendChild(overlay);

        const tabs = overlay.querySelectorAll('.tr-tab-btn');
        const panes = overlay.querySelectorAll('.tr-tab-pane');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });

        document.getElementById('tr-btn-save').onclick = () => {
            CFG.coverMode = document.getElementById('cfg-coverMode').checked;
            CFG.smartLock = document.getElementById('cfg-smartLock').checked;
            CFG.hideInput = document.getElementById('cfg-hideInput').checked;
            CFG.manualPositioning = document.getElementById('cfg-manualPositioning').checked;
            CFG.tapeWidth = parseInt(document.getElementById('cfg-tapeWidth').value);
            CFG.tapeHeight = parseInt(document.getElementById('cfg-tapeHeight').value);
            CFG.fontSize = parseInt(document.getElementById('cfg-fontSize').value);
            CFG.fontWeight = parseInt(document.getElementById('cfg-fontWeight').value);
            CFG.fontFamily = document.getElementById('cfg-fontFamily').value;
            CFG.cursorWidth = parseInt(document.getElementById('cfg-cursorWidth').value);
            CFG.bg = document.getElementById('cfg-bg').value;
            CFG.textMain = document.getElementById('cfg-textMain').value;
            CFG.textCorrect = document.getElementById('cfg-textCorrect').value;
            CFG.textError = document.getElementById('cfg-textError').value;
            CFG.cursorColor = document.getElementById('cfg-cursorColor').value;
            CFG.pacemakerMode = document.getElementById('cfg-pacemakerMode').checked;
            CFG.pacemakerWpm = parseInt(document.getElementById('cfg-pacemakerWpm').value);
            CFG.pacemakerColor = document.getElementById('cfg-pacemakerColor').value;
            CFG.smoothness = parseFloat(document.getElementById('cfg-smoothness').value);
            CFG.windowOpacity = parseInt(document.getElementById('cfg-windowOpacity').value);
            CFG.showLiveWpm = document.getElementById('cfg-showLiveWpm').checked;

            saveConfig();
            updateGameStyles();

            if (state.activeText && state.dom.strip) {
                buildStrip(state.activeText);
            }
            toggleMenu();
        };

        document.getElementById('tr-btn-cancel').onclick = toggleMenu;
        document.getElementById('tr-btn-reset').onclick = () => {
            if(confirm('Reset all settings to default?')) {
                localStorage.removeItem('tr_tape_suite_v14');
                location.reload();
            }
        };
    }

    function toggleMenu() {
        const m = document.getElementById('tr-ui-overlay');
        m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
    }

    function normalize(str) {
        return str.replace(/\u00A0/g, " ").replace(/&nbsp;/g, " ");
    }

    function makeDraggable(el) {
        let isDragging = false;
        let offsetX, offsetY;

        el.addEventListener('mousedown', (e) => {
            if (CFG.coverMode || !CFG.manualPositioning) return;
            if (e.target.tagName === 'INPUT') return;

            isDragging = true;
            el.style.cursor = 'grabbing';
            const rect = el.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('mouseup', onDragEnd);
            e.preventDefault();
        });

        function onDragMove(e) {
            if (!isDragging) return;
            requestAnimationFrame(() => {
                const newLeft = e.clientX - offsetX + window.scrollX;
                const newTop = e.clientY - offsetY + window.scrollY;
                el.style.left = `${newLeft}px`;
                el.style.top = `${newTop}px`;
                el.style.transform = 'none';
            });
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            el.style.cursor = 'grab';
            const rect = el.getBoundingClientRect();
            CFG.manualX = rect.left + window.scrollX;
            CFG.manualY = rect.top + window.scrollY;
            saveConfig();
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            if(state.dom.input) state.dom.input.focus();
        }
    }

    function createTapeUI() {
        if (document.getElementById('tr-tape-overlay')) return;
        const win = document.createElement('div'); win.id = 'tr-tape-overlay';

        const wpmBox = document.createElement('div');
        wpmBox.id = 'tr-live-wpm';
        wpmBox.innerText = "0";
        win.appendChild(wpmBox);
        state.dom.wpm = wpmBox;

        const mask = document.createElement('div');
        mask.id = 'tr-tape-mask';
        win.appendChild(mask);

        const cursor = document.createElement('div'); cursor.id = 'tr-tape-cursor'; mask.appendChild(cursor);
        const strip = document.createElement('div'); strip.id = 'tr-tape-strip'; mask.appendChild(strip);

        const ghost = document.createElement('div'); ghost.id = 'tr-tape-ghost';
        ghost.style.display = CFG.pacemakerMode ? 'block' : 'none';
        strip.appendChild(ghost);
        state.dom.ghost = ghost;

        document.body.appendChild(win);
        state.dom.tape = win; state.dom.strip = strip;
        makeDraggable(win);
    }

    function buildStrip(text) {
        const strip = state.dom.strip;
        const ghost = state.dom.ghost;
        strip.innerHTML = '';
        if(ghost) strip.appendChild(ghost);

        state.charWidths = [];
        strip.style.fontFamily = CFG.fontFamily;
        strip.style.fontSize = CFG.fontSize + 'px';
        strip.style.fontWeight = CFG.fontWeight;
        strip.style.letterSpacing = CFG.letterSpacing + 'px';

        text.split('').forEach(char => {
            const s = document.createElement('span'); s.textContent = char; s.className = 'tr-char'; strip.appendChild(s);
        });

        requestAnimationFrame(() => {
            const children = strip.querySelectorAll('.tr-char');
            children.forEach(c => {
                 state.charWidths.push(c.getBoundingClientRect().width);
            });
            update(true);
            sync();
        });
    }

    function sync() {
        if (!state.dom.target || !state.dom.tape || !state.dom.input) return;

        const textRect = state.dom.target.getBoundingClientRect();
        if (textRect.width < 10) { state.dom.tape.style.display = 'none'; return; }
        state.dom.tape.style.display = 'flex';

        if(state.dom.ghost) state.dom.ghost.style.display = CFG.pacemakerMode ? 'block' : 'none';

        if (state.dom.wpm) {
             state.dom.wpm.style.opacity = (CFG.showLiveWpm && state.isRacing) ? 1 : 0;
        }

        const absTop = textRect.top + window.scrollY;
        const absLeft = textRect.left + window.scrollX;

        if (CFG.coverMode) {
            state.dom.tape.style.left = absLeft + 'px';
            state.dom.tape.style.top = absTop + 'px';
            state.dom.tape.style.width = textRect.width + 'px';
            state.dom.tape.style.height = textRect.height + 'px';
            state.dom.tape.style.transform = 'none';
            return;
        }

        if (CFG.manualPositioning) {
            state.dom.tape.style.left = CFG.manualX + 'px';
            state.dom.tape.style.top = CFG.manualY + 'px';
            state.dom.tape.style.transform = 'none';
            state.dom.tape.style.width = CFG.smartLock ? textRect.width + "px" : (CFG.tapeWidthType === '%' ? CFG.tapeWidth + '%' : CFG.tapeWidth + 'px');
        } else {
            if (CFG.smartLock) {
                state.dom.tape.style.left = absLeft + "px";
                state.dom.tape.style.width = textRect.width + "px";
                state.dom.tape.style.transform = 'none';
            } else {
                state.dom.tape.style.left = '50%'; state.dom.tape.style.transform = 'translateX(-50%)';
                state.dom.tape.style.width = (CFG.tapeWidthType === '%' ? CFG.tapeWidth + '%' : CFG.tapeWidth + 'px');
            }
            state.dom.tape.style.top = absTop + "px";
            state.dom.tape.style.height = CFG.tapeHeight + "px";
        }
    }

    function update(forceReset = false) {
        if (!state.dom.input || !state.dom.strip) return;
        let inputVal = normalize(state.dom.input.value);

        if (!state.isReady && !forceReset) {
            if (inputVal === "") {
                state.isReady = true;
                state.isRacing = false;
                state.startTime = null;
                if(state.dom.ghost) state.dom.ghost.style.transform = `translateX(0px)`;
                if(state.dom.wpm) state.dom.wpm.innerText = "0";
            } else {
                state.dom.strip.style.transform = `translateX(0px)`; return;
            }
        }

        if (state.isReady && inputVal.length > 0 && !state.isRacing) {
            state.isRacing = true;
            state.startTime = Date.now();
            state.lastWpmUpdate = Date.now();
        }

        if (forceReset) {
            state.committedIndex = 0;
            state.lastInputVal = "";
            inputVal = "";
            state.isRacing = false;
            state.startTime = null;
            if(state.dom.wpm) state.dom.wpm.innerText = "0";
        }

        const now = Date.now();

        if (CFG.showLiveWpm && state.isRacing && state.startTime) {
            if (now - state.lastWpmUpdate > 100) {
                const elapsedMinutes = (now - state.startTime) / 1000 / 60;
                if (elapsedMinutes > 0) {
                    const wpm = (state.committedIndex / 5) / elapsedMinutes;
                    const val = Math.round(wpm);
                    if (state.dom.wpm) state.dom.wpm.innerText = val;
                }
                state.lastWpmUpdate = now;
            }
        }

        if (CFG.pacemakerMode && state.isRacing && state.startTime) {
            const elapsedMinutes = (now - state.startTime) / 1000 / 60;
            const charsPerMinute = CFG.pacemakerWpm * 5;
            const targetIndex = charsPerMinute * elapsedMinutes;

            let ghostPixels = 0;
            let currentIdx = 0;
            for(let w of state.charWidths) {
                if(currentIdx >= targetIndex) break;
                ghostPixels += w;
                currentIdx++;
            }

            if (Math.floor(targetIndex) < state.charWidths.length) {
                const fraction = targetIndex - Math.floor(targetIndex);
                ghostPixels += (state.charWidths[Math.floor(targetIndex)] * fraction);
            }

            if(state.dom.ghost) {
                 state.dom.ghost.style.transform = `translate3d(${ghostPixels}px, 0, 0)`;
            }
        } else if (!state.isRacing && state.dom.ghost) {
             state.dom.ghost.style.transform = `translate3d(0px, 0, 0)`;
        }

        if (inputVal.length < state.lastInputVal.length) {
            const isManualDelete = state.lastInputType && state.lastInputType.toLowerCase().includes('delete');
            if (!isManualDelete) {
                const expectedSegment = state.activeText.substring(state.committedIndex);
                if (expectedSegment.startsWith(state.lastInputVal)) {
                    let nextSpace = state.activeText.indexOf(' ', state.committedIndex);
                    if (nextSpace === -1) nextSpace = state.activeText.length;
                    else nextSpace += 1;
                    state.committedIndex = nextSpace;
                }
            }
        }

        state.lastInputVal = inputVal;
        const totalIndex = state.committedIndex + inputVal.length;
        const spans = state.dom.strip.querySelectorAll('.tr-char');
        let offsetPixels = 0;

        for (let i = 0; i < spans.length; i++) {
            const span = spans[i];
            const width = state.charWidths[i] || 15;
            if (i < totalIndex) {
                let isCorrect = true;
                if (i >= state.committedIndex) {
                    const inputCharIndex = i - state.committedIndex;
                    if (inputVal[inputCharIndex] !== state.activeText[i]) isCorrect = false;
                }
                span.className = isCorrect ? 'tr-char c' : 'tr-char e';
                offsetPixels += width;
            } else {
                span.className = 'tr-char';
            }
        }
        state.dom.strip.style.transform = `translateX(-${offsetPixels}px)`;
    }

    function loop() {
        requestAnimationFrame(loop);
        const input = document.querySelector('.txtInput');
        const atom = document.querySelector('span[unselectable="on"]');

        if (input && atom) {
            const textDiv = atom.parentNode;
            const currentText = normalize(textDiv.textContent);

            if (currentText !== state.activeText && currentText.length > 5) {
                state.activeText = currentText;
                state.dom.target = textDiv;
                state.dom.input = input;
                state.committedIndex = 0;
                state.lastInputVal = "";
                state.isReady = false;
                state.lastInputType = "";
                state.isRacing = false;

                createTapeUI();
                buildStrip(currentText);

                input.addEventListener('input', (e) => {
                    state.lastInputType = e.inputType || "insertText";
                });
            }

            if (state.activeText) {
                sync();
                update();
            }
        } else {
            if (state.dom.tape) state.dom.tape.style.display = 'none';
        }
    }

    loadFonts();
    updateGameStyles();
    applyMenuStyles();
    buildUI();
    loop();

})();
