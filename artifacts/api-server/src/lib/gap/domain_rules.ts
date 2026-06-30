import type { DomainRulesConfig } from './types';

export const DOMAIN_RULES: DomainRulesConfig = { domains: {
  artificial_intelligence: {
    displayName: "Artificial Intelligence",
    keywords: ["machine learning","deep learning","neural network","artificial intelligence","natural language processing","nlp","computer vision","transformer","bert","gpt","llm","reinforcement learning","classification","regression","clustering","cnn","rnn","lstm","attention mechanism","embedding","generative model","diffusion model","object detection","federated learning","explainable ai","transfer learning","fine-tuning","pre-trained","benchmark dataset","overfitting","gradient","backpropagation","autoencoder","gan","encoder decoder","hyperparameter","optimizer","loss function","model inference"],
    topicKeywords: ["machine learning","deep learning","neural network","classification","prediction model","nlp","language model","computer vision","image recognition","text mining","sentiment analysis","named entity recognition","knowledge graph","chatbot","recommender"],
    forbiddenInGaps: [],
    expectedActors: ["researcher", "data scientist", "engineer", "algorithm", "user", "developer", "stakeholder"],
    expectedConcepts: ["model", "training", "dataset", "accuracy", "inference", "prediction", "architecture", "evaluation", "metrics"],
    genericTemplates: [
      { id: "ai_generic_integration", name: "End-to-End Integration of {primaryTopic}", triggerIfAbsent: ["end-to-end","integration","holistic","system-level"], description: "Studies evaluating {primaryTopic} often isolate algorithmic improvements without assessing end-to-end system integration challenges.", researchQuestions: ["How does the holistic integration of {primaryTopic} into existing AI pipelines affect overall system latency and maintenance overhead?"] }
    ],
    subdomains: {
      ethics_and_evaluation: {
        displayName: "Ethics & Evaluation",
        keywords: ["explainability","interpretability","bias","fairness","robustness","distribution shift"],
        gapDimensions: [
          { id: "ai_interpretability", name: "Model Interpretability and Explainability", triggerIfAbsent: ["explainability","interpretability","explainable","xai","shap","lime","transparency"], description: "The reviewed papers primarily focus on predictive performance metrics while paying insufficient attention to explaining model decisions. In high-stakes deployments of {primaryTopic}, black-box models limit stakeholder trust and regulatory compliance.", researchQuestions: ["How can post-hoc explanation methods (SHAP, LIME) be adapted to serve non-technical end-users in {primaryTopic} applications?","What trade-offs exist between model accuracy and interpretability in {primaryTopic}, and how should practitioners navigate them?"] },
          { id: "ai_bias_fairness", name: "Algorithmic Bias and Fairness", triggerIfAbsent: ["bias","fairness","discrimination","ethics","equitable","protected attribute","demographic"], description: "Studies on {primaryTopic} predominantly optimize for aggregate metrics without evaluating results across demographic subgroups. Systematic bias remains poorly characterized.", researchQuestions: ["What fairness-aware training strategies mitigate performance disparities across demographic groups in {primaryTopic} systems?","How should algorithmic auditing frameworks detect and remediate bias in deployed {primaryTopic} applications?"] },
          { id: "ai_robustness", name: "Robustness Under Distribution Shift", triggerIfAbsent: ["robustness","distribution shift","out-of-distribution","adversarial","domain adaptation"], description: "Benchmark evaluations for {primaryTopic} rarely test behavior under real-world distribution shifts such as domain change or temporal drift.", researchQuestions: ["To what extent do {primaryTopic} models degrade when deployed on data from different time periods or contexts?","What domain adaptation techniques best preserve {primaryTopic} performance when source and target distributions diverge?"] }
        ]
      },
      production_deployment: {
        displayName: "Production Deployment",
        keywords: ["deployment","latency","few-shot","low-resource","scalability","production"],
        gapDimensions: [
          { id: "ai_data_efficiency", name: "Low-Resource and Data-Efficient Learning", triggerIfAbsent: ["few-shot","low-resource","data scarcity","semi-supervised","self-supervised","limited data","zero-shot"], description: "Existing {primaryTopic} work assumes large annotated corpora. Many real-world scenarios face label scarcity that is underaddressed.", researchQuestions: ["How effective are few-shot and zero-shot approaches for {primaryTopic} in label-scarce institutional settings?","Can self-supervised pre-training on domain-unlabeled data improve {primaryTopic} downstream performance?"] },
          { id: "ai_deployment", name: "Production Deployment and Operationalization", triggerIfAbsent: ["deployment","production","latency","real-time","scalability","edge computing","monitoring"], description: "Research on {primaryTopic} predominantly evaluates offline batch scenarios. Operational challenges around latency, model drift, and maintenance in production are underaddressed.", researchQuestions: ["What operational challenges arise when deploying {primaryTopic} systems in resource-constrained production environments?","How should continuous retraining pipelines be designed to sustain {primaryTopic} performance as distributions shift?"] }
        ]
      }
    }
  },
  consumer_behavior: {
    displayName: "Consumer Behavior",
    keywords: ["consumer","purchasing","buying behavior","shopper","purchase decision","willingness to pay","brand loyalty","customer satisfaction","consumer preference","spending pattern","retail","product choice","consumption","impulse buying","price sensitivity","market segment","consumer attitude","buying intention","word of mouth","brand awareness","perceived value","customer experience","online shopping","e-commerce","social media influence","product review"],
    topicKeywords: ["purchasing behavior","consumer attitude","brand loyalty","customer satisfaction","buying intention","willingness to pay","product choice","retail behavior","online shopping","impulse buying","price sensitivity","word of mouth","social media influence","perceived value","customer experience","market segment"],
    forbiddenInGaps: ["neural network","deep learning","machine learning","federated learning","adversarial attack","transformer model","gradient descent","backpropagation","computer vision","image segmentation"],
    expectedActors: ["consumer", "customer", "shopper", "buyer", "retailer", "marketer", "brand"],
    expectedConcepts: ["purchase", "decision", "behavior", "loyalty", "satisfaction", "preference", "price", "market", "advertising"],
    genericTemplates: [
      { id: "cb_generic_mixed_methods", name: "Mixed-Methods Exploration of {primaryTopic}", triggerIfAbsent: ["mixed-methods","qualitative-quantitative","triangulation"], description: "Current literature on {primaryTopic} often relies exclusively on either qualitative surveys or quantitative transaction data, lacking mixed-methods triangulation.", researchQuestions: ["What deeper consumer motivations regarding {primaryTopic} emerge when quantitative transaction logs are triangulated with qualitative ethnographic interviews?"] }
    ],
    subdomains: {
      demographics_and_culture: {
        displayName: "Demographics & Culture",
        keywords: ["cross-cultural","cultural","regional","elderly","low-income","vulnerable","children"],
        gapDimensions: [
          { id: "cb_cross_culture", name: "Cross-Cultural and Regional Consumer Differences", triggerIfAbsent: ["cross-cultural","cultural","regional","country comparison","multicultural","international comparison"], description: "Most {primaryTopic} studies are conducted in single-country or Western-centric contexts. The generalizability of existing models to culturally diverse settings remains largely untested.", researchQuestions: ["How do cultural value dimensions moderate consumer responses to {primaryTopic} across different regional markets?","To what extent can {primaryTopic} behavioral models from Western populations accurately predict behavior in Southeast Asian or emerging-market contexts?"] },
          { id: "cb_vulnerable", name: "Vulnerable Consumer Populations", triggerIfAbsent: ["elderly","low-income","vulnerable","children","disability","marginalized","minority consumer"], description: "{primaryTopic} research predominantly samples university students or average-income adults. Vulnerable segments are dramatically underrepresented.", researchQuestions: ["How do financial constraints shape {primaryTopic} decision-making among low-income households?","What barriers do elderly or digitally-excluded consumers face in {primaryTopic} contexts?"] }
        ]
      },
      psychology_and_dynamics: {
        displayName: "Psychology & Dynamics",
        keywords: ["longitudinal","behavior change","motivation","psychological","emotion","sustainable"],
        gapDimensions: [
          { id: "cb_longitudinal", name: "Longitudinal Behavior Dynamics", triggerIfAbsent: ["longitudinal","panel data","over time","behavior change","temporal","habit formation"], description: "Existing {primaryTopic} research typically captures cross-sectional snapshots. How consumer preferences form, evolve, and reverse over extended time periods is rarely examined.", researchQuestions: ["How does consumer engagement with {primaryTopic} shift following major life events such as income changes or public health crises?","What longitudinal panel designs best capture the trajectory of {primaryTopic} adoption across generational cohorts?"] },
          { id: "cb_psychology", name: "Psychological and Motivational Mechanisms", triggerIfAbsent: ["motivation","psychological","cognitive","emotion","unconscious","heuristic","mental model"], description: "While {primaryTopic} research identifies behavioral patterns, the underlying cognitive biases and emotional triggers driving those patterns are insufficiently examined.", researchQuestions: ["Which cognitive biases most strongly distort consumer decision-making in {primaryTopic} contexts?","How do emotional states at the point of purchase moderate {primaryTopic} behavior?"] },
          { id: "cb_sustainability", name: "Sustainability Intention-Behavior Gap", triggerIfAbsent: ["sustainable","sustainability","green","ethical consumption","eco-friendly","environmental concern"], description: "Despite growing awareness, the gap between consumers stated sustainability intentions and actual {primaryTopic} choices remains understudied.", researchQuestions: ["What structural and psychological barriers prevent consumers from translating sustainable {primaryTopic} intentions into consistent behavior?","How can nudge-based interventions close the sustainability intention-behavior gap in {primaryTopic} contexts?"] }
        ]
      }
    }
  },
  food_science: {
    displayName: "Food Science",
    keywords: ["food","nutrition","diet","dietary","nutrient","protein","carbohydrate","fat","calorie","vitamin","mineral","food processing","fermentation","food safety","food quality","sensory evaluation","texture","flavor","shelf life","preservation","food packaging","functional food","probiotic","antioxidant","food additive","organic food","food labeling","obesity","malnutrition","food security","eating behavior"],
    topicKeywords: ["food safety","nutritional content","food processing","dietary pattern","eating behavior","food quality","food labeling","food security","functional food","fermentation","food packaging","sensory evaluation","shelf life","food additive","probiotic","antioxidant","food waste","sustainable food"],
    forbiddenInGaps: ["neural network","deep learning","transfer learning","adversarial training","federated learning","natural language processing","language model"],
    expectedActors: ["consumer", "participant", "producer", "farmer", "distributor"],
    expectedConcepts: ["nutrition", "diet", "processing", "quality", "safety", "health", "sustainability"],
    genericTemplates: [
      { id: "fs_generic_multidisciplinary", name: "Multidisciplinary Approaches to {primaryTopic}", triggerIfAbsent: ["multidisciplinary","cross-disciplinary","systematic integration"], description: "Research on {primaryTopic} is heavily compartmentalized, lacking a multidisciplinary approach that spans from farm production to dietary health impacts.", researchQuestions: ["How can multidisciplinary frameworks better capture the farm-to-fork impacts of {primaryTopic}?"] }
    ],
    subdomains: {
      nutrition_and_health: {
        displayName: "Nutrition & Health",
        keywords: ["bioavailability","gut microbiome","chronic disease","long-term health","clinical outcome"],
        gapDimensions: [
          { id: "fs_bioavailability", name: "Bioavailability and Nutrient Absorption Mechanisms", triggerIfAbsent: ["bioavailability","absorption","bioactive","gut microbiome","digestibility","bioaccessibility"], description: "Most {primaryTopic} studies characterize nutrient composition but do not examine how processing conditions or gut microbiome variability affect actual nutrient absorption across diverse populations.", researchQuestions: ["How do different {primaryTopic} processing methods (thermal, fermentation, high-pressure) affect key nutrient bioaccessibility in human subjects?","What role does individual gut microbiome variability play in modulating health benefits derived from {primaryTopic}?"] },
          { id: "fs_processing_health", name: "Long-Term Health Impact of Processing", triggerIfAbsent: ["ultra-processed","chronic disease","long-term health","clinical outcome","longitudinal dietary"], description: "Research on {primaryTopic} rarely tracks health outcomes beyond short-term interventions. Cumulative effects of sustained exposure on chronic disease risk are underexplored.", researchQuestions: ["What longitudinal study designs are most appropriate for evaluating chronic health impacts of regular {primaryTopic} consumption over five or more years?","How does dietary pattern diversity moderate the risk associated with {primaryTopic} in populations with pre-existing metabolic conditions?"] }
        ]
      },
      sustainability_and_supply: {
        displayName: "Sustainability & Supply",
        keywords: ["sustainability","supply chain","carbon footprint","food waste"],
        gapDimensions: [
          { id: "fs_sustainability", name: "Environmental Sustainability and Supply Chain", triggerIfAbsent: ["sustainability","supply chain","carbon footprint","environmental impact","food waste","life-cycle"], description: "Environmental dimensions of {primaryTopic} research are underrepresented. Carbon footprint, food waste, and supply chain vulnerability of {primaryTopic} production systems require more rigorous study.", researchQuestions: ["How can life-cycle assessment (LCA) frameworks be applied to benchmark the environmental footprint of {primaryTopic} at different production scales?","What supply chain redesign strategies can reduce food loss in {primaryTopic} without compromising safety or quality?"] }
        ]
      }
    }
  },
  healthcare: {
    displayName: "Healthcare",
    keywords: ["health","patient","clinical","disease","diagnosis","treatment","therapy","hospital","medicine","medical","physician","nurse","drug","medication","symptom","chronic disease","surgery","intervention","rehabilitation","mental health","public health","epidemiology","mortality","morbidity","health outcome","telemedicine","electronic health record","healthcare system","preventive care","vaccine","pandemic","infectious disease","cancer","diabetes"],
    topicKeywords: ["clinical outcome","patient care","disease management","medical intervention","public health","mental health","telemedicine","health literacy","preventive care","chronic disease","patient satisfaction","care quality","treatment efficacy","health equity","epidemiology","rehabilitation","nursing care"],
    forbiddenInGaps: ["transfer learning","adversarial attack","federated learning","GAN","autoencoder","NLP model fine-tuning","computer vision architecture","model backpropagation"],
    expectedActors: ["patient", "physician", "nurse", "clinician", "provider", "caregiver", "policymaker"],
    expectedConcepts: ["treatment", "diagnosis", "therapy", "clinical", "outcome", "intervention", "disease", "health"],
    genericTemplates: [
      { id: "hc_generic_systems", name: "Systems-Level Integration of {primaryTopic}", triggerIfAbsent: ["systems-level","macro-level","healthcare system integration"], description: "Studies typically view {primaryTopic} in isolated clinical scenarios rather than assessing its integration into broader healthcare system architectures.", researchQuestions: ["What structural reforms are required to seamlessly integrate {primaryTopic} into macro-level healthcare systems?"] }
    ],
    subdomains: {
      clinical_outcomes: {
        displayName: "Clinical Outcomes",
        keywords: ["quality of life","patient-reported","longitudinal","post-discharge","survival"],
        gapDimensions: [
          { id: "hc_patient_centered", name: "Patient-Centered Outcomes and Quality of Life", triggerIfAbsent: ["quality of life","patient-reported","patient perspective","patient experience","wellbeing","PRO"], description: "Most {primaryTopic} studies use clinician-defined endpoints. Patient-reported outcomes including quality of life and functional status are systematically underrepresented.", researchQuestions: ["Which validated patient-reported outcome instruments most sensitively capture quality-of-life changes in patients receiving {primaryTopic}?","How do patient preferences influence adherence to {primaryTopic} and how can shared decision-making better integrate them?"] },
          { id: "hc_longitudinal", name: "Long-Term and Post-Discharge Outcomes", triggerIfAbsent: ["longitudinal","long-term outcome","follow-up","recurrence","post-discharge","survival"], description: "Clinical studies on {primaryTopic} typically focus on short-term efficacy. Long-term outcomes including recurrence rates and post-discharge wellbeing are underreported.", researchQuestions: ["What are the five-year outcomes for patients who received {primaryTopic}, and how do they differ by demographic subgroup?","Which post-discharge support structures most effectively prevent {primaryTopic} complications and hospital readmission?"] }
        ]
      },
      public_health_and_equity: {
        displayName: "Public Health & Equity",
        keywords: ["equity","disparity","socioeconomic","implementation","clinical practice"],
        gapDimensions: [
          { id: "hc_health_equity", name: "Health Equity and Outcome Disparities", triggerIfAbsent: ["equity","disparity","inequality","socioeconomic","minority","marginalized","rural health"], description: "{primaryTopic} research predominantly focuses on well-resourced or urban clinical settings. Inequities in access, treatment quality, and outcomes across socioeconomic and geographic strata remain poorly characterized.", researchQuestions: ["How do socioeconomic and geographic factors moderate access to and outcomes of {primaryTopic} across population groups?","What policy mechanisms can most effectively reduce {primaryTopic} outcome disparities between rural and urban healthcare settings?"] },
          { id: "hc_implementation", name: "Real-World Implementation Fidelity", triggerIfAbsent: ["implementation","fidelity","real-world","clinical practice","adoption","healthcare worker"], description: "Evidence for {primaryTopic} largely derives from controlled trial settings. Translation to routine clinical practice where resource constraints and provider variability interact is understudied.", researchQuestions: ["What implementation barriers most consistently prevent adoption of evidence-based {primaryTopic} protocols in under-resourced clinical settings?","How can implementation science frameworks guide the scale-up of {primaryTopic} across diverse health systems?"] }
        ]
      }
    }
  },
  education: {
    displayName: "Education",
    keywords: ["education","learning","teaching","student","teacher","classroom","curriculum","pedagogy","assessment","academic performance","school","university","college","literacy","e-learning","online learning","blended learning","STEM","higher education","instructional design","educational technology","learning outcome","student motivation","student engagement","reading","writing","mathematics","science education","special education","inclusive education","early childhood","vocational training"],
    topicKeywords: ["learning outcome","student engagement","teaching method","curriculum design","educational technology","assessment method","online learning","blended learning","academic performance","instructional strategy","special education","inclusive education","early childhood education","STEM education","higher education","teacher professional development"],
    forbiddenInGaps: ["federated learning","adversarial attack","GAN","autoencoder","gradient descent","backpropagation","model inference"],
    expectedActors: ["student", "teacher", "educator", "learner", "principal", "administrator", "parent"],
    expectedConcepts: ["learning", "curriculum", "pedagogy", "assessment", "school", "instruction", "classroom"],
    genericTemplates: [
      { id: "edu_generic_cross_context", name: "Cross-Contextual Validation of {primaryTopic}", triggerIfAbsent: ["cross-contextual","diverse educational settings","generalizability"], description: "The efficacy of {primaryTopic} is predominantly validated in a narrow range of educational contexts, leaving its generalizability to different school types or grade levels uncertain.", researchQuestions: ["To what extent does the impact of {primaryTopic} generalize across drastically different educational settings and age cohorts?"] }
    ],
    subdomains: {
      pedagogy_and_assessment: {
        displayName: "Pedagogy & Assessment",
        keywords: ["motivation","engagement","assessment validity","measurement","teacher training"],
        gapDimensions: [
          { id: "edu_teacher_development", name: "Teacher Professional Development and Implementation Fidelity", triggerIfAbsent: ["teacher training","professional development","teacher knowledge","teacher readiness","teacher efficacy"], description: "While {primaryTopic} curricula are frequently evaluated on student outcomes, the role of teacher preparation and implementation fidelity receives disproportionately less attention.", researchQuestions: ["What professional development models best equip teachers to implement {primaryTopic} approaches with high fidelity in diverse classrooms?","How does teacher self-efficacy in {primaryTopic} mediate the relationship between instructional method and student outcomes?"] },
          { id: "edu_motivation", name: "Intrinsic Motivation and Long-Term Engagement", triggerIfAbsent: ["motivation","engagement","persistence","dropout","self-determination","gamification","intrinsic"], description: "{primaryTopic} research often measures short-term performance without examining whether interventions build lasting intrinsic motivation beyond the study period.", researchQuestions: ["How do different instructional designs for {primaryTopic} differentially affect students intrinsic motivation?","What factors predict sustained engagement with {primaryTopic} learning environments after formal instruction concludes?"] },
          { id: "edu_assessment", name: "Assessment Validity and Measurement Bias", triggerIfAbsent: ["assessment validity","measurement","standardized test","test bias","evaluation instrument","psychometric"], description: "Assessment instruments used to measure {primaryTopic} outcomes are rarely validated across diverse cultural and linguistic populations, potentially distorting reported findings.", researchQuestions: ["To what extent are existing {primaryTopic} assessment instruments culturally valid for non-Western student populations?","How should {primaryTopic} outcome frameworks be redesigned to capture competencies beyond standardized test performance?"] }
        ]
      },
      educational_equity: {
        displayName: "Educational Equity",
        keywords: ["equity","access","inclusive","marginalized","disability"],
        gapDimensions: [
          { id: "edu_equity", name: "Educational Equity and Access Barriers", triggerIfAbsent: ["equity","access","inclusive","marginalized","disability","low-income","rural education"], description: "{primaryTopic} research is predominantly conducted in well-resourced settings. Experiences of students facing socioeconomic, geographic, linguistic, or physical barriers are systematically underrepresented.", researchQuestions: ["What structural interventions most effectively reduce achievement gaps in {primaryTopic} between students from low-income and high-income backgrounds?","How can {primaryTopic} pedagogical approaches be redesigned to be genuinely inclusive for students with learning disabilities or language barriers?"] }
        ]
      }
    }
  },
  business: {
    displayName: "Business & Management",
    keywords: ["business","management","organization","firm","company","enterprise","corporate","strategy","strategic management","leadership","governance","stakeholder","performance","competitive advantage","innovation","entrepreneurship","startup","SME","supply chain","operations management","human resources","talent management","employee motivation","organizational culture","change management","merger","acquisition","marketing strategy","product development","customer relationship","digitalization","ROI"],
    topicKeywords: ["business strategy","organizational performance","competitive advantage","innovation management","leadership style","organizational culture","change management","supply chain management","human resource management","talent management","customer relationship","digital transformation","entrepreneurship","business model","stakeholder management","corporate governance"],
    forbiddenInGaps: ["neural architecture","adversarial training","federated learning","GAN","gradient descent","language model fine-tuning","image segmentation"],
    expectedActors: ["manager", "employee", "executive", "stakeholder", "customer", "investor", "leader"],
    expectedConcepts: ["strategy", "organization", "firm", "performance", "innovation", "market", "corporate"],
    genericTemplates: [
      { id: "biz_generic_framework", name: "Comprehensive Framework for {primaryTopic}", triggerIfAbsent: ["comprehensive framework","holistic management","integrated model"], description: "Current paradigms for managing {primaryTopic} are highly fragmented, lacking a comprehensive management framework that synthesizes strategic and operational dimensions.", researchQuestions: ["What holistic management framework best synthesizes the operational, strategic, and human dimensions of {primaryTopic}?"] }
    ],
    subdomains: {
      strategy_and_scale: {
        displayName: "Strategy & Scale",
        keywords: ["SME","emerging market","multilevel","organizational level"],
        gapDimensions: [
          { id: "biz_sme", name: "SME and Emerging Market Applicability", triggerIfAbsent: ["SME","small business","emerging market","developing country","micro-enterprise","family business"], description: "{primaryTopic} research is disproportionately conducted within large corporations in developed economies. Whether findings generalize to SMEs and emerging-market contexts remains underexplored.", researchQuestions: ["How do resource constraints and informal institutional environments shape {primaryTopic} practices in SMEs compared to large corporations?","What modifications to established {primaryTopic} frameworks are necessary for their effective application in emerging-market contexts?"] },
          { id: "biz_multilevel", name: "Multilevel Analysis Across Organizational Levels", triggerIfAbsent: ["multilevel","individual level","team level","organizational level","nested","hierarchical analysis"], description: "Studies on {primaryTopic} typically analyze a single level without accounting for mechanisms operating differently across nested organizational levels.", researchQuestions: ["How do {primaryTopic} dynamics at the individual employee level aggregate to produce team-level and firm-level outcomes?","What multilevel modeling approaches best disentangle individual, team, and organizational contributions to {primaryTopic} outcomes?"] }
        ]
      },
      longitudinal_dynamics: {
        displayName: "Longitudinal Dynamics",
        keywords: ["longitudinal","over time","organizational trajectory"],
        gapDimensions: [
          { id: "biz_longitudinal", name: "Longitudinal Organizational Dynamics", triggerIfAbsent: ["longitudinal","panel data","over time","long-term","temporal","organizational trajectory"], description: "Much {primaryTopic} research relies on cross-sectional designs that cannot capture how organizational practices evolve across business cycles and leadership transitions.", researchQuestions: ["How do {primaryTopic} capabilities develop and transform across different stages of an organizations lifecycle?","What longitudinal methodologies best track causality between {primaryTopic} interventions and sustained organizational performance?"] }
        ]
      }
    }
  },
  agriculture: {
    displayName: "Agriculture",
    keywords: ["agriculture","crop","farming","soil","irrigation","fertilizer","pest management","harvest","crop yield","livestock","aquaculture","agronomy","horticulture","food production","rural farming","organic farming","precision agriculture","seed variety","pesticide","herbicide","drought resistance","sustainable farming","agroecology","smallholder","land use","soil health"],
    topicKeywords: ["crop yield","soil health","irrigation management","pest management","livestock production","organic farming","precision agriculture","sustainable farming","food security","smallholder farmer","climate adaptation","agroecology","land use change","harvest efficiency"],
    forbiddenInGaps: ["federated learning","adversarial attack","GAN","transformer architecture","language model","backpropagation","image classification model"],
    expectedActors: ["farmer", "producer", "agricultural worker", "policymaker"],
    expectedConcepts: ["crop", "soil", "harvest", "yield", "climate", "farming", "livestock"],
    genericTemplates: [
      { id: "agr_generic_system", name: "Systems-Level Agronomic Evaluation of {primaryTopic}", triggerIfAbsent: ["agronomic system","holistic farming","system-level evaluation"], description: "Many agricultural studies examine {primaryTopic} in controlled settings, failing to account for the complex, systems-level interactions in real-world farming environments.", researchQuestions: ["How does the integration of {primaryTopic} impact overall agronomic system resilience when interacting with multiple unmanaged variables?"] }
    ],
    subdomains: {
      climate_and_sustainability: {
        displayName: "Climate & Sustainability",
        keywords: ["climate change","drought","resilience"],
        gapDimensions: [
          { id: "agr_climate", name: "Climate Change Adaptation Strategies", triggerIfAbsent: ["climate change","climate adaptation","extreme weather","drought","flood","temperature rise","resilience"], description: "Research on {primaryTopic} rarely integrates future climate scenarios into long-term viability assessments. Adaptive strategies for maintaining productivity under projected climate extremes are undercharacterized.", researchQuestions: ["What {primaryTopic} practices demonstrate the greatest resilience under projected mid-century climate scenarios in tropical and semi-arid regions?","How can farmer decision frameworks be redesigned to incorporate real-time climate data into {primaryTopic} management decisions?"] }
        ]
      },
      smallholder_adoption: {
        displayName: "Smallholder Adoption",
        keywords: ["smallholder","adoption","technology transfer"],
        gapDimensions: [
          { id: "agr_smallholder", name: "Smallholder Adoption Barriers and Technology Transfer", triggerIfAbsent: ["smallholder","adoption","technology transfer","extension service","access to inputs","small-scale farmer"], description: "Most {primaryTopic} innovations are developed and tested in large-scale commercial settings. Barriers to adoption by smallholder farmers are insufficiently studied.", researchQuestions: ["What economic and social barriers most significantly prevent smallholder farmers from adopting improved {primaryTopic} practices?","How can agricultural extension services be redesigned to bridge the gap between {primaryTopic} research and smallholder adoption?"] }
        ]
      }
    }
  },
  finance: {
    displayName: "Finance & Economics",
    keywords: ["finance","financial","investment","portfolio","stock market","equity","bond","return","risk","volatility","asset pricing","banking","credit","interest rate","monetary policy","fiscal policy","inflation","GDP","fintech","cryptocurrency","blockchain in finance","financial inclusion","microfinance","insurance","hedge fund","derivative","capital market","financial regulation","corporate finance","dividend policy","economic growth"],
    topicKeywords: ["investment return","portfolio management","stock market","risk management","financial performance","banking system","credit risk","monetary policy","financial inclusion","fintech adoption","cryptocurrency","capital structure","market efficiency","behavioral finance","financial regulation","insurance"],
    forbiddenInGaps: ["computer vision","image recognition","speech recognition","neural machine translation","federated learning","adversarial attack","image segmentation"],
    expectedActors: ["investor", "trader", "banker", "consumer", "regulator", "policymaker", "analyst"],
    expectedConcepts: ["market", "risk", "return", "portfolio", "asset", "credit", "policy"],
    genericTemplates: [
      { id: "fin_generic_macro", name: "Macroeconomic Dependencies of {primaryTopic}", triggerIfAbsent: ["macroeconomic","systemic risk","global market dependence"], description: "Analyses of {primaryTopic} frequently focus on micro-level or firm-level dynamics, neglecting the broader macroeconomic and systemic risk dependencies.", researchQuestions: ["To what extent is the stability of {primaryTopic} dependent on undocumented systemic macroeconomic conditions?"] }
    ],
    subdomains: {
      behavioral_finance: {
        displayName: "Behavioral Finance",
        keywords: ["behavioral","psychology","bias","sentiment"],
        gapDimensions: [
          { id: "fin_behavioral", name: "Behavioral Finance and Investor Psychology", triggerIfAbsent: ["behavioral finance","psychology","cognitive bias","heuristic","irrational","investor sentiment","overconfidence"], description: "Classical models of {primaryTopic} assume rational actors, yet behavioral anomalies consistently influence market outcomes. Psychological mechanisms underlying {primaryTopic} decisions are underexplored.", researchQuestions: ["How do cognitive biases (e.g., overconfidence, loss aversion) systematically distort {primaryTopic} decisions among retail versus institutional investors?","What debiasing interventions can be embedded into financial platforms to improve {primaryTopic} decision quality?"] }
        ]
      },
      financial_inclusion: {
        displayName: "Financial Inclusion",
        keywords: ["inclusion","underbanked","microfinance"],
        gapDimensions: [
          { id: "fin_inclusion", name: "Financial Inclusion and Underserved Populations", triggerIfAbsent: ["financial inclusion","underbanked","unbanked","microfinance","low-income","poverty","access to finance"], description: "Mainstream {primaryTopic} research focuses on established market participants. Challenges facing underbanked populations in accessing {primaryTopic} instruments are poorly represented.", researchQuestions: ["What barriers prevent underserved populations from meaningfully benefiting from {primaryTopic} products, and how can product design mitigate them?","How do digital financial services affect {primaryTopic} outcomes among previously unbanked households in developing economies?"] }
        ]
      }
    }
  },
  iot: {
    displayName: "Internet of Things (IoT)",
    keywords: ["IoT","internet of things","sensor","smart device","connected device","embedded system","wireless protocol","MQTT","Zigbee","LoRa","smart home","smart city","wearable device","actuator","gateway","edge computing","real-time monitoring","sensor fusion","low power design","M2M","microcontroller","Arduino","Raspberry Pi","firmware","device protocol"],
    topicKeywords: ["sensor network","smart device","real-time monitoring","edge computing","wireless protocol","smart home","smart city","wearable device","data collection","embedded system","IoT security","low-power design","device management","interoperability","IoT platform"],
    forbiddenInGaps: ["natural language generation","large language model","image captioning","graph neural network","text classification","language fine-tuning"],
    expectedActors: ["user", "administrator", "device", "system", "attacker"],
    expectedConcepts: ["sensor", "network", "protocol", "device", "security", "data", "computing"],
    genericTemplates: [
      { id: "iot_generic_scale", name: "Large-Scale Architecture for {primaryTopic}", triggerIfAbsent: ["large-scale","deployment architecture","city-scale"], description: "IoT research on {primaryTopic} is heavily skewed towards lab prototypes, leaving large-scale deployment architecture and cross-network integration under-addressed.", researchQuestions: ["What architectural frameworks are necessary to support the city-scale deployment of {primaryTopic}?"] }
    ],
    subdomains: {
      security_and_privacy: {
        displayName: "Security & Privacy",
        keywords: ["security","privacy","authentication","encryption"],
        gapDimensions: [
          { id: "iot_security", name: "Security, Privacy, and Trust in IoT Deployments", triggerIfAbsent: ["security","privacy","authentication","encryption","attack","vulnerability","trust"], description: "Most {primaryTopic} research focuses on functionality and performance. Security vulnerabilities, data privacy guarantees, and trust mechanisms in large-scale {primaryTopic} deployments are systematically underaddressed.", researchQuestions: ["What lightweight cryptographic protocols best balance security guarantees and energy constraints in {primaryTopic} environments?","How should data governance frameworks be designed to protect individual privacy in large-scale {primaryTopic} deployments?"] }
        ]
      },
      interoperability: {
        displayName: "Interoperability",
        keywords: ["interoperability","standard","protocol compatibility"],
        gapDimensions: [
          { id: "iot_interoperability", name: "Interoperability and Standardization Across Vendors", triggerIfAbsent: ["interoperability","standard","protocol compatibility","heterogeneous","cross-platform","vendor lock-in"], description: "The fragmentation of {primaryTopic} ecosystems across proprietary protocols limits scalability. Interoperability standards and cross-platform integration frameworks remain immature.", researchQuestions: ["What semantic interoperability frameworks enable heterogeneous {primaryTopic} devices to share data across manufacturer boundaries?","How does adoption of open versus proprietary communication standards affect long-term ecosystem viability in {primaryTopic} deployments?"] }
        ]
      }
    }
  },
  cybersecurity: {
    displayName: "Cybersecurity",
    keywords: ["cybersecurity","security","attack","vulnerability","malware","ransomware","phishing","intrusion detection","firewall","encryption","authentication","cyber threat","network security","endpoint security","zero-day","exploit","penetration testing","SIEM","incident response","data breach","access control","identity management","cyber resilience","threat intelligence","social engineering","botnet","DDoS","SQL injection","XSS","password security"],
    topicKeywords: ["intrusion detection","malware analysis","vulnerability assessment","network security","authentication mechanism","data breach","threat intelligence","incident response","access control","encryption standard","social engineering","cyber resilience","penetration testing","ransomware","phishing detection"],
    forbiddenInGaps: [],
    expectedActors: ["attacker", "user", "administrator", "analyst", "employee"],
    expectedConcepts: ["attack", "vulnerability", "defense", "security", "threat", "network"],
    genericTemplates: [
      { id: "sec_generic_metric", name: "Standardized Measurement of {primaryTopic}", triggerIfAbsent: ["standardized metric","quantifiable defense","security measurement"], description: "Evaluating {primaryTopic} often relies on qualitative risk matrices rather than standardized, empirically verifiable security metrics.", researchQuestions: ["How can standardized, quantitative metrics be developed to accurately benchmark {primaryTopic} across diverse network topologies?"] }
    ],
    subdomains: {
      human_factors: {
        displayName: "Human Factors",
        keywords: ["human factor","user behavior","social engineering","insider threat"],
        gapDimensions: [
          { id: "sec_human_factor", name: "Human Factors and Sociotechnical Security", triggerIfAbsent: ["human factor","user behavior","social engineering","security awareness","usability","insider threat"], description: "Technical controls dominate {primaryTopic} research, yet most breaches involve human error or social manipulation. Organizational behavior and security culture are underrepresented.", researchQuestions: ["What organizational and environmental factors most strongly predict employee susceptibility to {primaryTopic}-related social engineering attacks?","How can security awareness training be redesigned to produce durable behavioral change rather than short-term compliance in {primaryTopic} contexts?"] }
        ]
      },
      emerging_threats: {
        displayName: "Emerging Threats",
        keywords: ["emerging threat","zero-day","supply chain","cloud"],
        gapDimensions: [
          { id: "sec_emerging_threats", name: "Emerging Threat Vectors and Evolving Attack Surface", triggerIfAbsent: ["emerging threat","novel attack","zero-day","supply chain attack","cloud security","5G security"], description: "Many {primaryTopic} studies evaluate defenses against known signatures. Proactive research on emerging threat vectors targeting cloud infrastructure and software supply chains lags behind attacker innovation.", researchQuestions: ["How do supply chain compromise techniques targeting {primaryTopic} infrastructure differ from traditional attack vectors, and what countermeasures are most effective?","What threat modeling frameworks best capture the evolving attack surface of {primaryTopic} systems in hybrid cloud environments?"] }
        ]
      }
    }
  },
  environmental_science: {
    displayName: "Environmental Science",
    keywords: ["environment","environmental","climate change","pollution","emission","greenhouse gas","carbon","biodiversity","ecosystem","conservation","sustainability","renewable energy","waste management","recycling","deforestation","land degradation","water quality","air quality","soil contamination","habitat","species","wildlife","ocean","marine ecology","coral reef","plastic pollution","microplastic","carbon footprint","ecological restoration","nature-based solution"],
    topicKeywords: ["climate change","carbon emission","biodiversity loss","pollution control","ecosystem restoration","renewable energy","water quality","soil contamination","marine conservation","plastic pollution","land use change","habitat fragmentation","carbon sequestration","nature-based solutions","environmental policy"],
    forbiddenInGaps: ["federated learning","adversarial attack","GAN","transformer architecture","large language model","backpropagation","image recognition model"],
    expectedActors: ["policymaker", "community", "citizen", "government", "researcher", "industry"],
    expectedConcepts: ["environment", "climate", "sustainability", "ecosystem", "policy", "pollution"],
    genericTemplates: [
      { id: "env_generic_scalable", name: "Scalable Deployment of {primaryTopic}", triggerIfAbsent: ["scalable deployment","large-scale environmental action","mass adoption"], description: "While {primaryTopic} demonstrates efficacy in localized case studies, the structural barriers preventing its scalable, regional deployment remain under-investigated.", researchQuestions: ["What socio-technical frameworks are necessary to facilitate the scalable, cross-regional deployment of {primaryTopic}?"] }
    ],
    subdomains: {
      policy_and_governance: {
        displayName: "Policy & Governance",
        keywords: ["policy","regulation","governance","compliance"],
        gapDimensions: [
          { id: "env_policy", name: "Policy Implementation and Governance Gaps", triggerIfAbsent: ["policy","regulation","governance","implementation gap","compliance","environmental law","treaty"], description: "{primaryTopic} research often identifies problems and proposes technical solutions but neglects policy and governance mechanisms required for implementation at scale.", researchQuestions: ["What governance structures and enforcement mechanisms most effectively translate {primaryTopic} scientific evidence into national policy change?","How do political economy factors shape the implementation gap between {primaryTopic} regulatory ambition and on-the-ground environmental outcomes?"] }
        ]
      },
      community_engagement: {
        displayName: "Community Engagement",
        keywords: ["community","indigenous","justice","participation"],
        gapDimensions: [
          { id: "env_community", name: "Community Engagement and Environmental Justice", triggerIfAbsent: ["community","local","indigenous","justice","equity","participation","environmental justice"], description: "Technical solutions to {primaryTopic} challenges are frequently designed without meaningful community involvement. Environmental justice dimensions are underrepresented.", researchQuestions: ["How do {primaryTopic} impacts disproportionately affect marginalized and indigenous communities, and what participatory frameworks ensure equitable policy responses?","What co-design methodologies best integrate local ecological knowledge into formal {primaryTopic} management and restoration plans?"] }
        ]
      }
    }
  }
} };
