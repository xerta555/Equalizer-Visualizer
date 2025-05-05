(function () {
  if (!Spicetify || !Spicetify.Player || !Spicetify.React || !Spicetify.ReactDOM) {
    setTimeout(arguments.callee, 1000);
    return;
  }

  const backgroundColor = 'transparent';
  const barCount = 20;
  let barColor = Spicetify.LocalStorage.get('equalizerVisualizer_bar_color') || '255, 165, 0, 0.3';
  let isVisualizerEnabled = Spicetify.LocalStorage.get('equalizerVisualizer_enabled') !== 'false';
  let maxBarHeight = parseInt(Spicetify.LocalStorage.get('equalizerVisualizer_max_height') || '112');
  let originalMaxBarHeight = maxBarHeight;
  let fadeToggleProgress = 1;

  // Variables pour les favoris
  let favoriteColor1 = Spicetify.LocalStorage.get('equalizerVisualizer_favoriteColor1') || '255, 165, 0, 0.3';
  let favoriteColor2 = Spicetify.LocalStorage.get('equalizerVisualizer_favoriteColor2') || '255, 0, 0, 0.3';
  let favoriteColor3 = Spicetify.LocalStorage.get('equalizerVisualizer_favoriteColor3') || '0, 255, 0, 0.3';
  let currentFavoriteIndex = 0; // Pour suivre quel favori sera rempli ensuite (0, 1, ou 2)

  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.bottom = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '80px';
  canvas.style.zIndex = '1';
  canvas.style.pointerEvents = 'none';
  canvas.style.background = backgroundColor;
  canvas.className = 'custom-visualizer';

  function updateCanvasSize(topContainer) {
	  if (!topContainer) {
		return;
	  }

	  const leftSidebar = document.querySelector('#Desktop_LeftSidebar_Id');
	  const mainView = document.querySelector('.Root__main-view');
	  const rightSidebar = document.querySelector('.Root__right-sidebar');
	  if (!leftSidebar || !mainView) {
		setTimeout(() => updateCanvasSize(topContainer), 100);
		return;
	  }

	  const rect = topContainer.getBoundingClientRect();
	  if (canvas.width !== rect.width) {
		canvas.width = rect.width;
		canvas.style.width = `${rect.width}px`;
	  }

	  // Utiliser directement maxBarHeight sans le modifier
	  if (canvas.height !== maxBarHeight) {
		canvas.height = maxBarHeight;
		canvas.style.height = `${maxBarHeight}px`;
	  }
}

  function checkConnectBar() {
    function checkConnectBar() {
	  const topContainer = document.querySelector('.Root__top-container');
	  updateCanvasSize(topContainer);
	}
  }

  let audioAnalysis = null;
  let fadeOutProgress = 1;
  let lastSongUri = null;
  let ctx = null; // Contexte du canvas, sera défini dans initializeVisualizer
  let smoothedAmplitudes = Array(barCount).fill(0); // Déplacer ici
  let lastFrameTime = 0; // Déplacer ici

  function normalizeLoudness(loudness, minLoudness, maxLoudness) {
    if (maxLoudness === minLoudness || maxLoudness === 0) maxLoudness = minLoudness + 1 || 1;
    return Math.max(0, Math.min(1, (loudness - minLoudness) / (maxLoudness - minLoudness))) * 0.6;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function smoothValue(current, newValue, factor = 0.4) { return lerp(current, newValue, easeInOutQuad(1 - factor)); }

  async function fetchAudioAnalysis() {
    if (!Spicetify.Player.data || !Spicetify.Player.data.item || !Spicetify.Player.data.item.uri) {
      audioAnalysis = null;
      return;
    }
    const trackId = Spicetify.URI.fromString(Spicetify.Player.data.item.uri).id;
    try {
      const response = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`);
      audioAnalysis = response && !response.error ? response : null;
    } catch (error) {
      audioAnalysis = null;
    }
  }

  const { React, ReactDOM } = Spicetify;

  class Settings {
    constructor(name, settingsId, initialSettingsFields = {}) {
      this.name = name;
      this.settingsId = settingsId;
      this.settingsFields = initialSettingsFields;
      this.setRerender = null;
    }

    async pushSettings() {
      Object.entries(this.settingsFields).forEach(([key, field]) => {
        if (field.type !== 'button' && this.getFieldValue(key) === undefined) {
          this.setFieldValue(key, field.defaultValue);
        }
      });

      while (!Spicetify?.Platform?.History?.listen) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.stopHistoryListener && this.stopHistoryListener();
      this.stopHistoryListener = Spicetify.Platform.History.listen(location => {
        if (location.pathname === '/preferences') {
          this.render();
        } else {
          this.cleanup();
        }
      });

      if (Spicetify.Platform.History.location.pathname === '/preferences') {
        await this.render();
      }
    }

    render = async () => {
      while (!document.getElementById('desktop.settings.selectLanguage')) {
        if (Spicetify.Platform.History.location.pathname !== '/preferences') return;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const container = document.querySelector('.main-view-container__scroll-node-child main div');
      if (!container) {
        console.error('[Equalizer Visualizer] Settings container not found');
        return;
      }

      let settingsDiv = document.getElementById(this.settingsId);
      if (!settingsDiv) {
        settingsDiv = document.createElement('div');
        settingsDiv.id = this.settingsId;
        container.appendChild(settingsDiv);
      }

      ReactDOM.render(React.createElement(this.FieldsContainer), settingsDiv);
    };

    cleanup() {
      const settingsDiv = document.getElementById(this.settingsId);
      if (settingsDiv && settingsDiv.parentNode) {
        ReactDOM.unmountComponentAtNode(settingsDiv);
        settingsDiv.parentNode.removeChild(settingsDiv);
        console.log(`[Equalizer Visualizer] Settings cleaned up and removed from DOM`);
      }
    }

    addInput(name, description, defaultValue, onChange, inputType = 'text') {
      this.settingsFields[name] = { type: 'input', description, defaultValue, inputType, events: { onChange } };
    }

    addToggle(name, description, defaultValue, onChange) {
      this.settingsFields[name] = { type: 'toggle', description, defaultValue, events: { onChange } };
    }

    getFieldValue(name) {
      return JSON.parse(Spicetify.LocalStorage.get(`${this.settingsId}.${name}`) || '{}')?.value;
    }

    setFieldValue(name, value) {
      Spicetify.LocalStorage.set(`${this.settingsId}.${name}`, JSON.stringify({ value }));
    }

    FieldsContainer = () => {
      const [rerenderKey, setRerender] = React.useState(0);
      this.setRerender = setRerender;

      // Ajouter un useState pour chaque favori pour forcer le re-rendu
      const [fav1, setFav1] = React.useState(favoriteColor1);
      const [fav2, setFav2] = React.useState(favoriteColor2);
      const [fav3, setFav3] = React.useState(favoriteColor3);

      // Synchroniser les valeurs des favoris avec le state local
      React.useEffect(() => {
        setFav1(favoriteColor1);
        setFav2(favoriteColor2);
        setFav3(favoriteColor3);
      }, [favoriteColor1, favoriteColor2, favoriteColor3]);

      return React.createElement(
        'div',
        { className: 'x-settings-section', key: rerenderKey },
        React.createElement('h2', { className: 'TypeElement-cello-textBase-type' }, this.name),
        // Afficher le champ "Couleur des barres" en premier
        React.createElement(this.Field, { nameId: 'barColor', field: this.settingsFields['barColor'] }),
        // Section "Couleurs favorites" juste en dessous
        this.settingsFields['barColor'] && React.createElement(
          'div',
          { className: 'x-settings-row'},
          React.createElement(
            'div',
            { className: 'x-settings-firstColumn' },
            React.createElement('label', { className: 'TypeElement-viola-textSubdued-type' }, 'Couleurs favorites')
          ),
          React.createElement(
            'div',
            { className: 'x-settings-secondColumn', style: { display: 'flex', gap: '10px', flexWrap: 'nowrap' } },
            React.createElement('button', {
              style: {
                padding: '5px 10px',
                background: 'transparent',
                border: '1px solid var(--background-elevated-highlight)',
                borderRadius: '3px',
                color: 'var(--text-base)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              },
              onClick: () => {
                barColor = fav1;
                this.setFieldValue('barColor', barColor);
                this.setRerender(Date.now());
                console.log(`[Equalizer Visualizer] Couleur favorite 1 appliquée : ${barColor}`);
              }
            }, `rgba(${fav1})`),
            React.createElement('button', {
              style: {
                padding: '5px 10px',
                background: 'transparent',
                border: '1px solid var(--background-elevated-highlight)',
                borderRadius: '3px',
                color: 'var(--text-base)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              },
              onClick: () => {
                barColor = fav2;
                this.setFieldValue('barColor', barColor);
                this.setRerender(Date.now());
                console.log(`[Equalizer Visualizer] Couleur favorite 2 appliquée : ${barColor}`);
              }
            }, `rgba(${fav2})`),
            React.createElement('button', {
              style: {
                padding: '5px 10px',
                background: 'transparent',
                border: '1px solid var(--background-elevated-highlight)',
                borderRadius: '3px',
                color: 'var(--text-base)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              },
              onClick: () => {
                barColor = fav3;
                this.setFieldValue('barColor', barColor);
                this.setRerender(Date.now());
                console.log(`[Equalizer Visualizer] Couleur favorite 3 appliquée : ${barColor}`);
              }
            }, `rgba(${fav3})`)
          )
        ),
        // Afficher les autres champs (comme "Hauteur maximale" et "Activer/Désactiver") après
        Object.entries(this.settingsFields)
          .filter(([name]) => name !== 'barColor')
          .map(([name, field]) =>
            React.createElement(this.Field, { nameId: name, field })
          )
      );
    };

    Field = ({ nameId, field }) => {
      const fullId = `${this.settingsId}.${nameId}`;
      let initialValue = field.type === 'button' ? field.value : this.getFieldValue(nameId);
      const [state, setState] = React.useState(initialValue);

      const handleChange = (newValue) => {
        setState(newValue);
        this.setFieldValue(nameId, newValue);
        if (field.events?.onChange) {
          field.events.onChange({ target: { value: newValue, checked: newValue } });
        }
      };

      if (field.type === 'hidden') return null;

      return React.createElement(
        'div',
        { className: 'x-settings-row' },
        React.createElement(
          'div',
          { className: 'x-settings-firstColumn' },
          React.createElement('label', { className: 'TypeElement-viola-textSubdued-type', htmlFor: fullId }, field.description || '')
        ),
        React.createElement(
          'div',
          { className: 'x-settings-secondColumn', style: { display: 'flex', gap: '10px', alignItems: 'center' } },
          nameId === 'barColor' && React.createElement('button', {
            style: {
              padding: '0',
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              color: 'var(--text-base)',
              cursor: 'pointer',
              fontSize: '30px',
              position: 'relative',
              top: '-3px'
            },
            onClick: () => {
              const newState = state;
              if (currentFavoriteIndex === 0) {
                favoriteColor1 = newState;
                Spicetify.LocalStorage.set('equalizerVisualizer_favoriteColor1', favoriteColor1);
                console.log(`[Equalizer Visualizer] Favori 1 mis à jour : ${favoriteColor1}`);
              } else if (currentFavoriteIndex === 1) {
                favoriteColor2 = newState;
                Spicetify.LocalStorage.set('equalizerVisualizer_favoriteColor2', favoriteColor2);
                console.log(`[Equalizer Visualizer] Favori 2 mis à jour : ${favoriteColor2}`);
              } else {
                favoriteColor3 = newState;
                Spicetify.LocalStorage.set('equalizerVisualizer_favoriteColor3', favoriteColor3);
                console.log(`[Equalizer Visualizer] Favori 3 mis à jour : ${favoriteColor3}`);
              }
              currentFavoriteIndex = (currentFavoriteIndex + 1) % 3;
              this.setRerender(Date.now());
            }
          }, '★'),
          field.type === 'input' ? (
            field.inputType === 'button' ? (
              React.createElement('button', {
                className: 'x-settings-button',
                id: fullId,
                style: {
                  padding: '5px 10px',
                  background: 'transparent',
                  border: '1px solid var(--background-elevated-highlight)',
                  borderRadius: '3px',
                  color: 'var(--text-base)',
                  cursor: 'pointer'
                },
                onClick: () => field.events.onChange()
              }, 'Tester')
            ) : (
              React.createElement('input', {
                className: 'x-settings-input',
                id: fullId,
                dir: 'ltr',
                value: state,
                type: field.inputType || 'text',
                onChange: (e) => handleChange(e.target.value),
                onBlur: (e) => {
                  e.target.style.backgroundColor = 'var(--spice-tab-active)';
                },
                style: {
                  backgroundColor: 'var(--spice-tab-active)',
                  boxShadow: 'none',
                  borderRadius: '2px'
                }
              })
            )
          ) : field.type === 'toggle' ? (
            React.createElement(
              'label',
              { className: 'x-toggle-wrapper' },
              React.createElement('input', {
                id: fullId,
                className: 'x-toggle-input',
                type: 'checkbox',
                checked: state,
                onChange: (e) => handleChange(e.target.checked),
              }),
              React.createElement(
                'span',
                { className: 'x-toggle-indicatorWrapper' },
                React.createElement('span', { className: 'x-toggle-indicator' })
              )
            )
          ) : null
        )
      );
    };
  }

  const settings = new Settings('Equalizer Visualizer', 'equalizerVisualizer');
  settings.addInput('barColor', 'Couleur des barres (R,G,B,A)', barColor, (e) => {
    barColor = e.target.value;
    console.log(`[Equalizer Visualizer] Bar color updated to: ${barColor}`);
  }, 'text');
  settings.addInput('maxHeight', 'Hauteur maximale des barres (px)', maxBarHeight, (e) => {
    const newHeight = parseInt(e.target.value) || 112;
    maxBarHeight = newHeight;
    originalMaxBarHeight = newHeight;
    updateCanvasSize(document.querySelector('.Root__top-container'));
    Spicetify.LocalStorage.set('equalizerVisualizer_max_height', maxBarHeight);
    console.log(`[Equalizer Visualizer] Max height updated to: ${maxBarHeight}`);
  }, 'number');
  settings.addInput('testBars', 'Tester l\'affichage des barres à hauteur maximale', null, () => {
    testMaxHeightBars();
  }, 'button');
  settings.addToggle('enabled', 'Activer/Désactiver l’affichage', isVisualizerEnabled, (e) => {
    isVisualizerEnabled = e.target.checked;
    fadeToggleProgress = isVisualizerEnabled ? 1 : 0;
    canvas.style.display = isVisualizerEnabled ? 'block' : 'none';
    if (isVisualizerEnabled) {
      console.log('[Equalizer Visualizer] Attempting to initialize visualizer');
      initializeVisualizer();
    }
    console.log(`[Equalizer Visualizer] Visualiseur ${isVisualizerEnabled ? 'activé' : 'désactivé'} !`);
  });

  let isTesting = false; // Pour éviter les conflits avec l'animation normale

  function testMaxHeightBars() {
	  if (isTesting || !isVisualizerEnabled) return; // Ne rien faire si déjà en test ou désactivé
	  isTesting = true;

	  const startTime = performance.now();
	  const animationDuration = 1500; // 1,5 seconde pour la montée
	  const displayDuration = 3000; // 3 secondes d'affichage à hauteur max
	  const descentDuration = 1500; // 1,5 seconde pour la descente
	  const originalFadeOutProgress = fadeOutProgress; // Sauvegarde l'état actuel

	  function animateBars(timestamp) {
		if (!isTesting) return;

		const progress = Math.min(1, (timestamp - startTime) / animationDuration);
		const height = lerp(0, maxBarHeight, easeInOutQuad(progress));

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (let i = 0; i < barCount; i++) {
		  ctx.fillStyle = `rgba(${barColor})`;
		  ctx.fillRect(i * (canvas.width / barCount), canvas.height - height, (canvas.width / barCount) - 2, height);
		}

		if (progress < 1) {
		  requestAnimationFrame(animateBars);
		} else {
		  // Affichage à hauteur max pendant 3 secondes
		  setTimeout(() => {
			const maxDisplayStart = performance.now();
			function maintainMaxHeight(timestamp) {
			  if (!isTesting) return;

			  ctx.clearRect(0, 0, canvas.width, canvas.height);
			  for (let i = 0; i < barCount; i++) {
				ctx.fillStyle = `rgba(${barColor})`;
				ctx.fillRect(i * (canvas.width / barCount), canvas.height - maxBarHeight, (canvas.width / barCount) - 2, maxBarHeight);
			  }
			  if (performance.now() - maxDisplayStart < displayDuration) {
				requestAnimationFrame(maintainMaxHeight);
			  } else {
				// Début de la descente
				const descentStart = performance.now();
				function animateDescent(timestamp) {
				  if (!isTesting) return;

				  const descentProgress = Math.min(1, (timestamp - descentStart) / descentDuration);
				  const height = lerp(maxBarHeight, 0, easeInOutQuad(descentProgress));

				  ctx.clearRect(0, 0, canvas.width, canvas.height);
				  for (let i = 0; i < barCount; i++) {
					ctx.fillStyle = `rgba(${barColor})`;
					ctx.fillRect(i * (canvas.width / barCount), canvas.height - height, (canvas.width / barCount) - 2, height);
				  }

				  if (descentProgress < 1) {
					requestAnimationFrame(animateDescent);
				  } else {
					isTesting = false;
					fadeOutProgress = Spicetify.Player.isPlaying() ? 1 : originalFadeOutProgress; // Forcer à 1 si la musique joue
					if (ctx) {
					  ctx.clearRect(0, 0, canvas.width, canvas.height); // Effacer le canvas
					}
					// Relancer l'animation principale
					const topContainer = document.querySelector('.Root__top-container');
					if (topContainer && topContainer.contains(canvas)) {
					  requestAnimationFrame(animate); // Relancer l'animation normale
					}
				  }
				}
				requestAnimationFrame(animateDescent);
			  }
			}
			requestAnimationFrame(maintainMaxHeight);
		  }, 0);
		}
	  }

	  fadeOutProgress = 1; // Forcer la visibilité pendant le test
	  requestAnimationFrame(animateBars);
	}

  function animate(timestamp) {
	  const topContainer = document.querySelector('.Root__top-container');
	  if (!topContainer || !topContainer.contains(canvas) || !isVisualizerEnabled || isTesting) {
		if (isTesting) return; // Laisser la fonction testMaxHeightBars gérer l'affichage
		return;
	  }
	  if (timestamp - lastFrameTime < 16) {
		requestAnimationFrame(animate);
		return;
	  }
	  lastFrameTime = timestamp;

	  // Synchroniser la hauteur du canvas avec maxBarHeight
	  if (canvas.height !== maxBarHeight) {
		canvas.height = maxBarHeight;
		canvas.style.height = `${maxBarHeight}px`;
	  }

	  ctx.clearRect(0, 0, canvas.width, canvas.height);

	  const isPlaying = Spicetify.Player.isPlaying();
	  const progress = Spicetify.Player.getProgress() / 1000 || 0;
	  const duration = Spicetify.Player.getDuration() / 1000 || 1;

	  if (isPlaying && progress < duration - 0.5) {
		fadeOutProgress = Math.min(1, fadeOutProgress + 0.03);
	  } else {
		fadeOutProgress = Math.max(0, fadeOutProgress - 0.03);
	  }

	  if (fadeToggleProgress < 1 && isVisualizerEnabled) {
		fadeToggleProgress = Math.min(1, fadeToggleProgress + 0.03);
	  } else if (fadeToggleProgress > 0 && !isVisualizerEnabled) {
		fadeToggleProgress = Math.max(0, fadeToggleProgress - 0.03);
	  }

	  if (fadeOutProgress > 0) {
		let baseAmplitude = 0.3;
		let pitches = Array(12).fill(0.5);
		let timbre = Array(12).fill(0);
		if (audioAnalysis && audioAnalysis.segments) {
		  const segment = audioAnalysis.segments.find(s => progress >= s.start && progress <= s.start + s.duration);
		  if (segment) {
			const minLoudness = Math.min(...audioAnalysis.segments.map(s => Math.max(s.loudness_start, s.loudness_max, s.loudness_end)));
			const maxLoudness = Math.max(...audioAnalysis.segments.map(s => Math.max(s.loudness_start, s.loudness_max, s.loudness_end)));
			baseAmplitude = normalizeLoudness(segment.loudness_max, minLoudness, maxLoudness) || 0.3;
			pitches = segment.pitches || pitches;
			timbre = segment.timbre || timbre;
		  }
		}

		let beatFactor = 1;
		if (audioAnalysis && audioAnalysis.beats) {
		  const beat = audioAnalysis.beats.find(b => progress >= b.start && progress < b.start + (audioAnalysis.beats[1]?.start - audioAnalysis.beats[0]?.start || 1));
		  if (beat) {
			const beatInterval = (audioAnalysis.beats[1]?.start - audioAnalysis.beats[0]?.start) || 1;
			const t = (progress - beat.start) / beatInterval;
			beatFactor = lerp(1.2, 0.9, easeInOutQuad(t));
		  }
		}

		for (let i = 0; i < barCount; i++) {
		  const pitchIndex = Math.floor((i / barCount) * 12);
		  const pitch = pitches[pitchIndex] || 0.5;
		  const tmb = timbre[pitchIndex] || 0;
		  const variation = (pitch + tmb / 100 + Math.random() * 0.05 - 0.025) * 0.1;
		  const rawAmplitude = baseAmplitude * beatFactor + variation;
		  const newAmplitude = Math.min(1, Math.max(0, rawAmplitude)) * fadeOutProgress;
		  smoothedAmplitudes[i] = smoothValue(smoothedAmplitudes[i], newAmplitude, 0.4);
		  const height = Math.min(maxBarHeight, smoothedAmplitudes[i] * maxBarHeight);
		  ctx.fillStyle = `rgba(${barColor})`;
		  ctx.fillRect(i * (canvas.width / barCount), canvas.height - height, (canvas.width / barCount) - 2, height);
		}
	  }
	  requestAnimationFrame(animate);
	}

  requestAnimationFrame(animate);

  settings.pushSettings();

  function initializeVisualizer() {
	  const topContainer = document.querySelector('.Root__top-container');
	  if (!topContainer || !isVisualizerEnabled) {
		return;
	  }

	  topContainer.style.position = 'relative';
	  if (!topContainer.contains(canvas)) {
		topContainer.appendChild(canvas);
	  }

	  ctx = canvas.getContext('2d');
	  if (!ctx) {
		return;
	  }

	  // Forcer la synchronisation de la hauteur du canvas avec maxBarHeight au démarrage
	  canvas.height = maxBarHeight;
	  canvas.style.height = `${maxBarHeight}px`;

	  updateCanvasSize(topContainer);

	  let attempts = 0;
	  const maxAttempts = 50;
	  function ensurePanelsReady() {
		const leftSidebar = document.querySelector('#Desktop_LeftSidebar_Id');
		const mainView = document.querySelector('.Root__main-view');
		if (!leftSidebar || !mainView || attempts >= maxAttempts) {
		  if (attempts < maxAttempts) {
			attempts++;
			setTimeout(ensurePanelsReady, 100);
		  }
		} else {
		  checkConnectBar();
		  updateCanvasSize(topContainer);
		}
	  }
	  ensurePanelsReady();

	  setInterval(checkConnectBar, 1000);

	  const checkPlayerReady = setInterval(() => {
		if (Spicetify.Player.data && Spicetify.Player.data.item && Spicetify.Player.data.item.uri) {
		  fetchAudioAnalysis();
		  clearInterval(checkPlayerReady);
		}
	  }, 250);

	  setTimeout(fetchAudioAnalysis, 2000);
	  Spicetify.Player.addEventListener('songchange', () => {
		if (Spicetify.Player.data.item.uri !== lastSongUri) {
		  fadeOutProgress = 0;
		  lastSongUri = Spicetify.Player.data.item.uri;
		}
		fetchAudioAnalysis();
		checkConnectBar();
	  });
	}

  const observer = new MutationObserver(() => {
    const topContainer = document.querySelector('.Root__top-container');
    if (topContainer && !canvas.parentNode && isVisualizerEnabled) {
      initializeVisualizer();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (document.querySelector('.Root__top-container') && isVisualizerEnabled) {
    initializeVisualizer();
  }
})();