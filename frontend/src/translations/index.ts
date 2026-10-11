export type Language = 'en' | 'te' | 'hi';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    appName: "CareSaathi AI",
    tagline: "Healthcare Cost & Care Navigator",
    navHome: "Home",
    navDashboard: "Dashboard",
    navEstimate: "Estimate Cost",
    navFindHospitals: "Find Hospitals",
    navHealthCards: "Health Card Finder",
    navFinancialSupport: "Financial Support",
    navHowItWorks: "How It Works",
    startSearch: "Start Healthcare Search",

    // Hero
    heroHeadline: "Understand Your Healthcare Costs. Find Care You Can Trust.",
    heroSubtitle: "CareSaathi AI helps you explore treatment cost estimates, nearby healthcare facilities, and potentially applicable financial support in one place.",
    exploreOptions: "Explore Healthcare Options",
    howItWorksBtn: "How It Works",

    // Features
    featCostTitle: "Cost Estimation",
    featCostDesc: "Explore indicative treatment and diagnostic price ranges with transparent breakdowns.",
    featHospTitle: "Nearby Care Discovery",
    featHospDesc: "Find verified facilities that match treatment requirements, location, and ownership tiers.",
    featSchemeTitle: "Scheme & Insurance Navigator",
    featSchemeDesc: "Explore potentially applicable financial support including PM-JAY, Aarogyasri, and CGHS.",

    // Steps
    step1Title: "1. Tell us what care you need",
    step1Desc: "Type in plain words, use voice speech, or upload a prescription image.",
    step2Title: "2. Compare costs and nearby facilities",
    step2Desc: "See transparent price ranges, confidence levels, and verified hospital capabilities.",
    step3Title: "3. Explore financial support",
    step3Desc: "Check eligible government health schemes and verified empanelled providers.",

    // Search bar
    searchPlaceholder: "e.g. 'I need a knee replacement in Hyderabad' or 'MRI scan in Kukatpally'...",
    searchBtn: "Search Care",
    voiceBtn: "Voice Search",
    rxBtn: "Upload Prescription",
    searching: "Analyzing with Healthcare AI...",

    // Results & Cards
    indicativeRange: "Indicative Price Range",
    priceType: "Price Type",
    confidence: "Confidence Level",
    viewBreakdown: "View Cost Breakdown",
    verifiedHospital: "Verified Facility",
    directions: "Directions",
    callFacility: "Call Facility",
    compare: "Compare",
    removeCompare: "Remove",

    // Schemes
    potentiallyApplicable: "Potentially Applicable",
    moreInfoRequired: "More Information Required",
    coverageNotVerified: "Coverage Not Verified",
    notMatching: "Criteria Not Matched",
    officialVerificationReq: "Official Verification Required",
    checkEligibility: "Check My Eligibility",

    // Disclaimer
    disclaimerNotice: "CareSaathi AI is an informational cost directory, not a medical diagnosis system or hospital billing desk. All estimates and scheme statuses require official facility confirmation.",

    // Booking & Appointments
    bookAppointment: "Book Appointment",
    bookConsultation: "Book Consultation",
    myAppointments: "My Appointments",
    bookingPurpose: "Purpose of Visit",
    consultation: "Doctor Consultation",
    preSurgery: "Pre-Surgery Evaluation",
    diagnostics: "Diagnostics (MRI / CT / Lab)",
    secondOpinion: "Second Opinion & Review",
    chooseDateTime: "Choose Date & Time",
    morning: "Morning (9 AM - 12 PM)",
    afternoon: "Afternoon (12 PM - 4 PM)",
    evening: "Evening (4 PM - 8 PM)",
    noSlotsAvailable: "No available slots on this date. Please choose another day.",
    patientDetails: "Patient Information",
    fullName: "Patient Full Name",
    patientAge: "Patient Age",
    patientPhone: "Mobile Number",
    bookingForSomeoneElse: "Booking for someone else (Helper Mode)",
    shareCostSummary: "Share my estimated cost and scheme summary with the hospital",
    doctorNotes: "Optional note or symptoms for the doctor",
    reviewConfirm: "Review & Confirm",
    confirmBooking: "Confirm Booking",
    whatHappensNext: "What happens next?",
    bookingConfirmed: "Appointment Confirmed",
    bookingRequested: "Appointment Request Sent",
    demoBookingNotice: "Demo Booking • Simulated hospital slot for test purposes",
    realBookingNotice: "Appointment request sent to hospital, awaiting official confirmation",
    bookingRef: "Booking Reference",
    addToCalendar: "Add to Calendar (.ics)",
    shareWhatsApp: "Share on WhatsApp",
    whatToCarry: "What to carry for your visit",
    carryGovtId: "Government Photo ID (Aadhaar / Voter ID / PAN)",
    carryPrescription: "Doctor's Prescription & Medical Reports",
    carrySchemeCard: "Scheme Card (Aarogyasri / PM-JAY / CGHS)",
    carryInsurance: "Health Insurance Policy Card / E-card",
    upcoming: "Upcoming",
    past: "Past",
    reschedule: "Reschedule",
    cancelBooking: "Cancel Appointment",
    statusRequested: "Requested",
    statusConfirmed: "Confirmed",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    appointmentReminder24h: "You have an upcoming appointment within the next 24 hours",

    // Maps & Places
    googleRatingNotice: "Google rating, not a quality guarantee",
    openNow: "Open Now",
    poweredByGoogle: "Powered by Google",
    findRealHospitals: "Find real hospitals nearby",
    searchThisArea: "Search this area",
    useMyLocation: "Use My Location",
    mapView: "Map View",
    listView: "List View",
    distanceRadius: "Distance Radius",

    // Data Quality Chips
    chipDemoData: "Demo Facility",
    chipGoogleData: "Google Maps Verified",
    chipPublishedPrice: "Published Price",
    chipReferenceEstimate: "Reference Estimate",

    // Simple Mode & Journey Rail
    simpleMode: "Simple Mode",
    simpleModeOn: "Simple Mode Enabled",
    simpleModeOff: "Standard View",
    journeyStep1: "1. Search Care",
    journeyStep2: "2. Compare Costs",
    journeyStep3: "3. Choose Facility",
    journeyStep4: "4. Book Visit"
  },

  te: {
    // Nav
    appName: "కేర్ సాథీ AI",
    tagline: "వైద్య ఖర్చులు & సంరక్షణ నావిగేటర్",
    navHome: "హోమ్",
    navDashboard: "డాష్‌బోర్డ్",
    navEstimate: "ఖర్చు అంచనా",
    navFindHospitals: "ఆసుపత్రులు కనుగొనండి",
    navHealthCards: "హెల్త్ కార్డ్ ఆసుపత్రులు",
    navFinancialSupport: "ఆర్థిక సహాయం (పథకాలు)",
    navHowItWorks: "ఇది ఎలా పనిచేస్తుంది",
    startSearch: "వెతకడం ప్రారంభించండి",

    // Hero
    heroHeadline: "మీ వైద్య ఖర్చులను అర్థం చేసుకోండి. మీరు నమ్మదగిన వైద్యాన్ని కనుగొనండి.",
    heroSubtitle: "కేర్ సాథీ AI ద్వారా చికిత్స ఖర్చుల అంచనాలు, సమీపంలోని ఆసుపత్రులు మరియు ప్రభుత్వ ఆరోగ్య పథకాల మద్దతును ఒకే చోట సులభంగా తెలుసుకోండి.",
    exploreOptions: "చికిత్స ఎంపికలను చూడండి",
    howItWorksBtn: "ఇది ఎలా పనిచేస్తుంది",

    // Features
    featCostTitle: "చికిత్స ఖర్చు అంచనా",
    featCostDesc: "చికిత్సలు మరియు డయాగ్నోస్టిక్స్ కోసం సుమారు ధరల వివరాలను పారదర్శకంగా పరిశీలించండి.",
    featHospTitle: "సమీప ఆసుపత్రుల శోధన",
    featHospDesc: "మీ చికిత్స అవసరాలు, స్థానం మరియు ప్రభుత్వ/ప్రైవేట్ కేటగిరీకి తగిన ఆసుపత్రులను కనుగొనండి.",
    featSchemeTitle: "ఆరోగ్యశ్రీ & బీమా మార్గదర్శి",
    featSchemeDesc: "ఆరోగ్యశ్రీ, ఆయుష్మాన్ భారత్ (PM-JAY), CGHS వంటి వర్తించే ప్రభుత్వ పథకాలను పరిశీలించండి.",

    // Steps
    step1Title: "1. మీకు కావాల్సిన చికిత్సను చెప్పండి",
    step1Desc: "సాధారణ మాటల్లో టైప్ చేయండి, మైక్ ద్వారా మాట్లాడండి లేదా ప్రిస్క్రిప్షన్ అప్‌లోడ్ చేయండి.",
    step2Title: "2. ఖర్చులు & ఆసుపత్రులను పోల్చండి",
    step2Desc: "స్పష్టమైన ధర పరిధులు, నమ్మక స్థాయిలు మరియు ధృవీకరించబడిన ఆసుపత్రుల సామర్థ్యాలను చూడండి.",
    step3Title: "3. ప్రభుత్వ ఆర్థిక సహాయాన్ని పరిశీలించండి",
    step3Desc: "మీకు వర్తించే ఆరోగ్య పథకాలను మరియు ఎంప్యానెల్ చేయబడిన ఆసుపత్రులను ధృవీకరించుకోండి.",

    // Search bar
    searchPlaceholder: "ఉదా: 'హైదరాబాద్‌లో మోకాలి మార్పిడి శస్త్రచికిత్స' లేదా 'కూకట్‌పల్లిలో ఎంఆర్ఐ స్కాన్'...",
    searchBtn: "శోధించండి",
    voiceBtn: "వాయిస్ శోధన",
    rxBtn: "ప్రిస్క్రిప్షన్ అప్‌లోడ్",
    searching: "విశ్లేషిస్తోంది...",

    // Results & Cards
    indicativeRange: "సుమారు ధరల పరిధి",
    priceType: "ధర రకం",
    confidence: "విశ్వసనీయత స్థాయి",
    viewBreakdown: "ఖర్చుల వివరాలు చూడండి",
    verifiedHospital: "ధృవీకరించబడిన ఆసుపత్రి",
    directions: "దారి (మ్యాప్)",
    callFacility: "కాల్ చేయండి",
    compare: "పోల్చండి",
    removeCompare: "తొలగించు",

    // Schemes
    potentiallyApplicable: "వర్తించే అవకాశం ఉంది",
    moreInfoRequired: "మరింత సమాచారం అవసరం",
    coverageNotVerified: "కవరేజ్ ధృవీకరించబడలేదు",
    notMatching: "నియమాలు సరిపోలలేదు",
    officialVerificationReq: "అధికారిక ధృవీకరణ అవసరం",
    checkEligibility: "అర్హతను తనిఖీ చేయండి",

    // Disclaimer
    disclaimerNotice: "కేర్ సాథీ AI ఒక సమాచార మార్గదర్శి మాత్రమే. ఇది వైద్య నిర్ధారణ లేదా అంతిమ ఆసుపత్రి కొటేషన్ కాదు. దయచేసి ఆసుపత్రి కౌంటర్‌లో నేరుగా ధృవీకరించుకోండి.",

    // Booking & Appointments
    bookAppointment: "అపాయింట్‌మెంట్ బుక్ చేయండి",
    bookConsultation: "కన్సల్టేషన్ బుక్ చేయండి",
    myAppointments: "నా అపాయింట్‌మెంట్లు",
    bookingPurpose: "సందర్శన ఉద్దేశ్యం",
    consultation: "డాక్టర్ సంప్రదింపులు (కన్సల్టేషన్)",
    preSurgery: "శస్త్రచికిత్సకు ముందు పరీక్షలు",
    diagnostics: "డయాగ్నస్టిక్స్ (MRI / CT / రక్త పరీక్షలు)",
    secondOpinion: "రెండవ అభిప్రాయం (సెకండ్ ఒపీనియన్)",
    chooseDateTime: "తేదీ మరియు సమయం ఎంచుకోండి",
    morning: "ఉదయం (9 AM - 12 PM)",
    afternoon: "మధ్యాహ్నం (12 PM - 4 PM)",
    evening: "సాయంత్రం (4 PM - 8 PM)",
    noSlotsAvailable: "ఈ తేదీన స్లాట్‌లు అందుబాటులో లేవు. వేరే రోజును ఎంచుకోండి.",
    patientDetails: "రోగి వివరాలు",
    fullName: "రోగి పూర్తి పేరు",
    patientAge: "వయస్సు",
    patientPhone: "మొబైల్ నంబర్",
    bookingForSomeoneElse: "ఇతరుల కోసం బుక్ చేస్తున్నాను (హెల్పర్ మోడ్)",
    shareCostSummary: "ఖర్చు అంచనా మరియు పథకం వివరాలను ఆసుపత్రితో పంచుకోండి",
    doctorNotes: "డాక్టర్ కోసం గమనిక లేదా లక్షణాలు (ఐచ్ఛికం)",
    reviewConfirm: "పరిశీలించి నిర్ధారించండి",
    confirmBooking: "బుకింగ్ నిర్ధారించండి",
    whatHappensNext: "తర్వాత ఏమి జరుగుతుంది?",
    bookingConfirmed: "అపాయింట్‌మెంట్ ఖరారైంది",
    bookingRequested: "అపాయింట్‌మెంట్ అభ్యర్థన పంపబడింది",
    demoBookingNotice: "డెమో బుకింగ్ • పరీక్ష ప్రయోజనాల కోసం రూపొందించబడింది",
    realBookingNotice: "అభ్యర్థన ఆసుపత్రికి పంపబడింది, అధికారిక ధృవీకరణ కోసం వేచి ఉంది",
    bookingRef: "బుకింగ్ రిఫరెన్స్ నంబర్",
    addToCalendar: "క్యాలెండర్‌కు జోడించు (.ics)",
    shareWhatsApp: "వాట్సాప్‌లో షేర్ చేయండి",
    whatToCarry: "ఆసుపత్రికి వెళ్లేటప్పుడు వెంట తీసుకెళ్లవలసినవి",
    carryGovtId: "ప్రభుత్వ గుర్తింపు కార్డు (ఆధార్ / ఓటర్ ID / పాన్)",
    carryPrescription: "డాక్టర్ ప్రిస్క్రిప్షన్ & పాత మెడికల్ రిపోర్టులు",
    carrySchemeCard: "ఆరోగ్యశ్రీ / ఆయుష్మాన్ భారత్ కార్డు",
    carryInsurance: "హెల్త్ ఇన్సూరెన్స్ కార్డు",
    upcoming: "రాబోయేవి",
    past: "గతంలో జరిగినవి",
    reschedule: "సమయం మార్చండి",
    cancelBooking: "రద్దు చేయండి",
    statusRequested: "అభ్యర్థించబడింది",
    statusConfirmed: "ధృవీకరించబడింది",
    statusCompleted: "పూర్తయింది",
    statusCancelled: "రద్దు చేయబడింది",
    appointmentReminder24h: "రాబోయే 24 గంటల్లో మీకు అపాయింట్‌మెంట్ ఉంది",

    // Maps & Places
    googleRatingNotice: "గూగుల్ రేటింగ్ (నాణ్యత హామీ కాదు)",
    openNow: "ఇప్పుడు తెరిచి ఉంది",
    poweredByGoogle: "గూగుల్ ద్వారా ఆధారితం",
    findRealHospitals: "సమీపంలోని నిజమైన ఆసుపత్రులను కనుగొనండి",
    searchThisArea: "ఈ ప్రాంతంలో వెతకండి",
    useMyLocation: "నా ప్రస్తుత లొకేషన్ ఉపయోగించు",
    mapView: "మ్యాప్ వీక్షణ",
    listView: "జాబితా వీక్షణ",
    distanceRadius: "దూరం పరిధి",

    // Data Quality Chips
    chipDemoData: "డెమో సౌకర్యం",
    chipGoogleData: "గూగుల్ మ్యాప్స్ ధృవీకరించబడింది",
    chipPublishedPrice: "ప్రకటించిన ధర",
    chipReferenceEstimate: "సూచిక అంచనా",

    // Simple Mode & Journey Rail
    simpleMode: "సులభ మోడ్",
    simpleModeOn: "సులభ మోడ్ ఆన్ చేయబడింది",
    simpleModeOff: "సాధారణ వీక్షణ",
    journeyStep1: "1. శోధన",
    journeyStep2: "2. పోలిక",
    journeyStep3: "3. ఆసుపత్రి ఎంపిక",
    journeyStep4: "4. బుకింగ్"
  },

  hi: {
    // Nav
    appName: "केयरसाथी AI",
    tagline: "स्वास्थ्य सेवा लागत एवं अस्पताल नेविगेटर",
    navHome: "होम",
    navDashboard: "डैशबोर्ड",
    navEstimate: "लागत अनुमान",
    navFindHospitals: "अस्पताल खोजें",
    navHealthCards: "हेल्थ कार्ड अस्पताल खोजें",
    navFinancialSupport: "सरकारी योजनाएं व सहायता",
    navHowItWorks: "यह कैसे काम करता है",
    startSearch: "सर्च शुरू करें",

    // Hero
    heroHeadline: "अपनी उपचार लागत समझें। विश्वसनीय स्वास्थ्य सेवा पाएं।",
    heroSubtitle: "केयरसाथी AI उपचार लागत का अनुमान, नजदीकी अस्पताल और आयुष्मान भारत व राज्य स्वास्थ्य योजनाओं की जानकारी एक ही स्थान पर प्रदान करता है।",
    exploreOptions: "उपचार विकल्प देखें",
    howItWorksBtn: "यह कैसे काम करता है",

    // Features
    featCostTitle: "उपचार लागत का अनुमान",
    featCostDesc: "विभिन्न सर्जरी और जांचों के लिए पारदर्शी अनुमानित मूल्य और खर्चों का विवरण देखें।",
    featHospTitle: "नजदीकी अस्पताल खोजें",
    featHospDesc: "अपनी आवश्यकता, स्थान और सरकारी/निजी श्रेणी के अनुसार उपयुक्त स्वास्थ्य केंद्र खोजें।",
    featSchemeTitle: "योजना एवं बीमा सहायता",
    featSchemeDesc: "आयुष्मान भारत (PM-JAY), आरोग्यश्री और CGHS जैसी लाभकारी योजनाओं की पात्रता जांचें।",

    // Steps
    step1Title: "1. बताएं कि आपको किस उपचार की आवश्यकता है",
    step1Desc: "सामान्य शब्दों में लिखें, आवाज (माइक) से बोलें या पर्ची (प्रिस्क्रिप्शन) अपलोड करें।",
    step2Title: "2. खर्च और अस्पतालों की तुलना करें",
    step2Desc: "लागत का दायरा, विश्वसनीयता स्तर और अस्पताल की सुविधाओं का अवलोकन करें।",
    step3Title: "3. वित्तीय सहायता एवं सरकारी योजनाएं खोजें",
    step3Desc: "उपलब्ध योजनाओं और पैनल में शामिल सूचीबद्ध अस्पतालों की पुष्टि करें।",

    // Search bar
    searchPlaceholder: "उदा: 'हैदराबाद में घुटने का प्रत्यारोपण' या 'कुकटपल्ली में एमआरआई जांच'...",
    searchBtn: "सर्च करें",
    voiceBtn: "वॉइस सर्च",
    rxBtn: "पर्ची अपलोड करें",
    searching: "विश्लेषण किया जा रहा है...",

    // Results & Cards
    indicativeRange: "अनुमानित खर्च सीमा",
    priceType: "मूल्य प्रकार",
    confidence: "विश्वसनीयता स्तर",
    viewBreakdown: "खर्च का पूरा विवरण देखें",
    verifiedHospital: "सत्यापित अस्पताल",
    directions: "रास्ता देखें",
    callFacility: "कॉल करें",
    compare: "तुलना करें",
    removeCompare: "हटाएं",

    // Schemes
    potentiallyApplicable: "लागू होने की संभावना है",
    moreInfoRequired: "अधिक जानकारी आवश्यक",
    coverageNotVerified: "कवरेज सत्यापित नहीं है",
    notMatching: "मापदंड मेल नहीं खाते",
    officialVerificationReq: "आधिकारिक सत्यापन आवश्यक",
    checkEligibility: "अपनी पात्रता जांचें",

    // Disclaimer
    disclaimerNotice: "केयरसाथी AI केवल एक सूचनात्मक स्वास्थ्य निर्देशिका है, यह कोई मेडिकल निदान या अंतिम बिल नहीं है। कृपया अस्पताल से अंतिम दर की पुष्टि अवश्य करें।",

    // Booking & Appointments
    bookAppointment: "अपॉइंटमेंट बुक करें",
    bookConsultation: "परामर्श बुक करें",
    myAppointments: "मेरे अपॉइंटमेंट्स",
    bookingPurpose: "आने का उद्देश्य",
    consultation: "डॉक्टर परामर्श (ओपीडी)",
    preSurgery: "सर्जरी पूर्व परीक्षण व जांच",
    diagnostics: "डायग्नोस्टिक्स (MRI / CT / लैब)",
    secondOpinion: "दूसरी राय (सेकंड ओपिनियन)",
    chooseDateTime: "दिनांक और समय चुनें",
    morning: "सुबह (9 AM - 12 PM)",
    afternoon: "दोपहर (12 PM - 4 PM)",
    evening: "शाम (4 PM - 8 PM)",
    noSlotsAvailable: "इस तारीख को कोई स्लॉट उपलब्ध नहीं है। कृपया दूसरा दिन चुनें।",
    patientDetails: "मरीज की जानकारी",
    fullName: "मरीज का पूरा नाम",
    patientAge: "उम्र",
    patientPhone: "मोबाइल नंबर",
    bookingForSomeoneElse: "किसी अन्य व्यक्ति के लिए बुकिंग (सहायक मोड)",
    shareCostSummary: "अनुमानित लागत और योजना विवरण अस्पताल के साथ साझा करें",
    doctorNotes: "डॉक्टर के लिए लक्षण या नोट (वैकल्पिक)",
    reviewConfirm: "समीक्षा करें और पुष्टि करें",
    confirmBooking: "बुकिंग की पुष्टि करें",
    whatHappensNext: "आगे क्या होगा?",
    bookingConfirmed: "अपॉइंटमेंट की पुष्टि हो गई",
    bookingRequested: "अपॉइंटमेंट अनुरोध भेजा गया",
    demoBookingNotice: "डेमो बुकिंग • परीक्षण के लिए डमी स्लॉट",
    realBookingNotice: "अस्पताल को अनुरोध भेजा गया, आधिकारिक पुष्टि की प्रतीक्षा है",
    bookingRef: "बुकिंग संदर्भ संख्या",
    addToCalendar: "कैलेंडर में जोड़ें (.ics)",
    shareWhatsApp: "व्हाट्सएप पर साझा करें",
    whatToCarry: "अस्पताल जाते समय क्या साथ ले जाएं",
    carryGovtId: "सरकारी पहचान पत्र (आधार / वोटर आईडी / पैन)",
    carryPrescription: "डॉक्टर की पर्ची एवं पुरानी मेडिकल रिपोर्ट्स",
    carrySchemeCard: "आयुष्मान भारत / आरोग्यश्री योजना कार्ड",
    carryInsurance: "स्वास्थ्य बीमा कार्ड / ई-कार्ड",
    upcoming: "आगामी",
    past: "पिछला",
    reschedule: "समय बदलें",
    cancelBooking: "रद्द करें",
    statusRequested: "अनुरोधित",
    statusConfirmed: "पुष्टीकृत",
    statusCompleted: "पूर्ण",
    statusCancelled: "रद्द",
    appointmentReminder24h: "अगले 24 घंटों में आपका एक अपॉइंटमेंट निर्धारित है",

    // Maps & Places
    googleRatingNotice: "Google रेटिंग (गुणवत्ता की गारंटी नहीं)",
    openNow: "अभी खुला है",
    poweredByGoogle: "Google द्वारा संचालित",
    findRealHospitals: "आस-पास वास्तविक अस्पताल खोजें",
    searchThisArea: "इस क्षेत्र में खोजें",
    useMyLocation: "मेरा वर्तमान स्थान उपयोग करें",
    mapView: "मानचित्र दृश्य",
    listView: "सूची दृश्य",
    distanceRadius: "दूरी का दायरा",

    // Data Quality Chips
    chipDemoData: "डेमो सुविधा",
    chipGoogleData: "Google मैप्स सत्यापित",
    chipPublishedPrice: "प्रकाशित दर",
    chipReferenceEstimate: "संदर्भ अनुमान",

    // Simple Mode & Journey Rail
    simpleMode: "सरल मोड",
    simpleModeOn: "सरल मोड चालू है",
    simpleModeOff: "मानक दृश्य",
    journeyStep1: "1. सर्च",
    journeyStep2: "2. तुलना",
    journeyStep3: "3. अस्पताल चुनें",
    journeyStep4: "4. बुकिंग"
  }
};
