(() => {
  // Reading progress
  const progress = document.getElementById('readingProgress');
  const updateProgress = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
  };
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Semantic ambiguity explorer: different scenes, same geometric occupancy view
  const sceneStates = {
    door: {
      image: 'assets/corridor_door_deck.jpg',
      alt: 'Corridor containing a closed door',
      caption: 'Semantically: a door can indicate connected space beyond.'
    },
    wall: {
      image: 'assets/corridor_wall_deck.jpg',
      alt: 'Corridor in which the same side region is a continuous wall',
      caption: 'Semantically: a wall is a structural boundary.'
    }
  };
  document.querySelectorAll('.meaning-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.meaning-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const d = sceneStates[btn.dataset.scene];
      const img = document.getElementById('sceneImage');
      img.src = d.image;
      img.alt = d.alt;
      document.getElementById('sceneCaption').textContent = d.caption;
    });
  });

  // Method condition explorer using the exact visual examples from the presentation
  const conditions = {
    geometry: {
      input: 'assets/deck_geometry_input.jpg',
      inputAlt: 'Geometry-only occupancy input in which the door is indistinguishable from a wall',
      prediction: 'assets/deck_geometry_prediction.jpg',
      predictionAlt: 'Illustrative geometry-only predictive map terminating at the ambiguous boundary',
      caption: 'The door is encoded exactly like a wall.',
      predictionCaption: 'The predicted layout terminates at the ambiguous boundary in this illustration.',
      chip: 'Geometry only',
      title: 'Same scene, less meaning in the input.',
      text: 'The occupancy input contains no explicit information that the occupied segment is a door rather than a wall.',
      outcome: '<strong>Question:</strong> does adding the door cue change what the predictive map infers beyond that boundary?'
    },
    semantic: {
      input: 'assets/deck_semantic_input.jpg',
      inputAlt: 'Occupancy input with an explicit semantic door cue marked at the door location',
      prediction: 'assets/deck_semantic_prediction.jpg',
      predictionAlt: 'Illustrative semantic-aware predictive map showing connected space beyond the door',
      caption: 'The same geometry now carries an explicit door cue.',
      predictionCaption: 'With the door cue, the illustration continues the prediction into connected space.',
      chip: '+ Door semantics',
      title: 'Same geometry, additional semantic meaning.',
      text: 'The original occupancy input is preserved, while an extra semantic channel identifies the occupied segment as a door.',
      outcome: '<strong>Hypothesis:</strong> semantic meaning can change how a predictive map completes unseen space around geometrically ambiguous structures.'
    }
  };
  const conditionInputImage = document.getElementById('conditionInputImage');
  const conditionPredictionImage = document.getElementById('conditionPredictionImage');
  const conditionCaption = document.getElementById('conditionCaption');
  const predictionCaption = document.getElementById('predictionCaption');
  const conditionChip = document.getElementById('conditionChip');
  const conditionTitle = document.getElementById('conditionTitle');
  const conditionText = document.getElementById('conditionText');
  const conditionOutcome = document.getElementById('conditionOutcome');
  document.querySelectorAll('.method-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.method-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected','false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      const d = conditions[btn.dataset.condition];
      conditionInputImage.src = d.input;
      conditionInputImage.alt = d.inputAlt;
      conditionPredictionImage.src = d.prediction;
      conditionPredictionImage.alt = d.predictionAlt;
      conditionCaption.textContent = d.caption;
      predictionCaption.textContent = d.predictionCaption;
      conditionChip.textContent = d.chip;
      conditionTitle.textContent = d.title;
      conditionText.textContent = d.text;
      conditionOutcome.innerHTML = d.outcome;
      document.getElementById('inputFigure').setAttribute('data-lightbox-src', d.input);
      document.getElementById('predictionFigure').setAttribute('data-lightbox-src', d.prediction);
    });
  });

  // Evidence explorer
  const scopes = {
    full: {
      label: 'Full-map evaluation',
      title: 'Globally, the two models are broadly similar.',
      text: 'The semantic cue is localized, while full-map metrics are dominated by broader layout structure. The semantic-cued model slightly lowers L1, while F1 and IoU are slightly lower.',
      caveat: 'This is important: the paper does not claim that door semantics improve global map completion.',
      vals: ['0.389160','0.388029','0.681828','0.675030','0.517253','0.509469']
    },
    door: {
      label: 'Localized door-region evaluation',
      title: 'Around doors, the prediction changes sharply.',
      text: 'Within the targeted unknown cells around annotated doors, the semantic-cued model recovers the connectivity structure that the geometry-only model largely misses.',
      caveat: 'The mask is small and the evaluation set contains 8 doors. Perfect local F1/IoU is a proof-of-concept result, not a global performance claim.',
      vals: ['0.004342','0.000025','0.031311','1.000000','0.015905','1.000000']
    }
  };
  const ids = ['m1Geo','m1Sem','m2Geo','m2Sem','m3Geo','m3Sem'];
  document.querySelectorAll('.evidence-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.evidence-tab').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('active'); btn.setAttribute('aria-selected','true');
      const d = scopes[btn.dataset.scope];
      document.getElementById('scopeLabel').textContent = d.label;
      document.getElementById('scopeTitle').textContent = d.title;
      document.getElementById('scopeText').textContent = d.text;
      document.getElementById('scopeCaveat').textContent = d.caveat;
      ids.forEach((id, i) => document.getElementById(id).textContent = d.vals[i]);
    });
  });

  // Qualitative explorer
  const quals = {
    geometry: {
      image: 'assets/qual_geometry.png',
      alt: 'Geometry-only qualitative predictive mapping examples',
      caption: 'Geometry-only examples: predicted layouts can terminate at door boundaries.'
    },
    semantic: {
      image: 'assets/qual_semantic.png',
      alt: 'Semantic-cued qualitative predictive mapping examples',
      caption: 'Semantic-cued examples: predicted layouts more consistently continue into connected regions.'
    }
  };
  document.querySelectorAll('.qual-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qual-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const d = quals[btn.dataset.qual];
      const img = document.getElementById('qualImage');
      img.src = d.image; img.alt = d.alt;
      document.getElementById('qualCaption').textContent = d.caption;
      img.closest('[data-lightbox-src]')?.setAttribute('data-lightbox-src', d.image);
    });
  });

  // Lightbox
  const dialog = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const open = src => {
    lightboxImage.src = src;
    if (typeof dialog.showModal === 'function') dialog.showModal();
  };
  document.querySelectorAll('[data-lightbox-src]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      open(el.getAttribute('data-lightbox-src'));
    });
  });
  document.querySelectorAll('[data-open-lightbox]').forEach(btn => btn.addEventListener('click', () => open(btn.dataset.openLightbox)));
  document.getElementById('lightboxClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  // Copy BibTeX
  const copy = document.getElementById('copyBib');
  copy.addEventListener('click', async () => {
    const txt = document.getElementById('bibtex').textContent;
    try {
      await navigator.clipboard.writeText(txt);
      copy.textContent = 'Copied';
      setTimeout(() => copy.textContent = 'Copy BibTeX', 1500);
    } catch {
      copy.textContent = 'Select & copy below';
    }
  });
})();
