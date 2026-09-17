const question = (id, text, quickAnswers = []) => ({ id, text, quickAnswers });

const questions = {
  en: {
    chiefComplaint: question('chiefComplaint', 'What is your main health problem today?', [
      ['Chest pain', '🚨'], ['Fever', '🤒'], ['Cough', '🤧'], ['Stomach pain', '🤢'], ['Headache', '🧠'], ['Vomiting', '🤢'], ['Diarrhea', '💧'], ['Other', '❓']
    ]),
    chestLocation: question('chestLocation', 'Where exactly is the chest pain?'),
    chestStart: question('chestStart', 'When did the chest pain start?'),
    chestSeverity: question('chestSeverity', 'How severe is the chest pain from 1 to 10?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '🚨']]),
    chestSpread: question('chestSpread', 'Does the pain spread to your arm, shoulder, jaw, or back?', [['Yes', '⚠️'], ['No', '👍']]),
    breathing: question('breathing', 'Are you having difficulty breathing?', [['Yes', '🚨'], ['No', '👍']]),
    breathingStart: question('breathingStart', 'When did the breathing difficulty start?'),
    breathingWorse: question('breathingWorse', 'Is the breathing difficulty getting worse?', [['Yes', '🚨'], ['No', '👍']]),
    activity: question('activity', 'Does the chest pain happen during activity or at rest?', [['During activity', '🚶'], ['At rest', '🛋️'], ['Both', '↔️']]),
    feverStart: question('feverStart', 'When did the fever start?'),
    feverTemp: question('feverTemp', 'What was the highest temperature you measured?'),
    feverChills: question('feverChills', 'Do you have chills?', [['Yes', '🥶'], ['No', '👍']]),
    feverCough: question('feverCough', 'Do you have a cough?', [['Yes', '🤧'], ['No', '👍']]),
    feverBodyPain: question('feverBodyPain', 'Do you have body pain?', [['Yes', '😣'], ['No', '👍']]),
    feverMedicine: question('feverMedicine', 'Are you taking any medicine for the fever?'),
    coughDuration: question('coughDuration', 'How long have you had the cough?'),
    coughType: question('coughType', 'Is the cough dry or with mucus?', [['Dry', '💨'], ['With mucus', '🫁']]),
    coughColor: question('coughColor', 'What color is the mucus?'),
    coughFever: question('coughFever', 'Do you have fever with the cough?', [['Yes', '🤒'], ['No', '👍']]),
    coughBreathing: question('coughBreathing', 'Do you have difficulty breathing?', [['Yes', '🚨'], ['No', '👍']]),
    stomachLocation: question('stomachLocation', 'Where is the stomach pain?'),
    stomachStart: question('stomachStart', 'When did the stomach pain start?'),
    stomachSeverity: question('stomachSeverity', 'How severe is the stomach pain from 1 to 10?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '😣']]),
    stomachEating: question('stomachEating', 'Is the pain related to eating?', [['Before eating', '🍽️'], ['After eating', '🍽️'], ['Not related', '👍']]),
    stomachVomiting: question('stomachVomiting', 'Are you having vomiting?', [['Yes', '🤢'], ['No', '👍']]),
    stomachBowels: question('stomachBowels', 'Do you have diarrhea or constipation?', [['Diarrhea', '↘️'], ['Constipation', '↗️'], ['Neither', '👍']]),
    generalConditions: question('generalConditions', 'What previous medical conditions do you have?'),
    medications: question('medications', 'What medicines are you currently taking?'),
    allergies: question('allergies', 'Do you have any drug or food allergies?'),
    surgeries: question('surgeries', 'Have you had any previous surgeries?'),
    familyHistory: question('familyHistory', 'Is there any important family medical history?'),
    lifestyle: question('lifestyle', 'How would you describe your daily lifestyle?'),
    smoking: question('smoking', 'Do you smoke or use tobacco?', [['No', '👍'], ['Sometimes', '🚬'], ['Daily', '🚬']]),
    alcohol: question('alcohol', 'Do you drink alcohol?', [['No', '👍'], ['Sometimes', '🥂'], ['Often', '🥂']]),
    sleep: question('sleep', 'How is your sleep?', [['Good', '😴'], ['Sometimes disturbed', '🌙'], ['Poor', '😟']]),
    relevantSymptoms: question('relevantSymptoms', 'Is there anything else about your symptoms you want the doctor to know?')
    ,generalStart: question('generalStart', 'When did this problem start?')
    ,generalSeverity: question('generalSeverity', 'How severe is it from 1 to 10?')
  },
  te: {
    chiefComplaint: question('chiefComplaint', 'ఈరోజు మీ ప్రధాన ఆరోగ్య సమస్య ఏమిటి?', [['ఛాతి నొప్పి', '🚨'], ['జ్వరం', '🤒'], ['దగ్గు', '🤧'], ['కడుపు నొప్పి', '🤢'], ['తలనొప్పి', '🧠'], ['వాంతులు', '🤢'], ['విరేచనాలు', '💧'], ['ఇతర సమస్య', '❓']]),
    chestLocation: question('chestLocation', 'ఛాతిలో నొప్పి ఖచ్చితంగా ఎక్కడ ఉంది?'),
    chestStart: question('chestStart', 'ఛాతి నొప్పి ఎప్పుడు మొదలైంది?'),
    chestSeverity: question('chestSeverity', 'ఛాతి నొప్పి 1 నుంచి 10లో ఎంత తీవ్రంగా ఉంది?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '🚨']]),
    chestSpread: question('chestSpread', 'నొప్పి చేయి, భుజం, దవడ లేదా వెన్నుకు వ్యాపిస్తుందా?', [['అవును', '⚠️'], ['కాదు', '👍']]),
    breathing: question('breathing', 'మీకు శ్వాస తీసుకోవడంలో ఇబ్బంది ఉందా?', [['అవును', '🚨'], ['కాదు', '👍']]),
    breathingStart: question('breathingStart', 'శ్వాస ఇబ్బంది ఎప్పుడు మొదలైంది?'),
    breathingWorse: question('breathingWorse', 'శ్వాస ఇబ్బంది ఎక్కువ అవుతోందా?', [['అవును', '🚨'], ['కాదు', '👍']]),
    activity: question('activity', 'ఛాతి నొప్పి పని చేస్తున్నప్పుడు వస్తుందా లేదా విశ్రాంతిలోనా?', [['పని చేస్తున్నప్పుడు', '🚶'], ['విశ్రాంతిలో', '🛋️'], ['రెండింటిలో', '↔️']]),
    feverStart: question('feverStart', 'జ్వరం ఎప్పుడు మొదలైంది?'),
    feverTemp: question('feverTemp', 'మీరు కొలిచిన అత్యధిక ఉష్ణోగ్రత ఎంత?'),
    feverChills: question('feverChills', 'మీకు చలి వణుకు ఉందా?', [['అవును', '🥶'], ['కాదు', '👍']]),
    feverCough: question('feverCough', 'మీకు దగ్గు ఉందా?', [['అవును', '🤧'], ['కాదు', '👍']]),
    feverBodyPain: question('feverBodyPain', 'శరీర నొప్పి ఉందా?', [['అవును', '😣'], ['కాదు', '👍']]),
    feverMedicine: question('feverMedicine', 'జ్వరం కోసం ఏదైనా మందు వాడుతున్నారా?'),
    coughDuration: question('coughDuration', 'మీకు దగ్గు ఎంతకాలంగా ఉంది?'),
    coughType: question('coughType', 'దగ్గు పొడిగా ఉందా లేదా కఫంతో ఉందా?', [['పొడి దగ్గు', '💨'], ['కఫంతో', '🫁']]),
    coughColor: question('coughColor', 'కఫం ఏ రంగులో ఉంది?'),
    coughFever: question('coughFever', 'దగ్గుతో పాటు జ్వరం ఉందా?', [['అవును', '🤒'], ['కాదు', '👍']]),
    coughBreathing: question('coughBreathing', 'శ్వాస తీసుకోవడంలో ఇబ్బంది ఉందా?', [['అవును', '🚨'], ['కాదు', '👍']]),
    stomachLocation: question('stomachLocation', 'కడుపులో నొప్పి ఎక్కడ ఉంది?'),
    stomachStart: question('stomachStart', 'కడుపు నొప్పి ఎప్పుడు మొదలైంది?'),
    stomachSeverity: question('stomachSeverity', 'కడుపు నొప్పి 1 నుంచి 10లో ఎంత తీవ్రంగా ఉంది?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '😣']]),
    stomachEating: question('stomachEating', 'నొప్పి తినడంతో సంబంధం ఉందా?', [['తినే ముందు', '🍽️'], ['తిన్న తర్వాత', '🍽️'], ['సంబంధం లేదు', '👍']]),
    stomachVomiting: question('stomachVomiting', 'వాంతులు అవుతున్నాయా?', [['అవును', '🤢'], ['కాదు', '👍']]),
    stomachBowels: question('stomachBowels', 'విరేచనాలు లేదా మలబద్ధకం ఉందా?', [['విరేచనాలు', '↘️'], ['మలబద్ధకం', '↗️'], ['ఏదీ లేదు', '👍']]),
    generalConditions: question('generalConditions', 'మీకు గతంలో ఉన్న వ్యాధులు ఏమిటి?'),
    medications: question('medications', 'ప్రస్తుతం ఏ మందులు వాడుతున్నారు?'),
    allergies: question('allergies', 'మందులు లేదా ఆహారంతో అలర్జీ ఉందా?'),
    surgeries: question('surgeries', 'గతంలో ఏదైనా శస్త్రచికిత్స జరిగిందా?'),
    familyHistory: question('familyHistory', 'కుటుంబంలో ముఖ్యమైన వ్యాధుల చరిత్ర ఉందా?'),
    lifestyle: question('lifestyle', 'మీ రోజువారీ జీవనశైలిని ఎలా చెబుతారు?'),
    smoking: question('smoking', 'మీరు పొగాకు వాడుతారా?', [['లేదు', '👍'], ['కొన్నిసార్లు', '🚬'], ['రోజూ', '🚬']]),
    alcohol: question('alcohol', 'మీరు మద్యం తాగుతారా?', [['లేదు', '👍'], ['కొన్నిసార్లు', '🥂'], ['తరచుగా', '🥂']]),
    sleep: question('sleep', 'మీ నిద్ర ఎలా ఉంది?', [['బాగుంది', '😴'], ['కొన్నిసార్లు ఇబ్బంది', '🌙'], ['బాగోలేదు', '😟']]),
    relevantSymptoms: question('relevantSymptoms', 'మీ లక్షణాల గురించి డాక్టర్ తెలుసుకోవాల్సిన ఇంకేమైనా ఉందా?'),
    generalStart: question('generalStart', 'ఈ సమస్య ఎప్పుడు మొదలైంది?'),
    generalSeverity: question('generalSeverity', 'ఇది 1 నుంచి 10లో ఎంత తీవ్రంగా ఉంది?')
  },
  hi: {
    chiefComplaint: question('chiefComplaint', 'आज आपकी मुख्य स्वास्थ्य समस्या क्या है?', [['सीने में दर्द', '🚨'], ['बुखार', '🤒'], ['खांसी', '🤧'], ['पेट में दर्द', '🤢'], ['सिर दर्द', '🧠'], ['उल्टी', '🤢'], ['दस्त', '💧'], ['अन्य समस्या', '❓']]),
    chestLocation: question('chestLocation', 'सीने में दर्द ठीक कहाँ है?'),
    chestStart: question('chestStart', 'सीने का दर्द कब शुरू हुआ?'),
    chestSeverity: question('chestSeverity', 'सीने का दर्द 1 से 10 में कितना तेज है?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '🚨']]),
    chestSpread: question('chestSpread', 'क्या दर्द हाथ, कंधे, जबड़े या पीठ तक फैलता है?', [['हाँ', '⚠️'], ['नहीं', '👍']]),
    breathing: question('breathing', 'क्या आपको सांस लेने में तकलीफ है?', [['हाँ', '🚨'], ['नहीं', '👍']]),
    breathingStart: question('breathingStart', 'सांस लेने की तकलीफ कब शुरू हुई?'),
    breathingWorse: question('breathingWorse', 'क्या सांस की तकलीफ बढ़ रही है?', [['हाँ', '🚨'], ['नहीं', '👍']]),
    activity: question('activity', 'सीने का दर्द काम करते समय होता है या आराम में?', [['काम करते समय', '🚶'], ['आराम में', '🛋️'], ['दोनों में', '↔️']]),
    feverStart: question('feverStart', 'बुखार कब शुरू हुआ?'),
    feverTemp: question('feverTemp', 'आपने सबसे अधिक तापमान कितना मापा?'),
    feverChills: question('feverChills', 'क्या आपको ठंड लगकर कंपकंपी होती है?', [['हाँ', '🥶'], ['नहीं', '👍']]),
    feverCough: question('feverCough', 'क्या आपको खांसी है?', [['हाँ', '🤧'], ['नहीं', '👍']]),
    feverBodyPain: question('feverBodyPain', 'क्या शरीर में दर्द है?', [['हाँ', '😣'], ['नहीं', '👍']]),
    feverMedicine: question('feverMedicine', 'क्या आप बुखार की कोई दवा ले रहे हैं?'),
    coughDuration: question('coughDuration', 'आपको खांसी कब से है?'),
    coughType: question('coughType', 'खांसी सूखी है या बलगम के साथ?', [['सूखी', '💨'], ['बलगम के साथ', '🫁']]),
    coughColor: question('coughColor', 'बलगम किस रंग का है?'),
    coughFever: question('coughFever', 'क्या खांसी के साथ बुखार है?', [['हाँ', '🤒'], ['नहीं', '👍']]),
    coughBreathing: question('coughBreathing', 'क्या सांस लेने में तकलीफ है?', [['हाँ', '🚨'], ['नहीं', '👍']]),
    stomachLocation: question('stomachLocation', 'पेट में दर्द कहाँ है?'),
    stomachStart: question('stomachStart', 'पेट का दर्द कब शुरू हुआ?'),
    stomachSeverity: question('stomachSeverity', 'पेट का दर्द 1 से 10 में कितना तेज है?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '😣']]),
    stomachEating: question('stomachEating', 'क्या दर्द खाने से जुड़ा है?', [['खाने से पहले', '🍽️'], ['खाने के बाद', '🍽️'], ['संबंध नहीं', '👍']]),
    stomachVomiting: question('stomachVomiting', 'क्या उल्टी हो रही है?', [['हाँ', '🤢'], ['नहीं', '👍']]),
    stomachBowels: question('stomachBowels', 'क्या दस्त या कब्ज है?', [['दस्त', '↘️'], ['कब्ज', '↗️'], ['कुछ नहीं', '👍']]),
    generalConditions: question('generalConditions', 'आपको पहले से कौन सी बीमारियां हैं?'),
    medications: question('medications', 'आप अभी कौन सी दवाएं लेते हैं?'),
    allergies: question('allergies', 'क्या आपको किसी दवा या खाने से एलर्जी है?'),
    surgeries: question('surgeries', 'क्या आपकी पहले कोई सर्जरी हुई है?'),
    familyHistory: question('familyHistory', 'क्या परिवार में कोई महत्वपूर्ण बीमारी रही है?'),
    lifestyle: question('lifestyle', 'आप अपनी रोजमर्रा की जीवनशैली को कैसे बताएंगे?'),
    smoking: question('smoking', 'क्या आप धूम्रपान या तंबाकू का उपयोग करते हैं?', [['नहीं', '👍'], ['कभी-कभी', '🚬'], ['रोज', '🚬']]),
    alcohol: question('alcohol', 'क्या आप शराब पीते हैं?', [['नहीं', '👍'], ['कभी-कभी', '🥂'], ['अक्सर', '🥂']]),
    sleep: question('sleep', 'आपकी नींद कैसी है?', [['अच्छी', '😴'], ['कभी-कभी खराब', '🌙'], ['खराब', '😟']]),
    relevantSymptoms: question('relevantSymptoms', 'क्या आपके लक्षणों के बारे में डॉक्टर को कुछ और बताना है?'),
    generalStart: question('generalStart', 'यह समस्या कब शुरू हुई?'),
    generalSeverity: question('generalSeverity', 'यह 1 से 10 में कितनी तेज है?')
  }
};


// Additional focused HPI questions used by the adaptive engine.
const adaptiveAdditions = {
  en: {
    chestCharacter: question('chestCharacter', 'How would you describe the chest pain?', [['Pressure', '🫀'], ['Burning', '🔥'], ['Sharp', '📍'], ['Other', '❓']]),
    chestActivity: question('chestActivity', 'Does the chest pain happen during activity, at rest, or both?', [['During activity', '🚶'], ['At rest', '🛋️'], ['Both', '↔️']]),
    chestRelief: question('chestRelief', 'What makes the chest pain better or worse?'),
    feverRash: question('feverRash', 'Do you have a new rash with the fever?', [['Yes', '⚠️'], ['No', '👍']]),
    coughBlood: question('coughBlood', 'Have you noticed blood when coughing?', [['Yes', '⚠️'], ['No', '👍']]),
    headacheStart: question('headacheStart', 'When did the headache start?'),
    headacheLocation: question('headacheLocation', 'Where is the headache?'),
    headacheSeverity: question('headacheSeverity', 'How severe is the headache from 1 to 10?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '⚠️']]),
    headacheSudden: question('headacheSudden', 'Did the headache start suddenly and become very severe?', [['Yes', '🚨'], ['No', '👍']]),
    headacheVision: question('headacheVision', 'Do you have new vision changes?', [['Yes', '⚠️'], ['No', '👍']]),
    headacheWeakness: question('headacheWeakness', 'Do you have new weakness, numbness, trouble speaking, or trouble walking?', [['Yes', '🚨'], ['No', '👍']]),
    vomitingStart: question('vomitingStart', 'When did the vomiting start?'),
    vomitingFrequency: question('vomitingFrequency', 'How many times have you vomited recently?'),
    vomitingBlood: question('vomitingBlood', 'Is there blood in the vomit?', [['Yes', '🚨'], ['No', '👍']]),
    stomachPain: question('stomachPain', 'Do you also have stomach or abdominal pain?', [['Yes', '🤢'], ['No', '👍']]),
    diarrheaStart: question('diarrheaStart', 'When did the diarrhea or loose motions start?'),
    diarrheaFrequency: question('diarrheaFrequency', 'How many loose stools have you had recently?'),
    diarrheaBlood: question('diarrheaBlood', 'Is there blood in the stool?', [['Yes', '🚨'], ['No', '👍']]),
    diarrheaVomiting: question('diarrheaVomiting', 'Are you also vomiting?', [['Yes', '🤢'], ['No', '👍']]),
    dehydration: question('dehydration', 'Are you very thirsty, unusually weak, dizzy, or passing much less urine?', [['Yes', '⚠️'], ['No', '👍']]),
    pregnancyPossibility: question('pregnancyPossibility', 'Could you be pregnant?', [['Yes', '⚠️'], ['No', '👍'], ['Not sure', '❓']])
  },
  te: {
    chestCharacter: question('chestCharacter', 'ఛాతి నొప్పి ఎలా ఉంది?', [['బిగుతుగా', '🫀'], ['మంటగా', '🔥'], ['గుచ్చినట్లు', '📍'], ['ఇతరంగా', '❓']]),
    chestActivity: question('chestActivity', 'ఛాతి నొప్పి పని చేస్తున్నప్పుడు వస్తుందా, విశ్రాంతిలోనా, రెండింటిలోనా?', [['పని సమయంలో', '🚶'], ['విశ్రాంతిలో', '🛋️'], ['రెండింటిలో', '↔️']]),
    chestRelief: question('chestRelief', 'ఛాతి నొప్పి ఏం చేస్తే తగ్గుతుంది లేదా పెరుగుతుంది?'),
    feverRash: question('feverRash', 'జ్వరంతో పాటు కొత్త దద్దుర్లు వచ్చాయా?', [['అవును', '⚠️'], ['కాదు', '👍']]),
    coughBlood: question('coughBlood', 'దగ్గినప్పుడు రక్తం కనిపించిందా?', [['అవును', '⚠️'], ['కాదు', '👍']]),
    headacheStart: question('headacheStart', 'తలనొప్పి ఎప్పుడు మొదలైంది?'),
    headacheLocation: question('headacheLocation', 'తలనొప్పి ఎక్కడ ఉంది?'),
    headacheSeverity: question('headacheSeverity', 'తలనొప్పి 1 నుంచి 10లో ఎంత తీవ్రంగా ఉంది?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '⚠️']]),
    headacheSudden: question('headacheSudden', 'తలనొప్పి ఒక్కసారిగా చాలా తీవ్రంగా మొదలైందా?', [['అవును', '🚨'], ['కాదు', '👍']]),
    headacheVision: question('headacheVision', 'కొత్తగా చూపులో మార్పు ఉందా?', [['అవును', '⚠️'], ['కాదు', '👍']]),
    headacheWeakness: question('headacheWeakness', 'కొత్తగా బలహీనత, మొద్దుబారటం, మాట్లాడటంలో లేదా నడవటంలో ఇబ్బంది ఉందా?', [['అవును', '🚨'], ['కాదు', '👍']]),
    vomitingStart: question('vomitingStart', 'వాంతులు ఎప్పుడు మొదలయ్యాయి?'),
    vomitingFrequency: question('vomitingFrequency', 'ఇటీవల ఎన్నిసార్లు వాంతులు అయ్యాయి?'),
    vomitingBlood: question('vomitingBlood', 'వాంతిలో రక్తం ఉందా?', [['అవును', '🚨'], ['కాదు', '👍']]),
    stomachPain: question('stomachPain', 'కడుపు నొప్పి కూడా ఉందా?', [['అవును', '🤢'], ['కాదు', '👍']]),
    diarrheaStart: question('diarrheaStart', 'విరేచనాలు ఎప్పుడు మొదలయ్యాయి?'),
    diarrheaFrequency: question('diarrheaFrequency', 'ఇటీవల ఎన్నిసార్లు విరేచనాలు అయ్యాయి?'),
    diarrheaBlood: question('diarrheaBlood', 'మలంలో రక్తం ఉందా?', [['అవును', '🚨'], ['కాదు', '👍']]),
    diarrheaVomiting: question('diarrheaVomiting', 'వాంతులు కూడా అవుతున్నాయా?', [['అవును', '🤢'], ['కాదు', '👍']]),
    dehydration: question('dehydration', 'చాలా దాహం, ఎక్కువ బలహీనత, తల తిరగడం లేదా మూత్రం చాలా తక్కువగా రావడం ఉందా?', [['అవును', '⚠️'], ['కాదు', '👍']]),
    pregnancyPossibility: question('pregnancyPossibility', 'మీరు గర్భవతిగా ఉండే అవకాశం ఉందా?', [['అవును', '⚠️'], ['కాదు', '👍'], ['తెలియదు', '❓']])
  },
  hi: {
    chestCharacter: question('chestCharacter', 'सीने का दर्द कैसा है?', [['दबाव जैसा', '🫀'], ['जलन', '🔥'], ['चुभने जैसा', '📍'], ['अन्य', '❓']]),
    chestActivity: question('chestActivity', 'सीने का दर्द काम करते समय, आराम में या दोनों में होता है?', [['काम करते समय', '🚶'], ['आराम में', '🛋️'], ['दोनों में', '↔️']]),
    chestRelief: question('chestRelief', 'सीने का दर्द किससे कम या ज्यादा होता है?'),
    feverRash: question('feverRash', 'क्या बुखार के साथ नया दाने/रैश हुआ है?', [['हाँ', '⚠️'], ['नहीं', '👍']]),
    coughBlood: question('coughBlood', 'क्या खांसते समय खून आया है?', [['हाँ', '⚠️'], ['नहीं', '👍']]),
    headacheStart: question('headacheStart', 'सिर दर्द कब शुरू हुआ?'),
    headacheLocation: question('headacheLocation', 'सिर में दर्द कहाँ है?'),
    headacheSeverity: question('headacheSeverity', 'सिर दर्द 1 से 10 में कितना तेज है?', [['1–3', '🙂'], ['4–6', '😐'], ['7–10', '⚠️']]),
    headacheSudden: question('headacheSudden', 'क्या सिर दर्द अचानक बहुत तेज शुरू हुआ?', [['हाँ', '🚨'], ['नहीं', '👍']]),
    headacheVision: question('headacheVision', 'क्या अचानक नजर में बदलाव हुआ है?', [['हाँ', '⚠️'], ['नहीं', '👍']]),
    headacheWeakness: question('headacheWeakness', 'क्या नई कमजोरी, सुन्नपन, बोलने या चलने में परेशानी है?', [['हाँ', '🚨'], ['नहीं', '👍']]),
    vomitingStart: question('vomitingStart', 'उल्टी कब शुरू हुई?'),
    vomitingFrequency: question('vomitingFrequency', 'हाल में कितनी बार उल्टी हुई?'),
    vomitingBlood: question('vomitingBlood', 'क्या उल्टी में खून है?', [['हाँ', '🚨'], ['नहीं', '👍']]),
    stomachPain: question('stomachPain', 'क्या पेट में दर्द भी है?', [['हाँ', '🤢'], ['नहीं', '👍']]),
    diarrheaStart: question('diarrheaStart', 'दस्त कब शुरू हुए?'),
    diarrheaFrequency: question('diarrheaFrequency', 'हाल में कितनी बार दस्त हुए?'),
    diarrheaBlood: question('diarrheaBlood', 'क्या मल में खून है?', [['हाँ', '🚨'], ['नहीं', '👍']]),
    diarrheaVomiting: question('diarrheaVomiting', 'क्या उल्टी भी हो रही है?', [['हाँ', '🤢'], ['नहीं', '👍']]),
    dehydration: question('dehydration', 'क्या बहुत प्यास, ज्यादा कमजोरी, चक्कर या बहुत कम पेशाब हो रहा है?', [['हाँ', '⚠️'], ['नहीं', '👍']]),
    pregnancyPossibility: question('pregnancyPossibility', 'क्या गर्भवती होने की संभावना है?', [['हाँ', '⚠️'], ['नहीं', '👍'], ['पता नहीं', '❓']])
  }
};
Object.entries(adaptiveAdditions).forEach(([language, additions]) => Object.assign(questions[language], additions));

// Legacy compatibility exports. The active History page uses adaptiveHistoryEngine.js,
// while these helpers remain available to existing components.
const branchSequences = {
  chest: ['chestLocation', 'chestStart', 'chestCharacter', 'chestSeverity', 'chestSpread', 'breathing', 'chestActivity', 'chestRelief'],
  fever: ['feverStart', 'feverTemp', 'feverChills', 'feverCough', 'feverBodyPain', 'feverRash', 'feverMedicine'],
  cough: ['coughDuration', 'coughType', 'coughColor', 'coughFever', 'coughBreathing', 'coughBlood'],
  stomach: ['stomachLocation', 'stomachStart', 'stomachSeverity', 'stomachEating', 'stomachVomiting', 'stomachBowels'],
  headache: ['headacheStart', 'headacheLocation', 'headacheSeverity', 'headacheSudden', 'headacheVision', 'headacheWeakness'],
  vomiting: ['vomitingStart', 'vomitingFrequency', 'vomitingBlood', 'stomachPain', 'stomachBowels'],
  diarrhea: ['diarrheaStart', 'diarrheaFrequency', 'diarrheaBlood', 'diarrheaVomiting', 'dehydration'],
  general: ['generalStart', 'generalSeverity']
};
const generalSequence = ['generalConditions', 'medications', 'allergies', 'surgeries', 'familyHistory', 'smoking', 'alcohol', 'sleep', 'relevantSymptoms'];

export const getQuestionDefinitions = (language = 'en') => questions[language] || questions.en;

export const getConditionBranch = (answer = '') => {
  const value = answer.toLowerCase();
  if (value.includes('chest') || value.includes('छाती') || value.includes('सीने') || value.includes('ఛాతి')) return 'chest';
  if (value.includes('fever') || value.includes('बुखार') || value.includes('జ్వరం')) return 'fever';
  if (value.includes('cough') || value.includes('खांसी') || value.includes('దగ్గు')) return 'cough';
  if (value.includes('stomach') || value.includes('abdomen') || value.includes('पेट') || value.includes('కడుపు')) return 'stomach';
  if (value.includes('headache') || value.includes('सिर दर्द') || value.includes('తలనొప్పి')) return 'headache';
  if (value.includes('vomit') || value.includes('उल्टी') || value.includes('వాంతి')) return 'vomiting';
  if (value.includes('diarr') || value.includes('दस्त') || value.includes('విరేచన')) return 'diarrhea';
  return 'general';
};

export const getNextQuestionId = (answers, currentQuestionId) => {
  const branch = getConditionBranch(answers.chiefComplaint);
  const sequence = [...(branchSequences[branch] || []), ...generalSequence];
  const index = sequence.indexOf(currentQuestionId);
  return sequence.slice(index + 1).find((id) => !answers[id]) || null;
};

export const isRedFlagAnswer = (answer = '') => {
  const value = answer.toLowerCase();
  return ['difficulty breathing', 'सांस लेने में तकलीफ', 'श्वास', 'శ్వాస', 'unconscious', 'बेहोश', 'అపస్మారక', 'stroke', 'स्ट्रोक', 'పక్షవాతం', 'severe bleeding', 'तेज खून', 'తీవ్ర రక్తస్రావం', 'blood in vomit', 'उल्टी में खून', 'వాంతిలో రక్తం'].some((term) => value.includes(term));
};

export const getQuestion = (language, id) => getQuestionDefinitions(language)[id];
