// ==UserScript==
// @name         TypeRacer: Tape Mode
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  A highly customizable, tape mode for TypeRacer
// @author       miyakejima / polka7 / misstheoretical
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
        hideRaceTrack: false,
        tapeWidth: 900,
        tapeHeight: 80,
        fontSize: 32,
        fontWeight: 400,
        letterSpacing: 0,
        fontFamily: "'Roboto Mono', monospace",
        showCaret: true,
        cursorWidth: 2,
        manualPositioning: false,
        manualX: 100,
        manualY: 100,
        smoothness: 1.0,
        blinkSpeed: 1.0,
        windowOpacity: 100,
        showLiveWpm: true,
        wpmFontSize: 40,
        wpmColorMatch: false,
        wpmUpdateInterval: 100,
        pacemakerMode: true,
        pacemakerWpm: 100,
        pacemakerColor: "#444444",
        bg: "#000000",
        textMain: "#555555",
        textCorrect: "#ffffff",
        textError: "#999999",
        cursorColor: "#dddddd",
        showProgressBar: true,
        focusMode: false,
        focusOpacity: 0.8,
        particleMode: false,
        dynamicLighting: false
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

    let CFG = { ...DEFAULTS, ...JSON.parse(localStorage.getItem('tr_tape_config') || '{}') };

    function saveConfig() {
        localStorage.setItem('tr_tape_config', JSON.stringify(CFG));
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
        const hideInputCSS = CFG.hideInput ? `.txtInput { opacity: 0 !important; color: transparent !important; caret-color: transparent !important; }` : ``;
        const hideRaceTrackCSS = CFG.hideRaceTrack ? `.scoreboard, .progressBar { display: none !important; }` : ``;
        const opacity = CFG.coverMode ? 100 : CFG.windowOpacity;
        const bgRgba = hexToRgba(CFG.bg, opacity);
        const tapeHeightCSS = `${CFG.tapeHeight}px`;

        if (!CFG.coverMode) {
            if (!CFG.manualPositioning) {
                positionCSS = CFG.smartLock ?
                    `position: absolute; z-index: 999999;` :
                    `position: absolute; left: 50%; transform: translateX(-50%); width: ${widthVal}; z-index: 999999;`;
            } else {
                 positionCSS = `position: absolute; z-index: 999999; width: ${widthVal};`;
            }
        } else {
            positionCSS = `position: absolute; z-index: 999999; transform: none; display: flex; align-items: center; justify-content: center;`;
        }

        const pointerEvents = CFG.manualPositioning && !CFG.coverMode ? 'auto' : 'none';
        const cursorStyle = CFG.manualPositioning && !CFG.coverMode ? 'grab' : 'default';
        const caretDisplay = CFG.showCaret ? 'block' : 'none';

        const css = `
            ${hideInputCSS}
            ${hideRaceTrackCSS}
            .countdownPopup, .raceAgainLink, .gwt-PopupPanel { z-index: 2147483647 !important; }
            .cursor, .caret, .blink { opacity: 0 !important; visibility: hidden !important; display: none !important; }

            #tr-focus-dimmer {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0, ${CFG.focusOpacity});
                z-index: 999900;
                opacity: 0; pointer-events: none;
                transition: opacity 0.5s ease, background-color 0.2s;
            }
            #tr-focus-dimmer.active { opacity: 1; pointer-events: auto; }

            #tr-tape-overlay {
                ${positionCSS}
                background: ${bgRgba};
                border-radius: 6px;
                display: none;
                pointer-events: ${pointerEvents};
                cursor: ${cursorStyle};
                user-select: none;
                box-sizing: border-box;
                overflow: visible;
                will-change: transform, left, top;
                border: 3px solid transparent;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            }

            #tr-tape-overlay.sema-red { border-color: #ff3333 !important; }
            #tr-tape-overlay.sema-yellow { border-color: #ffcc00 !important; }
            #tr-tape-overlay.sema-green { border-color: #33ff33 !important; }

            #tr-tape-window {
                width: 100%;
                height: ${tapeHeightCSS};
                position: relative;
                overflow: visible;
                border-radius: 4px;
                border: none;
                box-sizing: border-box;
                background: transparent;
                display: flex; align-items: center;
            }

            #tr-tape-mask {
                width: 100%; height: 100%; overflow: hidden; position: relative; contain: strict;
            }
            #tr-tape-strip {
                position: absolute; left: 50%; top: 0; bottom: 0;
                display: flex; align-items: center;
                white-space: pre;
                font-family: ${CFG.fontFamily};
                font-size: ${CFG.fontSize}px;
                font-weight: ${CFG.fontWeight};
                letter-spacing: ${CFG.letterSpacing}px;
                color: ${CFG.textMain};
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                will-change: transform;
                transform: translate3d(0, 0, 0);
                transition: transform ${CFG.smoothness}s cubic-bezier(0.25, 1, 0.5, 1);
            }
            #tr-tape-cursor {
                display: ${caretDisplay};
                position: absolute; left: 50%;
                top: 25%; bottom: 25%;
                height: auto;
                width: ${CFG.cursorWidth}px;
                background-color: ${CFG.cursorColor};
                z-index: 20; border-radius: 2px;
                box-shadow: 0 0 10px ${CFG.cursorColor};
                animation: tr-blink ${CFG.blinkSpeed}s infinite;
                transform: translateX(-50%);
            }
            #tr-tape-ghost {
                position: absolute; left: 0;
                top: 25%; bottom: 25%;
                height: auto;
                width: ${CFG.cursorWidth}px;
                background-color: ${CFG.pacemakerColor};
                z-index: 10; opacity: 0.6; border-radius: 2px;
                will-change: transform; pointer-events: none;
            }
            #tr-live-wpm {
                position: absolute; left: 50%;
                bottom: 100%;
                transform: translateX(-50%) translateY(-10px);
                color: #eee;
                font-family: 'Segoe UI', Roboto, sans-serif;
                font-size: ${CFG.wpmFontSize}px;
                font-weight: 800;
                white-space: nowrap; opacity: 0;
                transition: opacity 0.2s, color 0.2s;
                z-index: 1000005; pointer-events: none;
                text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                background: transparent;
                border: none;
                box-shadow: none;
                padding: 0;
            }
            #tr-progress-bar {
                position: absolute; bottom: 0; left: 0; height: 3px;
                background: #4caf50; width: 0%;
                transition: width 0.1s linear;
                z-index: 25;
            }

            .tr-particle {
                position: absolute;
                width: 4px; height: 4px;
                background: ${CFG.textCorrect};
                border-radius: 50%;
                pointer-events: none;
                z-index: 100;
            }

            @keyframes tr-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            .tr-char { display: inline-block; transform: translateZ(0); }
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

    let state = {
        activeText: "",
        charWidths: [],
        dom: { tape: null, window: null, strip: null, input: null, target: null, ghost: null, wpm: null, spans: [], progress: null, dimmer: null },
        committedIndex: 0,
        lastInputVal: "",
        lastInputType: "",
        isReady: false,
        startTime: null,
        isRacing: false,
        lastWpmUpdate: 0,
        currentWpm: 0,
        semaphoreState: 'idle',
        tempFocusDisabled: false
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
                    <div class="tr-tab-btn" data-tab="tab-visuals">Visuals</div>
                    <div class="tr-tab-btn" data-tab="tab-behavior">Behavior</div>
                    <div class="tr-tab-btn" data-tab="tab-about">About</div>
                </div>
                <div class="tr-main-view">
                    <div class="tr-content">
                        <div id="tab-layout" class="tr-tab-pane active">
                            <div class="tr-group">
                                <div class="tr-group-title">Sizing Mode</div>
                                <div class="tr-row"><div><div class="tr-label">Cover Mode</div><span class="tr-sublabel">Masks original text completely</span></div><label class="tr-switch"><input type="checkbox" id="cfg-coverMode" ${CFG.coverMode ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div><div class="tr-label">Smart Lock</div><span class="tr-sublabel">Matches width</span></div><label class="tr-switch"><input type="checkbox" id="cfg-smartLock" ${CFG.smartLock ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                            </div>
                            <div class="tr-group">
                                <div class="tr-group-title">Visibility</div>
                                <div class="tr-row"><div><div class="tr-label">Hide Input Box</div></div><label class="tr-switch"><input type="checkbox" id="cfg-hideInput" ${CFG.hideInput ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div><div class="tr-label">Hide Racetrack</div><span class="tr-sublabel">Hides cars and scoreboard</span></div><label class="tr-switch"><input type="checkbox" id="cfg-hideRaceTrack" ${CFG.hideRaceTrack ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div><div class="tr-label">Show Progress Bar</div></div><label class="tr-switch"><input type="checkbox" id="cfg-showProgressBar" ${CFG.showProgressBar ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                            </div>
                            <div class="tr-group">
                                <div class="tr-group-title">Dimensions</div>
                                <div class="tr-row"><div><div class="tr-label">Tape Height</div><span class="tr-sublabel">Manual height control</span></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-tapeHeight" min="40" max="250" value="${CFG.tapeHeight}" oninput="document.getElementById('val-height').innerText=this.value"><span id="val-height" class="tr-range-val">${CFG.tapeHeight}</span></div></div>
                                <div class="tr-row"><div><div class="tr-label">Custom Width</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-tapeWidth" min="200" max="1500" value="${CFG.tapeWidth}" oninput="document.getElementById('val-width').innerText=this.value"><span id="val-width" class="tr-range-val">${CFG.tapeWidth}</span></div></div>
                            </div>
                            <div class="tr-group">
                                <div class="tr-group-title">Positioning</div>
                                <div class="tr-row"><div><div class="tr-label">Enable Dragging</div></div><label class="tr-switch"><input type="checkbox" id="cfg-manualPositioning" ${CFG.manualPositioning ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                            </div>
                        </div>
                        <div id="tab-typography" class="tr-tab-pane">
                            <div class="tr-group">
                                <div class="tr-group-title">Font</div>
                                <div class="tr-row"><div class="tr-label">Family</div><select class="tr-select" id="cfg-fontFamily">${fontOpts}</select></div>
                                <div class="tr-row"><div><div class="tr-label">Weight</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-fontWeight" min="100" max="900" step="100" value="${CFG.fontWeight}" oninput="document.getElementById('val-weight').innerText=this.value"><span id="val-weight" class="tr-range-val">${CFG.fontWeight}</span></div></div>
                                <div class="tr-row"><div><div class="tr-label">Size</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-fontSize" min="12" max="64" value="${CFG.fontSize}" oninput="document.getElementById('val-font').innerText=this.value"><span id="val-font" class="tr-range-val">${CFG.fontSize}</span></div></div>
                            </div>
                            <div class="tr-group">
                                <div class="tr-group-title">Cursor</div>
                                <div class="tr-row"><div><div class="tr-label">Show Caret</div></div><label class="tr-switch"><input type="checkbox" id="cfg-showCaret" ${CFG.showCaret ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div><div class="tr-label">Width</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-cursorWidth" min="1" max="10" step="1" value="${CFG.cursorWidth}" oninput="document.getElementById('val-cursorW').innerText=this.value"><span id="val-cursorW" class="tr-range-val">${CFG.cursorWidth}</span></div></div>
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
                                <div class="tr-row"><div class="tr-label">Main</div><input type="color" class="tr-input-color" id="cfg-textMain" value="${CFG.textMain}"></div>
                                <div class="tr-row"><div class="tr-label">Correct</div><input type="color" class="tr-input-color" id="cfg-textCorrect" value="${CFG.textCorrect}"></div>
                                <div class="tr-row"><div class="tr-label">Error</div><input type="color" class="tr-input-color" id="cfg-textError" value="${CFG.textError}"></div>
                            </div>
                        </div>
                        <div id="tab-visuals" class="tr-tab-pane">
                            <div class="tr-group">
                                <div class="tr-group-title">Effects</div>
                                <div class="tr-row"><div><div class="tr-label">Particle Effects</div><span class="tr-sublabel">Sparks when typing</span></div><label class="tr-switch"><input type="checkbox" id="cfg-particleMode" ${CFG.particleMode ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div><div class="tr-label">Dynamic Lighting</div><span class="tr-sublabel">Glow intensity based on WPM</span></div><label class="tr-switch"><input type="checkbox" id="cfg-dynamicLighting" ${CFG.dynamicLighting ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                            </div>
                            <div class="tr-group">
                                <div class="tr-group-title">Immersion</div>
                                <div class="tr-row"><div><div class="tr-label">Focus Mode</div><span class="tr-sublabel">Dims background (ESC to exit)</span></div><label class="tr-switch"><input type="checkbox" id="cfg-focusMode" ${CFG.focusMode ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div><div class="tr-label">Dimmer Opacity</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-focusOpacity" min="0.1" max="1.0" step="0.1" value="${CFG.focusOpacity}" oninput="document.getElementById('val-opacity').innerText=Math.round(this.value*100)+'%'"><span id="val-opacity" class="tr-range-val">${Math.round(CFG.focusOpacity*100)}%</span></div></div>
                            </div>
                        </div>
                        <div id="tab-behavior" class="tr-tab-pane">
                            <div class="tr-group">
                                <div class="tr-group-title">Info</div>
                                <div class="tr-row"><div><div class="tr-label">Show Live WPM</div></div><label class="tr-switch"><input type="checkbox" id="cfg-showLiveWpm" ${CFG.showLiveWpm ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div><div class="tr-label">Consistent Color</div><span class="tr-sublabel">Disable rainbow WPM</span></div><label class="tr-switch"><input type="checkbox" id="cfg-wpmColorMatch" ${CFG.wpmColorMatch ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div><div class="tr-label">WPM Size</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-wpmFontSize" min="10" max="80" value="${CFG.wpmFontSize}" oninput="document.getElementById('val-wpmSize').innerText=this.value"><span id="val-wpmSize" class="tr-range-val">${CFG.wpmFontSize}</span></div></div>
                                <div class="tr-row"><div><div class="tr-label">WPM Rate</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-wpmUpdateInterval" min="0" max="5000" step="100" value="${CFG.wpmUpdateInterval}" oninput="document.getElementById('val-wpmRate').innerText=this.value"><span id="val-wpmRate" class="tr-range-val">${CFG.wpmUpdateInterval}</span></div></div>
                            </div>
                            <div class="tr-group">
                                <div class="tr-group-title">Pacemaker</div>
                                <div class="tr-row"><div><div class="tr-label">Enable</div></div><label class="tr-switch"><input type="checkbox" id="cfg-pacemakerMode" ${CFG.pacemakerMode ? 'checked' : ''}><span class="tr-slider"></span></label></div>
                                <div class="tr-row"><div class="tr-label">Ghost Speed</div><input type="number" class="tr-input-num-small" id="cfg-pacemakerWpm" value="${CFG.pacemakerWpm}"></div>
                                <div class="tr-row"><div class="tr-label">Ghost Color</div><input type="color" class="tr-input-color" id="cfg-pacemakerColor" value="${CFG.pacemakerColor}"></div>
                            </div>
                            <div class="tr-group">
                                <div class="tr-group-title">Animation</div>
                                <div class="tr-row"><div><div class="tr-label">Smoothness</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-smoothness" min="0" max="50" step="0.1" value="${CFG.smoothness}" oninput="document.getElementById('val-smooth').innerText=this.value"><span id="val-smooth" class="tr-range-val">${CFG.smoothness}</span></div></div>
                                <div class="tr-row"><div><div class="tr-label">Opacity</div></div><div class="tr-slider-container"><input type="range" class="tr-range" id="cfg-windowOpacity" min="0" max="100" step="1" value="${CFG.windowOpacity}" oninput="document.getElementById('val-opac').innerText=this.value"><span id="val-opac" class="tr-range-val">${CFG.windowOpacity}</span></div></div>
                            </div>
                            <div class="tr-group"><div class="tr-group-title">Reset</div><div class="tr-row"><button class="tr-btn tr-btn-ghost" id="tr-btn-reset" style="width:100%">Reset All</button></div></div>
                        </div>
                        <div id="tab-about" class="tr-tab-pane">
                            <div class="tr-group">
                                <div class="tr-group-title">Credits</div>
                                <div onclick="window.open('https://www.youtube.com/@miyakejima1','_blank')" class="tr-credit-card">
                                    <div class="tr-credit-role">Creator</div>
                                    <div class="tr-credit-name">miyakejima</div>
                                    <div class="tr-credit-sub">Concept & Design</div>
                                </div>
                                <div onclick="window.open('https://github.com/PoemOnTyperacer/','_blank')" class="tr-credit-card">
                                    <div class="tr-credit-role">Pacemaker Concept</div>
                                    <div class="tr-credit-name">PoemOnTyperacer</div>
                                    <div class="tr-credit-sub">Ghost Logic Inspiration</div>
                                </div>
                                <div onclick="window.open('https://github.com/altrocality','_blank')" class="tr-credit-card">
                                    <div class="tr-credit-role">Countdown Logic</div>
                                    <div class="tr-credit-name">Altrocality</div>
                                    <div class="tr-credit-sub">Semaphore Timing</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tr-footer"><button class="tr-btn tr-btn-ghost" id="tr-btn-cancel">Cancel</button><button class="tr-btn tr-btn-primary" id="tr-btn-save">Save</button></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const tabs=overlay.querySelectorAll('.tr-tab-btn'); const panes=overlay.querySelectorAll('.tr-tab-pane');
        tabs.forEach(tab=>{ tab.addEventListener('click',()=>{ tabs.forEach(t=>t.classList.remove('active')); panes.forEach(p=>p.classList.remove('active')); tab.classList.add('active'); document.getElementById(tab.dataset.tab).classList.add('active'); }); });
        document.getElementById('tr-btn-save').onclick=()=>{
            CFG.coverMode=document.getElementById('cfg-coverMode').checked; CFG.smartLock=document.getElementById('cfg-smartLock').checked;
            CFG.hideInput=document.getElementById('cfg-hideInput').checked; CFG.manualPositioning=document.getElementById('cfg-manualPositioning').checked;
            CFG.hideRaceTrack=document.getElementById('cfg-hideRaceTrack').checked;
            CFG.tapeWidth=parseInt(document.getElementById('cfg-tapeWidth').value);
            CFG.tapeHeight=parseInt(document.getElementById('cfg-tapeHeight').value);
            CFG.fontSize=parseInt(document.getElementById('cfg-fontSize').value); CFG.fontWeight=parseInt(document.getElementById('cfg-fontWeight').value);
            CFG.fontFamily=document.getElementById('cfg-fontFamily').value;
            CFG.showCaret=document.getElementById('cfg-showCaret').checked; CFG.cursorWidth=parseInt(document.getElementById('cfg-cursorWidth').value);
            CFG.bg=document.getElementById('cfg-bg').value; CFG.textMain=document.getElementById('cfg-textMain').value; CFG.textCorrect=document.getElementById('cfg-textCorrect').value; CFG.textError=document.getElementById('cfg-textError').value;
            CFG.cursorColor=document.getElementById('cfg-cursorColor').value;
            CFG.pacemakerMode=document.getElementById('cfg-pacemakerMode').checked; CFG.pacemakerWpm=parseInt(document.getElementById('cfg-pacemakerWpm').value); CFG.pacemakerColor=document.getElementById('cfg-pacemakerColor').value;
            CFG.smoothness=parseFloat(document.getElementById('cfg-smoothness').value); CFG.windowOpacity=parseInt(document.getElementById('cfg-windowOpacity').value);
            CFG.showLiveWpm=document.getElementById('cfg-showLiveWpm').checked; CFG.wpmUpdateInterval=parseInt(document.getElementById('cfg-wpmUpdateInterval').value);
            CFG.wpmColorMatch=document.getElementById('cfg-wpmColorMatch').checked;
            CFG.showProgressBar=document.getElementById('cfg-showProgressBar').checked;
            CFG.particleMode=document.getElementById('cfg-particleMode').checked;
            CFG.dynamicLighting=document.getElementById('cfg-dynamicLighting').checked;
            CFG.focusMode=document.getElementById('cfg-focusMode').checked;
            CFG.focusOpacity=parseFloat(document.getElementById('cfg-focusOpacity').value);
            CFG.wpmFontSize=parseInt(document.getElementById('cfg-wpmFontSize').value);

            saveConfig(); updateGameStyles(); if(state.activeText&&state.dom.strip){buildStrip(state.activeText);} toggleMenu();
        };
        document.getElementById('tr-btn-cancel').onclick=toggleMenu;
        document.getElementById('tr-btn-reset').onclick=()=>{if(confirm('Reset?')){localStorage.removeItem('tr_tape_config');location.reload();}};
    }

    function applyMenuStyles() {
        const menuCSS = `
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: #050505; }
            ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #555; }

            #tr-ui-btn { position: fixed; bottom: 30px; right: 30px; width: 50px; height: 50px; background: #111; color: #eee; border-radius: 50%; border: 2px solid #333; display: flex;
            justify-content: center; align-items: center; font-size: 24px; cursor: pointer; z-index: 1000000; opacity: 0.5; transition: all 0.2s ease;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
            #tr-ui-btn:hover { opacity: 1; transform: scale(1.1) rotate(90deg); border-color: #fff; }
            #tr-ui-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(3px); z-index: 1000001; display: none; justify-content: center; align-items: center; }

            #tr-ui-modal {
                box-sizing: border-box;
                width: 800px; max-width: 90vw;
                height: 600px; max-height: 85vh;
                background: #0a0a0a; border: 1px solid #333; border-radius: 12px; display: flex; flex-direction: row;
                box-shadow: 0 20px 50px rgba(0,0,0,0.9); font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; color: #eee; font-size: 14px; overflow: hidden;
            }

            .tr-sidebar { box-sizing: border-box; flex: 0 0 180px; background: #050505; border-right: 1px solid #222; padding: 1rem 0; display: flex; flex-direction: column; overflow-y: auto; }
            .tr-sidebar-header { padding: 0 1.2rem 1.2rem 1.2rem; font-size: 1.1rem; font-weight: bold; color: #fff; border-bottom: 1px solid #222; margin-bottom: 0.5rem; }
            .tr-tab-btn { padding: 0.8rem 1.2rem; cursor: pointer; color: #666; transition: 0.2s; font-size: 0.9rem; border-left: 3px solid transparent; }
            .tr-tab-btn:hover { background: #111; color: #fff; }
            .tr-tab-btn.active { background: #111; color: #fff; border-left-color: #fff; }

            .tr-main-view { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

            .tr-content { box-sizing: border-box; flex: 1; padding: 2rem; overflow-y: auto; position: relative; }
            .tr-tab-pane { display: none; width: 100%; }
            .tr-tab-pane.active { display: block; animation: tr-fade 0.3s; }
            @keyframes tr-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

            .tr-group { margin-bottom: 1.5rem; }
            .tr-group-title { font-size: 0.75rem; text-transform: uppercase; color: #444; letter-spacing: 1px; margin-bottom: 1rem; border-bottom: 1px solid #222; padding-bottom: 0.3rem; }
            .tr-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px; }
            .tr-label { font-size: 0.9rem; color: #ccc; }
            .tr-sublabel { font-size: 0.7rem; color: #666; display: block; margin-top: 2px; }
            .tr-slider-container { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 150px; justify-content: flex-end; }
            .tr-range { flex: 1; max-width: 150px; cursor: pointer; accent-color: #fff; }
            .tr-range-val { font-family: monospace; font-size: 0.8rem; color: #fff; width: 35px; text-align: right; }
            .tr-select { background: #111; border: 1px solid #444; color: #fff; padding: 4px; border-radius: 4px; width: 100%; max-width: 200px; }
            .tr-input-color { -webkit-appearance: none; border: none; width: 30px; height: 30px; background: none; cursor: pointer; }
            .tr-input-color::-webkit-color-swatch-wrapper { padding: 0; }
            .tr-input-color::-webkit-color-swatch { border: 2px solid #444; border-radius: 50%; }
            .tr-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
            .tr-switch input { opacity: 0; width: 0; height: 0; }
            .tr-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 34px; }
            .tr-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .tr-slider { background-color: #888; }
            input:checked + .tr-slider:before { transform: translateX(20px); background-color: #fff; }

            .tr-footer { flex: 0 0 auto; padding: 1rem 2rem; border-top: 1px solid #222; display: flex; justify-content: flex-end; gap: 10px; background: #0a0a0a; }
            .tr-btn { padding: 0.5rem 1.2rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; border: 1px solid transparent; font-weight: 600; }
            .tr-btn-ghost { background: transparent; color: #888; border-color: #333; }
            .tr-btn-ghost:hover { border-color: #666; color: #fff; }
            .tr-btn-primary { background: #eee; color: #000; }
            .tr-btn-primary:hover { background: #fff; }
            .tr-input-num-small { background: #222; border: 1px solid #444; color: #fff; padding: 4px; width: 50px; text-align: center; border-radius: 4px; }

            /* Fancy Credits */
            .tr-credit-card {
                background: #111; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;
                cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 4px;
            }
            .tr-credit-card:hover {
                background: #161616; border-color: #666; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            }
            .tr-credit-role { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #666; }
            .tr-credit-name { font-size: 1.1rem; font-weight: bold; color: #fff; }
            .tr-credit-sub { font-size: 0.85rem; color: #888; font-style: italic; }
        `;
        let styleEl = document.getElementById('tr-menu-css');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'tr-menu-css';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = menuCSS;
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

        const dimmer = document.createElement('div');
        dimmer.id = 'tr-focus-dimmer';
        document.body.appendChild(dimmer);
        state.dom.dimmer = dimmer;

        const overlay = document.createElement('div');
        overlay.id = 'tr-tape-overlay';

        const windowDiv = document.createElement('div');
        windowDiv.id = 'tr-tape-window';
        overlay.appendChild(windowDiv);
        state.dom.window = windowDiv;
        const wpmBox = document.createElement('div');
        wpmBox.id = 'tr-live-wpm';
        wpmBox.innerText = "0";
        overlay.appendChild(wpmBox);
        state.dom.wpm = wpmBox;

        const mask = document.createElement('div');
        mask.id = 'tr-tape-mask';
        windowDiv.appendChild(mask);

        const progress = document.createElement('div');
        progress.id = 'tr-progress-bar';
        progress.style.display = CFG.showProgressBar ? 'block' : 'none';
        windowDiv.appendChild(progress);
        state.dom.progress = progress;

        const cursor = document.createElement('div');
        cursor.id = 'tr-tape-cursor';
        mask.appendChild(cursor);

        const strip = document.createElement('div');
        strip.id = 'tr-tape-strip';
        mask.appendChild(strip);

        const ghost = document.createElement('div');
        ghost.id = 'tr-tape-ghost';
        ghost.style.display = CFG.pacemakerMode ? 'block' : 'none';
        strip.appendChild(ghost);
        state.dom.ghost = ghost;

        document.body.appendChild(overlay);
        state.dom.tape = overlay;
        state.dom.strip = strip;
        makeDraggable(overlay);
    }

    function buildStrip(text) {
        const strip = state.dom.strip;
        const ghost = state.dom.ghost;
        strip.innerHTML = '';
        if(ghost) strip.appendChild(ghost);

        state.charWidths = [];
        state.dom.spans = [];

        strip.style.fontFamily = CFG.fontFamily;
        strip.style.fontSize = CFG.fontSize + 'px';
        strip.style.fontWeight = CFG.fontWeight;
        strip.style.letterSpacing = CFG.letterSpacing + 'px';
        strip.style.transition = `transform ${CFG.smoothness}s cubic-bezier(0.25, 1, 0.5, 1)`;

        const fragment = document.createDocumentFragment();
        text.split('').forEach(char => {
            const s = document.createElement('span');
            s.textContent = char;
            s.className = 'tr-char';
            fragment.appendChild(s);
            state.dom.spans.push(s);
        });
        strip.appendChild(fragment);

        requestAnimationFrame(() => {
            state.dom.spans.forEach(c => {
                 state.charWidths.push(c.getBoundingClientRect().width);
            });
            update(true);
            sync();
        });
    }

    function sync() {
        if (!state.dom.target || !state.dom.tape || !state.dom.input) return;
        const textRect = state.dom.target.getBoundingClientRect();
        if (textRect.width < 10) { state.dom.tape.style.display = 'none'; return;
        }
        state.dom.tape.style.display = 'flex';

        if(state.dom.ghost) state.dom.ghost.style.display = CFG.pacemakerMode ? 'block' : 'none';
        if(state.dom.progress) state.dom.progress.style.display = CFG.showProgressBar ? 'block' : 'none';

        if (state.dom.wpm) {
             state.dom.wpm.style.opacity = (CFG.showLiveWpm && state.isRacing) ? 1 : 0;
        }

        const bodyRect = document.body.getBoundingClientRect();
        const absTop = textRect.top - bodyRect.top;
        const absLeft = textRect.left - bodyRect.left;

        const h = CFG.tapeHeight;

        if (CFG.coverMode) {
            state.dom.tape.style.left = absLeft + 'px';
            state.dom.tape.style.top = absTop + 'px';
            state.dom.tape.style.width = textRect.width + 'px';
            state.dom.tape.style.height = textRect.height + 'px';
            state.dom.tape.style.transform = 'none';

            state.dom.window.style.height = h + 'px';
            state.dom.window.style.display = 'flex';
            state.dom.window.style.alignItems = 'center';

            state.dom.wpm.style.bottom = '100%';
        } else if (CFG.manualPositioning) {
            state.dom.tape.style.left = CFG.manualX + 'px';
            state.dom.tape.style.top = CFG.manualY + 'px';
            state.dom.tape.style.transform = 'none';
            state.dom.tape.style.height = h + 'px';
            state.dom.tape.style.width = CFG.smartLock ?
            textRect.width + "px" : (CFG.tapeWidthType === '%' ? CFG.tapeWidth + '%' : CFG.tapeWidth + 'px');
            state.dom.window.style.height = '100%';
        } else {
            if (CFG.smartLock) {
                state.dom.tape.style.left = absLeft + "px";
                state.dom.tape.style.width = textRect.width + "px";
                state.dom.tape.style.transform = 'none';
            } else {
                state.dom.tape.style.left = '50%';
                state.dom.tape.style.transform = 'translateX(-50%)';
                state.dom.tape.style.width = (CFG.tapeWidthType === '%' ? CFG.tapeWidth + '%' : CFG.tapeWidth + 'px');
            }
            const centeredTop = absTop + (textRect.height / 2) - (h / 2);
            state.dom.tape.style.top = centeredTop + "px";
            state.dom.tape.style.height = h + "px";
             state.dom.window.style.height = '100%';
        }
    }

    function spawnParticles() {
        if (!state.dom.window) return;
        const count = 3 + Math.floor(Math.random() * 3);
        const rect = state.dom.window.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        for (let i=0; i<count; i++) {
            const p = document.createElement('div');
            p.className = 'tr-particle';
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 20;
            p.style.left = (centerX + offsetX) + 'px';
            p.style.top = (centerY + offsetY) + 'px';

            const angle = Math.random() * Math.PI * 2;
            const velocity = 20 + Math.random() * 30;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            p.style.transition = `transform 0.5s ease-out, opacity 0.5s ease-out`;

            state.dom.window.appendChild(p);

            requestAnimationFrame(() => {
                p.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
                p.style.opacity = '0';
            });

            setTimeout(() => { p.remove(); }, 500);
        }
    }

    function updateDynamicLighting() {
        const overlay = state.dom.tape;
        if (!overlay) return;

        if (!CFG.dynamicLighting) {
             overlay.style.boxShadow = '';
             return;
        }

        const wpm = state.currentWpm || 0;
        const intensity = Math.min(wpm / 4, 50);

        let color = '#ffffff';
        if (state.semaphoreState === 'green') color = '#33ff33';
        else if (state.semaphoreState === 'red') color = '#ff3333';
        else if (state.semaphoreState === 'yellow') color = '#ffcc00';

        const alpha = Math.min(0.2 + (wpm / 200), 0.8);

        overlay.style.boxShadow = `0 0 ${intensity}px ${color}, 0 4px 15px rgba(0,0,0,0.5)`;
    }

    function updateFocusMode() {
        if (!state.dom.dimmer) return;

        state.dom.dimmer.style.backgroundColor = `rgba(0,0,0, ${CFG.focusOpacity})`;

        if (CFG.focusMode && state.isRacing && !state.tempFocusDisabled) {
            state.dom.dimmer.classList.add('active');
        } else {
            state.dom.dimmer.classList.remove('active');
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (CFG.focusMode && state.isRacing && !state.tempFocusDisabled) {
                state.tempFocusDisabled = true;
                updateFocusMode();
            }
        }
    });

    function countGreenChars(targetDiv) {
        if (!targetDiv) return 0;
        let count = 0;
        const spans = targetDiv.querySelectorAll('span');
        for (let i = 0; i < spans.length; i++) {
            const s = spans[i];
            const style = (s.getAttribute('style') || "").toLowerCase();
            if (style.includes('color') && !style.includes('red') && (style.includes('green') || style.includes('#00'))) {
                count += s.textContent.length;
            }
        }
        return count;
    }

    function update(forceReset = false) {
        if (!state.dom.input || !state.dom.strip) return;
        let inputVal = normalize(state.dom.input.value);

        if (!state.isReady && !forceReset) {
            if (inputVal === "") {
                state.isReady = true;
                state.isRacing = false; state.startTime = null;
                if(state.dom.ghost) state.dom.ghost.style.transform = `translateX(0px)`;
                if(state.dom.wpm) state.dom.wpm.innerText = "0";
                if(state.dom.progress) state.dom.progress.style.width = "0%";
            } else {
                state.dom.strip.style.transform = `translateX(0px)`;
                return;
            }
        }

        if (state.isReady && inputVal.length > 0 && !state.isRacing) {
            state.isRacing = true;
            state.startTime = Date.now(); state.lastWpmUpdate = Date.now();
        }

        if (forceReset) {
            state.committedIndex = 0;
            state.lastInputVal = ""; inputVal = "";
            state.isRacing = false; state.startTime = null;
            if(state.dom.wpm) state.dom.wpm.innerText = "0";
            if(state.dom.progress) state.dom.progress.style.width = "0%";
            state.currentWpm = 0;
        }

        if (inputVal.length > state.lastInputVal.length) {
            if (CFG.particleMode) spawnParticles();
        }

        if (inputVal.length === 0 && state.lastInputVal.length > 0) {
            const remainingText = state.activeText.substring(state.committedIndex);
            const nextSpaceIndex = remainingText.indexOf(' ');
            const wordEndIndex = (nextSpaceIndex === -1) ? remainingText.length : nextSpaceIndex + 1;
            const expectedWord = remainingText.substring(0, wordEndIndex);
            const cleanLast = state.lastInputVal.trim();
            const cleanExpected = expectedWord.trim();
            if (cleanLast === cleanExpected) {
                state.committedIndex += expectedWord.length;
            } else {
                const confirmed = countGreenChars(state.dom.target);
                if (confirmed > state.committedIndex) state.committedIndex = confirmed;
            }
        } else if (inputVal.length < state.lastInputVal.length) {
            const isManualDelete = state.lastInputType && state.lastInputType.toLowerCase().includes('delete');
            if (!isManualDelete) {
                const expectedSegment = state.activeText.substring(state.committedIndex);
                if (expectedSegment.startsWith(state.lastInputVal) || expectedSegment.startsWith(state.lastInputVal.trim())) {
                    let nextSpace = state.activeText.indexOf(' ', state.committedIndex);
                    if (nextSpace === -1) nextSpace = state.activeText.length;
                    else nextSpace += 1;
                    state.committedIndex = nextSpace;
                }
            }
        }

        state.lastInputVal = inputVal;
        const totalIndex = state.committedIndex + inputVal.length;
        const spans = state.dom.spans;
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
                const newClass = isCorrect ?
                'tr-char c' : 'tr-char e';
                if (span.className !== newClass) span.className = newClass;
                offsetPixels += width;
            } else {
                if (span.className !== 'tr-char') span.className = 'tr-char';
            }
        }

        if (state.committedIndex > 0) {
             for(let k=0; k<state.committedIndex; k++) {
                 if (spans[k].className !== 'tr-char c') spans[k].className = 'tr-char c';
            }
        }

        state.dom.strip.style.transform = `translate3d(-${offsetPixels}px, 0, 0)`;

        if (state.dom.progress && state.activeText.length > 0) {
            const pct = (totalIndex / state.activeText.length) * 100;
            state.dom.progress.style.width = `${pct}%`;
        }
    }

    function setPhase(phase) {
        if (state.semaphoreState === phase) return;
        state.semaphoreState = phase;
        const target = state.dom.tape;
        if (!target) return;
        target.classList.remove('sema-red', 'sema-yellow', 'sema-green');
        if (phase === 'red') target.classList.add('sema-red');
        else if (phase === 'yellow') target.classList.add('sema-yellow');
        else if (phase === 'green') target.classList.add('sema-green');
    }

    function updateSemaphore() {
        if (state.isRacing) { setPhase('idle'); return;
        }
        const input = state.dom.input;
        if (input && !input.disabled) { setPhase('green'); return;
        }
        const popup = document.querySelector('.countdownPopup');
        if (popup) {
            const text = popup.innerText || "";
            if (text.includes('3') || text.includes(':03') || text.includes('2') || text.includes(':02')) { setPhase('red');
            }
            else if (text.includes('1') || text.includes(':01') || text.includes('Go') || text.includes(':00')) { setPhase('yellow');
            }
            else { setPhase('red');
            }
        } else { setPhase('idle');
        }
    }

    function loop() {
        requestAnimationFrame(loop);
        try {
            const input = document.querySelector('.txtInput');
            const atom = document.querySelector('span[unselectable="on"]');

            const gameStatus = document.querySelector('.gameStatusLabel');
            if (gameStatus && (gameStatus.innerText.includes('You finished') || gameStatus.innerText.includes('The race has ended'))) {
                if (state.dom.tape) state.dom.tape.style.display = 'none';
                if (state.dom.dimmer) state.dom.dimmer.classList.remove('active');
                if (state.dom.target) state.dom.target.style.opacity = '1';
                state.isRacing = false;
                return;
            }

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
                    state.semaphoreState = 'idle';

                    state.tempFocusDisabled = false;

                    createTapeUI();
                    buildStrip(currentText);
                    sync();

                    input.addEventListener('input', (e) => {
                        state.lastInputType = e.inputType || "insertText";
                        update();
                    });
                }

                if (state.activeText) {
                    update();
                    updateSemaphore();
                    updateFocusMode();
                    updateDynamicLighting();

                    if (CFG.pacemakerMode && state.isRacing && state.startTime) {
                        const now = Date.now();
                        const elapsedMinutes = (now - state.startTime) / 1000 / 60;
                        const charsPerMinute = CFG.pacemakerWpm * 5;
                        const targetIndex = charsPerMinute * elapsedMinutes;
                        let ghostPixels = 0;
                        const wholeChars = Math.floor(targetIndex);
                        const fraction = targetIndex - wholeChars;
                        for(let i=0; i<wholeChars && i<state.charWidths.length; i++) ghostPixels += state.charWidths[i];
                        if(wholeChars < state.charWidths.length) ghostPixels += (state.charWidths[wholeChars] * fraction);
                        if(state.dom.ghost) state.dom.ghost.style.transform = `translate3d(${ghostPixels}px, 0, 0)`;
                    } else if (!state.isRacing && state.dom.ghost) {
                        state.dom.ghost.style.transform = `translate3d(0px, 0, 0)`;
                    }

                    const now = Date.now();
                    if (CFG.showLiveWpm && state.isRacing && now - state.lastWpmUpdate > CFG.wpmUpdateInterval) {
                        const elapsedMinutes = (now - state.startTime) / 1000 / 60;
                        if (elapsedMinutes > 0) {
                            const wpm = (state.committedIndex / 5) / elapsedMinutes;
                            const wpmVal = Math.round(wpm);
                            state.currentWpm = wpmVal;
                            if (state.dom.wpm) {
                                state.dom.wpm.innerText = wpmVal;
                                if (CFG.wpmColorMatch) {
                                    state.dom.wpm.style.color = '#eee';
                                } else {
                                    if (wpmVal < 60) state.dom.wpm.style.color = '#fff';
                                    else if (wpmVal < 100) state.dom.wpm.style.color = '#ffeb3b';
                                    else if (wpmVal < 150) state.dom.wpm.style.color = '#00e5ff';
                                    else state.dom.wpm.style.color = '#d500f9';
                                }
                            }
                        }
                        state.lastWpmUpdate = now;
                    }
                }
            } else {
                if (state.dom.tape) state.dom.tape.style.display = 'none';
                if (state.dom.dimmer) state.dom.dimmer.classList.remove('active');
                if (state.dom.target) state.dom.target.style.opacity = '1';
            }
        } catch (err) {
            console.error("TapeMod Loop Error:", err);
        }
    }

    let lastPixelRatio = window.devicePixelRatio;
    const checkZoom = () => {
        if (window.devicePixelRatio !== lastPixelRatio) {
            lastPixelRatio = window.devicePixelRatio;
            if (state.activeText) sync();
        }
        requestAnimationFrame(checkZoom);
    };
    checkZoom();

    setInterval(() => {
        if (state.activeText && state.dom.tape && (CFG.coverMode || CFG.smartLock)) {
            const gameStatus = document.querySelector('.gameStatusLabel');
            if (gameStatus && (gameStatus.innerText.includes('You finished') || gameStatus.innerText.includes('The race has ended'))) return;
            sync();
        }
    }, 200);
    window.addEventListener('resize', () => {
        if (state.activeText) sync();
    });

    loadFonts();
    updateGameStyles();
    applyMenuStyles();
    buildUI();
    loop();

})();
