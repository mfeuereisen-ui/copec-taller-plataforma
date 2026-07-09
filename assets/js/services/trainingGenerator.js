// trainingGenerator.js
// Genera automáticamente material de capacitación a partir del contenido del protocolo.
// Si el protocolo tiene customQuestions[], se incluyen junto con las generadas.

export function generateTraining(protocol) {
  if (!protocol) return null;

  // 1. Pasos críticos: los marcados como alert o que tengan criticalAlerts
  const criticalSteps = (protocol.procedure?.steps || [])
    .filter(s => s.type === 'alert' || (s.criticalAlerts && s.criticalAlerts.length))
    .map(s => ({
      id: s.id,
      title: s.title,
      alerts: s.criticalAlerts || []
    }));

  // 2. Reglas de parada como tarjetas
  const stopRuleCards = (protocol.stopRules || []).map((r, i) => ({
    id: `stop-${i}`,
    text: r
  }));

  // 3. Checklist de comprensión: combinación de verificaciones por paso
  const verificationChecklist = (protocol.procedure?.steps || [])
    .flatMap(s => (s.verifications || []).map(v => ({ step: s.title, item: v })));

  // 4. Preguntas auto-generadas
  const autoQuestions = generateQuestions(protocol);

  // 5. Preguntas personalizadas opcionales del JSON
  const customQuestions = protocol.customQuestions || [];

  return {
    protocolCode: protocol.code,
    protocolTitle: protocol.title,
    criticalSteps,
    stopRuleCards,
    verificationChecklist,
    questions: [...autoQuestions, ...customQuestions]
  };
}

function generateQuestions(protocol) {
  const qs = [];

  // Q1: identificar riesgo de mayor severidad
  const highRisks = (protocol.risks || []).filter(r => r.severity === 'alta');
  if (highRisks.length > 0) {
    const correctRisk = highRisks[0].description;
    const distractors = (protocol.risks || [])
      .filter(r => r.severity !== 'alta')
      .slice(0, 2)
      .map(r => r.description);
    const options = shuffle([correctRisk, ...distractors, 'Ninguno de los anteriores']);
    qs.push({
      id: 'q-risk-high',
      type: 'single-choice',
      question: `¿Cuál de los siguientes es un riesgo crítico del protocolo ${protocol.code}?`,
      options,
      correctIndex: options.indexOf(correctRisk),
      explanation: `Este es un riesgo de severidad ALTA identificado en el protocolo.`
    });
  }

  // Q2: ¿Cuál es una regla de parada?
  if (protocol.stopRules && protocol.stopRules.length >= 1) {
    const correct = protocol.stopRules[0];
    const distractors = [
      'Continuar el trabajo si solo es una falla menor',
      'Llamar al cliente para que decida si seguir',
      'Esperar a que el supervisor termine su turno'
    ];
    const options = shuffle([correct, ...distractors]);
    qs.push({
      id: 'q-stop',
      type: 'single-choice',
      question: `¿En cuál de estas situaciones se debe DETENER inmediatamente la operación?`,
      options,
      correctIndex: options.indexOf(correct),
      explanation: 'Las reglas de parada son no negociables y exigen detener la operación al primer indicio.'
    });
  }

  // Q3: EPP obligatorio
  if (protocol.epp && protocol.epp.length > 0) {
    const obligatorios = protocol.epp.filter(e => e.obligatory).map(e => e.item);
    qs.push({
      id: 'q-epp',
      type: 'multi-choice',
      question: 'Selecciona los elementos de protección personal OBLIGATORIOS para este protocolo:',
      options: [
        ...obligatorios,
        'Casco de soldador',
        'Cinturón de herramientas decorativo'
      ],
      correctIndices: obligatorios.map((_, i) => i),
      explanation: 'Solo los EPP marcados como obligatorios deben usarse siempre.'
    });
  }

  // Q4: primer paso del procedimiento
  if (protocol.procedure?.steps?.length > 0) {
    const first = protocol.procedure.steps[0];
    const others = protocol.procedure.steps.slice(1, 4).map(s => s.title);
    const options = shuffle([first.title, ...others]);
    qs.push({
      id: 'q-first-step',
      type: 'single-choice',
      question: '¿Cuál es el PRIMER paso de este protocolo?',
      options,
      correctIndex: options.indexOf(first.title),
      explanation: 'Comenzar con el paso correcto evita errores graves más adelante.'
    });
  }

  // Q5: contacto de emergencia (si el protocolo menciona números)
  const text = JSON.stringify(protocol);
  if (text.includes('131') || text.includes('132')) {
    qs.push({
      id: 'q-emergency',
      type: 'single-choice',
      question: 'En una emergencia médica, ¿a qué número se debe llamar primero?',
      options: ['132 (Bomberos)', '131 (SAMU)', '133 (Carabineros)', '100 (cualquier número)'],
      correctIndex: 1,
      explanation: 'SAMU (131) atiende emergencias médicas. Bomberos (132) atrapamientos y fuego. Carabineros (133) para seguridad.'
    });
  }

  return qs;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
