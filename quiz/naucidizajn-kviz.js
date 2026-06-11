/* Verzija: v1.27 */

(function() {
  'use strict';

  // ====================================================================
  // KONFIGURACIJA — promeni pre deploy-a
  // ====================================================================
  // Detekcija test okruženja:
  // - Na github.io ili localhost: pixel se ne pokreće, webhook se NE šalje
  //   (samo console.log, da ne kvarimo statistiku ni Bitrix sa test podacima)
  // - Na bilo kom drugom domenu (npr. naucidizajn.com): sve radi normalno
  var ND_IS_TEST_ENV = (function() {
    if (typeof location === 'undefined') return false;
    var host = (location.hostname || '').toLowerCase();
    return host === 'localhost' ||
           host === '127.0.0.1' ||
           host.indexOf('.github.io') !== -1 ||
           host.endsWith('github.io');
  })();

  var ND_CONFIG = {
    webhookUrl: 'https://hook.eu2.make.com/56oflcq2abftwtm523pefqcwonjj3jsv',
    formId: 'naucidizajn-1minut-kviz',
    fbPixelId: '415729519579969',
    redirectAfterSubmit: true,
    submitTimeoutMs: 8000,
    sendOnExit: true, // šalji webhook i ako korisnik napusti formu (partial response)
    isTestEnv: ND_IS_TEST_ENV
  };

  if (ND_IS_TEST_ENV) {
    console.log('%c[Nauči Dizajn Kviz] TEST ENV detected (' + location.hostname + ')', 'color:#DBFF00;font-weight:bold');
    console.log('  • Facebook Pixel: DISABLED');
    console.log('  • Webhook to Make: DISABLED (samo console.log payload-a)');
    console.log('  • Sve ostalo radi normalno');
  }

  // ====================================================================
  // LISTA ZEMALJA (225 zemalja - za country picker na Q17 telefon)
  // ====================================================================
  var ND_COUNTRIES = [
      {c:'AF',n:'Afghanistan',d:'+93'},
      {c:'AL',n:'Albania',d:'+355'},
      {c:'DZ',n:'Algeria',d:'+213'},
      {c:'AS',n:'American Samoa',d:'+1684'},
      {c:'AD',n:'Andorra',d:'+376'},
      {c:'AO',n:'Angola',d:'+244'},
      {c:'AI',n:'Anguilla',d:'+1264'},
      {c:'AG',n:'Antigua and Barbuda',d:'+1268'},
      {c:'AR',n:'Argentina',d:'+54'},
      {c:'AM',n:'Armenia',d:'+374'},
      {c:'AW',n:'Aruba',d:'+297'},
      {c:'AU',n:'Australia',d:'+61'},
      {c:'AT',n:'Austria',d:'+43'},
      {c:'AZ',n:'Azerbaijan',d:'+994'},
      {c:'BS',n:'Bahamas',d:'+1242'},
      {c:'BH',n:'Bahrain',d:'+973'},
      {c:'BD',n:'Bangladesh',d:'+880'},
      {c:'BB',n:'Barbados',d:'+1246'},
      {c:'BY',n:'Belarus',d:'+375'},
      {c:'BE',n:'Belgium',d:'+32'},
      {c:'BZ',n:'Belize',d:'+501'},
      {c:'BJ',n:'Benin',d:'+229'},
      {c:'BM',n:'Bermuda',d:'+1441'},
      {c:'BT',n:'Bhutan',d:'+975'},
      {c:'BO',n:'Bolivia',d:'+591'},
      {c:'BA',n:'Bosnia and Herzegovina',d:'+387'},
      {c:'BW',n:'Botswana',d:'+267'},
      {c:'BR',n:'Brazil',d:'+55'},
      {c:'BN',n:'Brunei',d:'+673'},
      {c:'BG',n:'Bulgaria',d:'+359'},
      {c:'BF',n:'Burkina Faso',d:'+226'},
      {c:'BI',n:'Burundi',d:'+257'},
      {c:'KH',n:'Cambodia',d:'+855'},
      {c:'CM',n:'Cameroon',d:'+237'},
      {c:'CA',n:'Canada',d:'+1'},
      {c:'CV',n:'Cape Verde',d:'+238'},
      {c:'KY',n:'Cayman Islands',d:'+1345'},
      {c:'CF',n:'Central African Republic',d:'+236'},
      {c:'TD',n:'Chad',d:'+235'},
      {c:'CL',n:'Chile',d:'+56'},
      {c:'CN',n:'China',d:'+86'},
      {c:'CO',n:'Colombia',d:'+57'},
      {c:'KM',n:'Comoros',d:'+269'},
      {c:'CG',n:'Congo',d:'+242'},
      {c:'CD',n:'Congo (DRC)',d:'+243'},
      {c:'CK',n:'Cook Islands',d:'+682'},
      {c:'CR',n:'Costa Rica',d:'+506'},
      {c:'HR',n:'Croatia',d:'+385'},
      {c:'CU',n:'Cuba',d:'+53'},
      {c:'CY',n:'Cyprus',d:'+357'},
      {c:'CZ',n:'Czech Republic',d:'+420'},
      {c:'CI',n:'Côte d\'Ivoire',d:'+225'},
      {c:'DK',n:'Denmark',d:'+45'},
      {c:'DJ',n:'Djibouti',d:'+253'},
      {c:'DM',n:'Dominica',d:'+1767'},
      {c:'DO',n:'Dominican Republic',d:'+1809'},
      {c:'EC',n:'Ecuador',d:'+593'},
      {c:'EG',n:'Egypt',d:'+20'},
      {c:'SV',n:'El Salvador',d:'+503'},
      {c:'GQ',n:'Equatorial Guinea',d:'+240'},
      {c:'ER',n:'Eritrea',d:'+291'},
      {c:'EE',n:'Estonia',d:'+372'},
      {c:'ET',n:'Ethiopia',d:'+251'},
      {c:'FK',n:'Falkland Islands',d:'+500'},
      {c:'FO',n:'Faroe Islands',d:'+298'},
      {c:'FJ',n:'Fiji',d:'+679'},
      {c:'FI',n:'Finland',d:'+358'},
      {c:'FR',n:'France',d:'+33'},
      {c:'GF',n:'French Guiana',d:'+594'},
      {c:'PF',n:'French Polynesia',d:'+689'},
      {c:'GA',n:'Gabon',d:'+241'},
      {c:'GM',n:'Gambia',d:'+220'},
      {c:'GE',n:'Georgia',d:'+995'},
      {c:'DE',n:'Germany',d:'+49'},
      {c:'GH',n:'Ghana',d:'+233'},
      {c:'GI',n:'Gibraltar',d:'+350'},
      {c:'GR',n:'Greece',d:'+30'},
      {c:'GL',n:'Greenland',d:'+299'},
      {c:'GD',n:'Grenada',d:'+1473'},
      {c:'GP',n:'Guadeloupe',d:'+590'},
      {c:'GU',n:'Guam',d:'+1671'},
      {c:'GT',n:'Guatemala',d:'+502'},
      {c:'GN',n:'Guinea',d:'+224'},
      {c:'GW',n:'Guinea-Bissau',d:'+245'},
      {c:'GY',n:'Guyana',d:'+592'},
      {c:'HT',n:'Haiti',d:'+509'},
      {c:'HN',n:'Honduras',d:'+504'},
      {c:'HK',n:'Hong Kong',d:'+852'},
      {c:'HU',n:'Hungary',d:'+36'},
      {c:'IS',n:'Iceland',d:'+354'},
      {c:'IN',n:'India',d:'+91'},
      {c:'ID',n:'Indonesia',d:'+62'},
      {c:'IR',n:'Iran',d:'+98'},
      {c:'IQ',n:'Iraq',d:'+964'},
      {c:'IE',n:'Ireland',d:'+353'},
      {c:'IL',n:'Israel',d:'+972'},
      {c:'IT',n:'Italy',d:'+39'},
      {c:'JM',n:'Jamaica',d:'+1876'},
      {c:'JP',n:'Japan',d:'+81'},
      {c:'JO',n:'Jordan',d:'+962'},
      {c:'KZ',n:'Kazakhstan',d:'+7'},
      {c:'KE',n:'Kenya',d:'+254'},
      {c:'KI',n:'Kiribati',d:'+686'},
      {c:'XK',n:'Kosovo',d:'+383'},
      {c:'KW',n:'Kuwait',d:'+965'},
      {c:'KG',n:'Kyrgyzstan',d:'+996'},
      {c:'LA',n:'Laos',d:'+856'},
      {c:'LV',n:'Latvia',d:'+371'},
      {c:'LB',n:'Lebanon',d:'+961'},
      {c:'LS',n:'Lesotho',d:'+266'},
      {c:'LR',n:'Liberia',d:'+231'},
      {c:'LY',n:'Libya',d:'+218'},
      {c:'LI',n:'Liechtenstein',d:'+423'},
      {c:'LT',n:'Lithuania',d:'+370'},
      {c:'LU',n:'Luxembourg',d:'+352'},
      {c:'MO',n:'Macao',d:'+853'},
      {c:'MG',n:'Madagascar',d:'+261'},
      {c:'MW',n:'Malawi',d:'+265'},
      {c:'MY',n:'Malaysia',d:'+60'},
      {c:'MV',n:'Maldives',d:'+960'},
      {c:'ML',n:'Mali',d:'+223'},
      {c:'MT',n:'Malta',d:'+356'},
      {c:'MH',n:'Marshall Islands',d:'+692'},
      {c:'MQ',n:'Martinique',d:'+596'},
      {c:'MR',n:'Mauritania',d:'+222'},
      {c:'MU',n:'Mauritius',d:'+230'},
      {c:'YT',n:'Mayotte',d:'+262'},
      {c:'MX',n:'Mexico',d:'+52'},
      {c:'FM',n:'Micronesia',d:'+691'},
      {c:'MD',n:'Moldova',d:'+373'},
      {c:'MC',n:'Monaco',d:'+377'},
      {c:'MN',n:'Mongolia',d:'+976'},
      {c:'ME',n:'Montenegro',d:'+382'},
      {c:'MS',n:'Montserrat',d:'+1664'},
      {c:'MA',n:'Morocco',d:'+212'},
      {c:'MZ',n:'Mozambique',d:'+258'},
      {c:'MM',n:'Myanmar',d:'+95'},
      {c:'NA',n:'Namibia',d:'+264'},
      {c:'NR',n:'Nauru',d:'+674'},
      {c:'NP',n:'Nepal',d:'+977'},
      {c:'NL',n:'Netherlands',d:'+31'},
      {c:'NC',n:'New Caledonia',d:'+687'},
      {c:'NZ',n:'New Zealand',d:'+64'},
      {c:'NI',n:'Nicaragua',d:'+505'},
      {c:'NE',n:'Niger',d:'+227'},
      {c:'NG',n:'Nigeria',d:'+234'},
      {c:'NU',n:'Niue',d:'+683'},
      {c:'NF',n:'Norfolk Island',d:'+672'},
      {c:'KP',n:'North Korea',d:'+850'},
      {c:'MK',n:'North Macedonia',d:'+389'},
      {c:'NO',n:'Norway',d:'+47'},
      {c:'OM',n:'Oman',d:'+968'},
      {c:'PK',n:'Pakistan',d:'+92'},
      {c:'PW',n:'Palau',d:'+680'},
      {c:'PS',n:'Palestine',d:'+970'},
      {c:'PA',n:'Panama',d:'+507'},
      {c:'PG',n:'Papua New Guinea',d:'+675'},
      {c:'PY',n:'Paraguay',d:'+595'},
      {c:'PE',n:'Peru',d:'+51'},
      {c:'PH',n:'Philippines',d:'+63'},
      {c:'PL',n:'Poland',d:'+48'},
      {c:'PT',n:'Portugal',d:'+351'},
      {c:'PR',n:'Puerto Rico',d:'+1787'},
      {c:'QA',n:'Qatar',d:'+974'},
      {c:'RO',n:'Romania',d:'+40'},
      {c:'RU',n:'Russia',d:'+7'},
      {c:'RW',n:'Rwanda',d:'+250'},
      {c:'RE',n:'Réunion',d:'+262'},
      {c:'SH',n:'Saint Helena',d:'+290'},
      {c:'KN',n:'Saint Kitts and Nevis',d:'+1869'},
      {c:'LC',n:'Saint Lucia',d:'+1758'},
      {c:'PM',n:'Saint Pierre and Miquelon',d:'+508'},
      {c:'VC',n:'Saint Vincent and the Grenadines',d:'+1784'},
      {c:'WS',n:'Samoa',d:'+685'},
      {c:'SM',n:'San Marino',d:'+378'},
      {c:'SA',n:'Saudi Arabia',d:'+966'},
      {c:'SN',n:'Senegal',d:'+221'},
      {c:'RS',n:'Serbia',d:'+381'},
      {c:'SC',n:'Seychelles',d:'+248'},
      {c:'SL',n:'Sierra Leone',d:'+232'},
      {c:'SG',n:'Singapore',d:'+65'},
      {c:'SK',n:'Slovakia',d:'+421'},
      {c:'SI',n:'Slovenia',d:'+386'},
      {c:'SB',n:'Solomon Islands',d:'+677'},
      {c:'SO',n:'Somalia',d:'+252'},
      {c:'ZA',n:'South Africa',d:'+27'},
      {c:'KR',n:'South Korea',d:'+82'},
      {c:'ES',n:'Spain',d:'+34'},
      {c:'LK',n:'Sri Lanka',d:'+94'},
      {c:'SD',n:'Sudan',d:'+249'},
      {c:'SR',n:'Suriname',d:'+597'},
      {c:'SZ',n:'Swaziland',d:'+268'},
      {c:'SE',n:'Sweden',d:'+46'},
      {c:'CH',n:'Switzerland',d:'+41'},
      {c:'SY',n:'Syria',d:'+963'},
      {c:'ST',n:'São Tomé and Príncipe',d:'+239'},
      {c:'TW',n:'Taiwan',d:'+886'},
      {c:'TJ',n:'Tajikistan',d:'+992'},
      {c:'TZ',n:'Tanzania',d:'+255'},
      {c:'TH',n:'Thailand',d:'+66'},
      {c:'TL',n:'Timor-Leste',d:'+670'},
      {c:'TG',n:'Togo',d:'+228'},
      {c:'TK',n:'Tokelau',d:'+690'},
      {c:'TO',n:'Tonga',d:'+676'},
      {c:'TT',n:'Trinidad and Tobago',d:'+1868'},
      {c:'TN',n:'Tunisia',d:'+216'},
      {c:'TR',n:'Turkey',d:'+90'},
      {c:'TM',n:'Turkmenistan',d:'+993'},
      {c:'TC',n:'Turks and Caicos Islands',d:'+1649'},
      {c:'TV',n:'Tuvalu',d:'+688'},
      {c:'UG',n:'Uganda',d:'+256'},
      {c:'UA',n:'Ukraine',d:'+380'},
      {c:'AE',n:'United Arab Emirates',d:'+971'},
      {c:'GB',n:'United Kingdom',d:'+44'},
      {c:'US',n:'United States',d:'+1'},
      {c:'UY',n:'Uruguay',d:'+598'},
      {c:'UZ',n:'Uzbekistan',d:'+998'},
      {c:'VU',n:'Vanuatu',d:'+678'},
      {c:'VA',n:'Vatican City',d:'+39'},
      {c:'VE',n:'Venezuela',d:'+58'},
      {c:'VN',n:'Vietnam',d:'+84'},
      {c:'WF',n:'Wallis and Futuna',d:'+681'},
      {c:'YE',n:'Yemen',d:'+967'},
      {c:'ZM',n:'Zambia',d:'+260'},
      {c:'ZW',n:'Zimbabwe',d:'+263'}
    ];

  // Helper: nadji zemlju po ISO kodu
  function findCountryByCode(code) {
    if (!code) return null;
    code = code.toUpperCase();
    for (var i = 0; i < ND_COUNTRIES.length; i++) {
      if (ND_COUNTRIES[i].c === code) return ND_COUNTRIES[i];
    }
    return null;
  }

  // Helper: vraća HTML za prikaz zastavice (flag-icons biblioteka, CSS klase)
  // Koristi <span class="fi fi-rs"> za sve zastavice - radi na svim browser-ima
  function flagHtml(code) {
    if (!code || code.length !== 2) return '';
    return '<span class="fi fi-' + code.toLowerCase() + '"></span>';
  }

  // Backward compat (možda ima negde poziv)
  function flagEmoji(code) {
    return flagHtml(code);
  }

  // ====================================================================
  // IP GEOLOCATION - detektuj zemlju iz IP adrese
  // ====================================================================
  // 3 fallback providera (ako prvi padne, ide drugi, itd.)
  function detectCountryByIP(callback) {
    var providers = [
      { url: 'https://api.country.is/',  field: 'country' },
      { url: 'https://ipwho.is/',         field: 'country_code' },
      { url: 'https://ipapi.co/json/',    field: 'country_code' }
    ];
    function tryProvider(idx) {
      if (idx >= providers.length) {
        if (callback) callback(null);
        return;
      }
      var p = providers[idx];
      fetch(p.url, { signal: AbortSignal.timeout(3000) })
        .then(function(r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function(data) {
          var code = data && data[p.field];
          if (code) {
            if (callback) callback(code);
          } else {
            throw new Error('No country code');
          }
        })
        .catch(function() {
          tryProvider(idx + 1);
        });
    }
    tryProvider(0);
  }

  // ====================================================================
  // PODACI FORME (1:1 mapirano iz Typeform JSON-a)
  // ====================================================================
  var FORM = {
    welcome: {
      title: 'Za 1-2 minuta, ovaj brzi kviz će ti pomoći da saznaš koja IT veština je idealna za tebe ☺️',
      paragraphs: [
        'Na osnovu tvojih odgovora, saznaćemo koji si tip ličnosti i koja oblast bi ti najbolje legla.',
        'Na kraju ćeš dobiti i <strong>besplatan video trening</strong> iz te veštine koja je najbolja za tebe 😊 🚀'
      ],
      buttonText: 'Kreni',
      timeText: 'Takes 2 minutes'
    },

    // Outcome definicije (4 kviz rezultata)
    outcomes: {
      'web-design':  { title: 'Web Design',  redirect: 'https://www.naucidizajn.com/web-design-kviz-rezultat'  },
      'logo-design': { title: 'Logo Design', redirect: 'https://www.naucidizajn.com/logo-design-kviz-rezultat' },
      'ui-ux':       { title: 'UI/UX',       redirect: 'https://www.naucidizajn.com/ui-ux-kviz-rezultat'       },
      'webflow':     { title: 'Webflow',     redirect: 'https://www.naucidizajn.com/webflow-kviz-rezultat'     }
    },

    // Pitanja po redu
    fields: [
      // ---- Q1-Q6 Quiz pitanja (boduju outcome) ----
      {
        key: 'q1_zadatak', num: 1, type: 'choice',
        title: 'Kad dobiješ novi zadatak na poslu, šta ti je najbitnije?',
        required: true,
        choices: [
          { label: 'Da imam slobodu da ga uradim na svoj način', score: 'logo-design' },
          { label: 'Da razumem zašto se to radi i kako utiče na druge', score: 'ui-ux' },
          { label: 'Da mogu da ga upakujem tako da izgleda i „prodaje“ se dobro', score: 'web-design' },
          { label: 'Da dobijem tačna uputstva šta treba da se uradi', score: 'webflow' }
        ]
      },
      {
        key: 'q2_vecera', num: 2, type: 'choice',
        title: 'Dolaze ti prijatelji na večeru. Kako pristupaš pripremi?',
        required: true,
        choices: [
          { label: 'Spremiću nešto što znam da nikada nisu probali. Volim da improvizujem.', score: 'logo-design' },
          { label: 'Razmišljam kome bi se šta svidelo i pravim po tome.', score: 'ui-ux' },
          { label: 'Bitno mi je da izgleda lepo i da ostavi utisak', score: 'web-design' },
          { label: 'Pitam njih šta hoće da jedu i spremim to. Ne volim da spremam napamet.', score: 'webflow' }
        ]
      },
      {
        key: 'q3_nervira', num: 3, type: 'choice',
        title: 'Šta te najviše nervira kod loših proizvoda ili usluga?',
        required: true,
        choices: [
          { label: 'Kad izgledaju ružno', score: 'logo-design' },
          { label: 'Kad ne znam odmah šta treba da uradim ili gde da kliknem', score: 'ui-ux' },
          { label: 'Kad deluju dosadno, generički ili „bez duše“', score: 'web-design' },
          { label: 'Kad nešto ne radi kako treba', score: 'webflow' }
        ]
      },
      {
        key: 'q4_ucenje', num: 4, type: 'choice',
        title: 'Kad učiš nešto novo, kako ti je najlakše?',
        required: true,
        choices: [
          { label: 'Kroz slike, primere i inspiraciju', score: 'logo-design' },
          { label: 'Kroz objašnjenje „zašto“ i „kako ljudi razmišljaju"', score: 'ui-ux' },
          { label: 'Kroz konkretne primere iz prakse i realne projekte', score: 'web-design' },
          { label: 'Korak po korak, jasno, bez viška priče', score: 'webflow' }
        ]
      },
      {
        key: 'q5_stan', num: 5, type: 'choice',
        title: 'Kada sređuješ stan bitno ti je:',
        required: true,
        choices: [
          { label: 'Najbitnije mi je da je stan estetičan i unikatan', score: 'logo-design' },
          { label: 'Volim da mi je stan praktičan i da je sve na svom logičnom mestu. Recimo, staviću punjač u svaku sobu da bih mogao lako da punim telefon gde god da sam.', score: 'ui-ux' },
          { label: 'Važno mi je da stan bude funkcionalan ali mi je još važnije da čim uđeš u stan znaš da je moj. Ceo vajb stana prati moju energiju.', score: 'web-design' },
          { label: 'Nije mi presudno kako izgleda, bitno mi je da sve radi kako treba i da nemam problema u svakodnevnom korišćenju.', score: 'webflow' }
        ]
      },
      {
        key: 'q6_zabavno', num: 6, type: 'choice',
        title: 'Šta bi ti bilo zabavnije da radiš?',
        required: true,
        choices: [
          { label: 'Dođe ti klijent sa svojim biznisom, recimo otvorio je kafić. Ti treba da im smisliš logo, boje i ceo taj vizuelni deo.', score: 'logo-design' },
          { label: 'Klijent dođe sa idejom za aplikaciju. Ti treba da uklopiš dizajn i ljudsku psihologiju i napraviš aplikaciju koja je laka i logična za korišćenje.', score: 'ui-ux' },
          { label: 'Dizajniraš sajtove gde ćeš ti svojim dizajnom podizati prodaju tvom klijentu. Tvoj posao je da taj sajt ispriča priču o tom proizvodu i da to uradi na zanimljiv način.', score: 'web-design' },
          { label: 'Dobiješ gotov dizajn od dizajnera, a tvoj posao je da ga kao lego kockice složiš da bude pravi sajt koji možeš da otvoriš i na kompjuteru i na telefonu.', score: 'webflow' }
        ]
      },

      // ---- Q7 Mid-quiz prekidač ----
      {
        key: 'q7_continue', num: 7, type: 'choice',
        title: '*Sjajno! Na osnovu tvojih odgovora već znamo koja IT veština ti najviše leži.*',
        description: 'Pre nego što ti je otkrijemo, imamo još par brzih pitanja da vidimo da li ti možemo zaista pomoći da kreneš sa ovom veštinom. Trebaće oko 1 minut. Može?',
        required: true,
        choices: [
          { label: 'DA, idemo dalje', value: 'da_dalje' },
          { label: 'NE, pokaži mi rezultat odmah', value: 'ne_rezultat', skipToEnd: true }
        ]
      },

      // ---- Q8-Q15 Lead kvalifikacija ----
      {
        key: 'q8_situacija', num: 8, type: 'choice',
        title: 'Koja je tvoja trenutna situacija?',
        required: true,
        choices: [
          { label: 'Full-time zaposlen/a' },
          { label: 'Radim part-time' },
          { label: 'Studiram' },
          { label: 'Nezaposlen/a' }
        ]
      },
      {
        key: 'q9_vreme_dnevno', num: 9, type: 'choice',
        title: 'Koliko vremena dnevno imaš za učenje nove veštine?',
        required: true,
        choices: [
          { label: 'Manje od 1h' },
          { label: '1-3' },
          { label: '3-5' },
          { label: '5+' }
        ]
      },
      {
        key: 'q10_kada_zarada', num: 10, type: 'choice',
        title: 'Kada bi da zarađuješ od IT veštine / dizajna?',
        required: true,
        choices: [
          { label: 'Za manje od 6 meseci' },
          { label: '6-12 meseci' },
          { label: '12-24 meseca' },
          { label: 'Jednog dana, sada samo istražujem.' }
        ]
      },
      {
        key: 'q11_zarada_cilj', num: 11, type: 'choice',
        title: 'Koja mesečna zarada bi za tebe bila pobeda?',
        required: true,
        choices: [
          { label: '1.000–2.000€' },
          { label: '2.000–3.000€' },
          { label: '3.000–5.000€' },
          { label: '5.000+€' }
        ]
      },
      {
        key: 'q12_motivacija', num: 12, type: 'scale',
        title: 'Koliko ti je bitno da promeniš karijeru u narednih 12 meseci?',
        required: true,
        scale: { min: 0, max: 10 }
      },
      {
        key: 'q13_budzet', num: 13, type: 'choice',
        title: 'Ako postoji program koji može da te dovede do cilja, šta te najbolje opisuje?',
        required: true,
        choices: [
          { label: 'Imam pristup 1.500-2.000€ za najbolju edukaciju' },
          { label: 'Nemam ušteđevinu ali bih mogao/la da platim na mesečne rate' },
          { label: 'Mogu da investiram ali manji iznos' },
          { label: 'Ne mogu da investiram ništa u svoje znanje trenutno' }
        ]
      },
      {
        key: 'q14_vec_kod_nas', num: 14, type: 'choice',
        title: 'Da li si već kod nas na edukaciji?',
        required: true,
        choices: [
          { label: 'Da, jesam', skipToEnd: true },
          { label: 'Nisam' }
        ]
      },
      {
        key: 'q15_60_dana', num: 15, type: 'choice',
        title: 'Da li želiš da kreneš sa edukacijom u narednih 60 dana?',
        required: true,
        choices: [
          { label: 'Da, želim da krenem u narednih 60 dana' },
          { label: 'Nisam siguran/na' },
          { label: 'Ne, samo istražujem' }
        ]
      },

      // ---- Q16 Instagram (uslovno) ----
      {
        key: 'q16_instagram', num: 16, type: 'text',
        title: 'Unesi svoj Instagram username (nije obavezno)',
        description: 'Ako odlučiš da uneseš svoj Instagram, naš tim će ti poslati poruku da vidimo da li dizajn karijera ima smisla za tebe i kako mi možemo da ti pomognemo da kreneš sa novom veštinom. ☺️\nSvakako, ovo *nije obavezno* i možeš samo da nastaviš i dobiješ rezultat ✌🏻',
        required: false,
        canSkip: true,
        placeholder: 'Type your answer here...'
      },

      // ---- Q17 Telefon (uslovno) ----
      {
        key: 'q17_phone', num: 17, type: 'phone',
        title: 'Unesi svoj broj telefona (nije obavezno)',
        description: 'Ako ostaviš broj, naš tim će ti pisati na WhatsApp / Viber da ti pomognemo da odlučiš da li je dizajn karijera za tebe i koji smer ima smisla. ',
        required: false,
        canSkip: true,
        placeholder: '060 1234567'
      },

      // ---- Q18 Podaci (email/ime) ----
      {
        key: 'q18_kontakt', num: 18, type: 'contact',
        title: 'Podaci',
        description: 'Na email će ti stići rezultat kviza, kao i dodatne lekcije koje će ti pomoći da kreneš sa učenjem idealne veštine za tebe',
        required: true
      }
    ]
  };

  // ====================================================================
  // STATE & SESSION
  // ====================================================================
  var state = {
    currentIdx: -1,            // -1 = welcome
    answers: {},
    visitedKeys: [],           // redosled kojim su pitanja zaista prikazana (za progress)
    scores: { 'web-design': 0, 'logo-design': 0, 'ui-ux': 0, 'webflow': 0 },
    sessionId: generateSessionId(),
    startedAt: new Date().toISOString(),
    submitted: false,
    exitedEarly: false,
    // Drop Tracker API
    serverSessionId: null,      // UUID iz Quiz API-ja (popunjen posle createSession)
    lastStepEnteredAt: Date.now()
  };

  function generateSessionId() {
    return 'nd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }


  // ====================================================================
  // NAUČIDIZAJN QUIZ API (Drop Tracker integration)
  // Paralelno sa Make webhook-om. Fire-and-forget — kviz nastavlja
  // čak i ako API ne odgovori. Sve greške se logiraju u console.
  // ====================================================================
  var QUIZ_API_URL = 'https://naucidizajn-quiz-api-production.up.railway.app';

  function apiLog(msg, data) {
    if (data !== undefined) console.log('[ND-API]', msg, data);
    else console.log('[ND-API]', msg);
  }

  function apiErr(msg, err) {
    console.warn('[ND-API ERROR]', msg, err);
  }

  // Detektuje device tip iz user agent-a
  function detectDeviceType() {
    var ua = navigator.userAgent || '';
    if (/(tablet|ipad)/i.test(ua)) return 'tablet';
    if (/(mobile|iphone|android)/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // POST /api/sessions — kreira sesiju, vraća UUID
  // Posle uspeha flush-uje pending event queue
  function apiCreateSession() {
    var payload = {
      utm_source:   utmData.utm_source   || null,
      utm_medium:   utmData.utm_medium   || null,
      utm_campaign: utmData.utm_campaign || null,
      utm_content:  utmData.utm_content  || null,
      utm_term:     utmData.utm_term     || null,
      gclid:        utmData.gclid        || null,
      fbclid:       utmData.fbclid       || null,
      referrer:     document.referrer    || null,
      device_type:  detectDeviceType()
    };

    return fetch(QUIZ_API_URL + '/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data && data.success && data.data && data.data.session_id) {
        state.serverSessionId = data.data.session_id;
        apiLog('Session created:', state.serverSessionId);
        // Flush pending events (uglavnom Q1 step_viewed koji je nastao pre createSession-a)
        while (apiEventQueue.length > 0) {
          apiSendEvent(apiEventQueue.shift());
        }
      } else {
        apiErr('createSession bad response:', data);
        apiEventQueue.length = 0; // odbaci queued events
      }
    })
    .catch(function(err) {
      apiErr('createSession failed', err);
      apiEventQueue.length = 0;
    });
  }

  // Queue za event-e koji nastaju pre nego što createSession završi
  var apiEventQueue = [];

  // Interna funkcija za slanje event-a (zahteva da serverSessionId postoji)
  function apiSendEvent(event) {
    var body = {
      session_id: state.serverSessionId,
      event_type: event.event_type,
      step_number: event.step_number,
      step_name: event.step_name,
      time_on_step: event.time_on_step,
      metadata: event.metadata
    };
    try {
      fetch(QUIZ_API_URL + '/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true
      }).catch(function(err) { apiErr('logEvent failed', err); });
    } catch (err) {
      apiErr('logEvent exception', err);
    }
  }

  // POST /api/events — fire-and-forget sa queue fallback-om
  function apiLogEvent(eventType, stepNumber, stepName, metadata) {
    var event = {
      event_type: eventType,
      step_number: stepNumber || null,
      step_name: stepName || null,
      time_on_step: Date.now() - state.lastStepEnteredAt,
      metadata: metadata || {}
    };
    if (state.serverSessionId) {
      apiSendEvent(event);
    } else {
      // Queue dok sessionId ne stigne (uglavnom Q1 step_viewed)
      apiEventQueue.push(event);
    }
  }

  // POST /api/sessions/:id/complete — finalizacija
  function apiCompleteSession(payload) {
    if (!state.serverSessionId) return;
    try {
      fetch(QUIZ_API_URL + '/api/sessions/' + state.serverSessionId + '/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function(err) { apiErr('completeSession failed', err); });
    } catch (err) {
      apiErr('completeSession exception', err);
    }
  }

  // Hardcoded mapping step_name → step_number iz schema_config-a
  // (jer field.num ne pokriva welcome, q18_kontakt, ni lead_submitted u svim slučajevima)
  var ND_STEP_NUMBERS = {
    'q1_zadatak': 1,
    'q2_vecera': 2,
    'q3_nervira': 3,
    'q4_ucenje': 4,
    'q5_stan': 5,
    'q6_zabavno': 6,
    'q7_continue': 7,
    'q8_situacija': 8,
    'q9_vreme_dnevno': 9,
    'q10_kada_zarada': 10,
    'q11_zarada_cilj': 11,
    'q12_motivacija': 12,
    'q13_budzet': 13,
    'q14_vec_kod_nas': 14,
    'q15_60_dana': 15,
    'q16_instagram': 16,
    'q17_phone': 17,
    'q18_kontakt': 18,
    'lead_submitted': 19
  };


  // ====================================================================
  // UTM / hidden fields
  // ====================================================================
  function captureUtm() {
    var p = new URLSearchParams(window.location.search);
    var utm = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'].forEach(function(k){
      var v = p.get(k);
      if (v) utm[k] = v;
    });
    return utm;
  }
  var utmData = captureUtm();

  // ====================================================================
  // FACEBOOK PIXEL
  // ====================================================================
  function initFbPixel() {
    if (!ND_CONFIG.fbPixelId) return;
    if (ND_CONFIG.isTestEnv) {
      console.log('[ND Kviz] Pixel init skipped (test env)');
      return;
    }
    if (window.fbq) return; // već učitan
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', ND_CONFIG.fbPixelId);
    window.fbq('track', 'PageView');
  }

  function fbqEvent(name, params) {
    if (ND_CONFIG.isTestEnv) {
      console.log('[ND Kviz] Pixel event (mocked):', name, params);
      return;
    }
    if (window.fbq) {
      try { window.fbq('track', name, params || {}); } catch(e) {}
    }
  }

  // ====================================================================
  // LEAD QUALITY ENGINE (1:1 replika Make.com formule)
  // ====================================================================
  function computeLeadQuality(a) {
    var q9  = a.q9_vreme_dnevno;
    var q10 = a.q10_kada_zarada;
    var q12 = parseInt(a.q12_motivacija, 10);
    var q13 = a.q13_budzet;
    var q15 = a.q15_60_dana;

    // RED — diskvalifikacija (early exit)
    if (q9  === 'Manje od 1h') return { quality: 'red', reason: 'Manje od 1h dnevno' };
    if (q10 === 'Jednog dana, sada samo istražujem.') return { quality: 'red', reason: 'Samo istražuje (Q10)' };
    if (q13 === 'Ne mogu da investiram ništa u svoje znanje trenutno') return { quality: 'red', reason: 'Bez budžeta' };
    if (q15 === 'Ne, samo istražujem') return { quality: 'red', reason: 'Samo istražuje (Q15)' };

    // < 6 meseci grane
    if (q10 === 'Za manje od 6 meseci') {
      if (q12 >= 8) {
        if (q13 === 'Imam pristup 1.500-2.000€ za najbolju edukaciju') {
          if (q15 === 'Da, želim da krenem u narednih 60 dana') return { quality: 'green', reason: '<6m + mot≥8 + 1500-2000€ + Da 60d' };
          if (q15 === 'Nisam siguran/na') return { quality: 'yellow', reason: '<6m + mot≥8 + 1500-2000€ + Nisam siguran' };
          return { quality: 'white', reason: 'fallback (<6m branch)' };
        }
        if (q13 === 'Nemam ušteđevinu ali bih mogao/la da platim na mesečne rate') {
          if (q15 === 'Da, želim da krenem u narednih 60 dana') return { quality: 'green', reason: '<6m + mot≥8 + rate + Da 60d' };
          return { quality: 'white', reason: 'fallback (<6m rate)' };
        }
        if (q13 === 'Mogu da investiram ali manji iznos') {
          if (q15 === 'Da, želim da krenem u narednih 60 dana') return { quality: 'yellow', reason: '<6m + mot≥8 + manji + Da 60d' };
          return { quality: 'white', reason: 'fallback (<6m manji)' };
        }
        return { quality: 'white', reason: 'fallback (<6m mot≥8)' };
      }
      // q12 < 8
      if (q13 === 'Imam pristup 1.500-2.000€ za najbolju edukaciju') {
        if (q15 === 'Da, želim da krenem u narednih 60 dana') return { quality: 'yellow', reason: '<6m + mot<8 + 1500-2000€ + Da 60d' };
        return { quality: 'white', reason: 'fallback (<6m mot<8)' };
      }
      return { quality: 'white', reason: 'fallback (<6m mot<8 no 2k)' };
    }

    // 6-12 meseci grane
    if (q10 === '6-12 meseci') {
      if (q12 >= 8) {
        if (q13 === 'Imam pristup 1.500-2.000€ za najbolju edukaciju') {
          if (q15 === 'Da, želim da krenem u narednih 60 dana') return { quality: 'green', reason: '6-12m + mot≥8 + 1500-2000€ + Da 60d' };
          return { quality: 'white', reason: 'fallback (6-12m 2k no 60d)' };
        }
        if (q13 === 'Nemam ušteđevinu ali bih mogao/la da platim na mesečne rate') {
          if (q15 === 'Da, želim da krenem u narednih 60 dana') return { quality: 'green', reason: '6-12m + mot≥8 + rate + Da 60d' };
          return { quality: 'white', reason: 'fallback (6-12m rate)' };
        }
        return { quality: 'white', reason: 'fallback (6-12m mot≥8)' };
      }
      return { quality: 'white', reason: 'fallback (6-12m mot<8)' };
    }

    // 12-24 meseca grane
    if (q10 === '12-24 meseca') {
      if (q12 >= 8) {
        if (q13 === 'Imam pristup 1.500-2.000€ za najbolju edukaciju') {
          if (q15 === 'Da, želim da krenem u narednih 60 dana') return { quality: 'yellow', reason: '12-24m + mot≥8 + 1500-2000€ + Da 60d' };
        }
      }
      return { quality: 'white', reason: 'fallback (12-24m)' };
    }

    // Default
    return { quality: 'white', reason: 'fallback (default)' };
  }

  // ====================================================================
  // OUTCOME WINNER
  // ====================================================================
  function computeWinningOutcome() {
    var max = -1, winner = null;
    Object.keys(state.scores).forEach(function(k) {
      if (state.scores[k] > max) { max = state.scores[k]; winner = k; }
    });
    return winner || 'web-design'; // fallback
  }

  // ====================================================================
  // FLOW ROUTING (1:1 Typeform logic)
  // ====================================================================
  // Q15 routing: HOT lead -> Q17 (telefon), ostali -> Q16 (Instagram)
  function isHotLeadAfterQ15(a) {
    var q10 = a.q10_kada_zarada;
    var q12 = parseInt(a.q12_motivacija, 10);
    var q13 = a.q13_budzet;
    var q15 = a.q15_60_dana;

    // 1:1 sa Typeform JSON-om (sve unique OR grane konsolidovane)
    // A: Q10 = manje od 6m  (sam po sebi)
    if (q10 === 'Za manje od 6 meseci') return true;
    // B: Q13 = mesečne rate  (sam po sebi — Typeform branch 3, BEZ Q15 uslova)
    if (q13 === 'Nemam ušteđevinu ali bih mogao/la da platim na mesečne rate') return true;
    // C: Q10 = 6-12m + Q13 = 1500-2000€  (Typeform branch 4 — bez Q12 uslova)
    if (q10 === '6-12 meseci' && q13 === 'Imam pristup 1.500-2.000€ za najbolju edukaciju') return true;
    // D: Q10 = 6-12m + Q12>=8 + Q13 = manji iznos + Q15 = Da 60d
    if (q10 === '6-12 meseci' && q12 >= 8 && q13 === 'Mogu da investiram ali manji iznos' && q15 === 'Da, želim da krenem u narednih 60 dana') return true;
    // E: Q10 = 12-24m + Q12>=8 + Q13 = 1500-2000€
    if (q10 === '12-24 meseca' && q12 >= 8 && q13 === 'Imam pristup 1.500-2.000€ za najbolju edukaciju') return true;
    return false;
  }

  // Predviđa ukupan broj koraka na osnovu trenutnih odgovora.
  // Logika: koristi NAJKRAĆU moguću putanju dok ne stignemo do branching point-a.
  // Pre Q7 odgovora: pretpostavlja 'NE, pokaži rezultat' = 8 koraka (kratka putanja)
  // Posle Q7 'NE': ostaje 8 koraka
  // Posle Q7 'DA': pretpostavlja Q14 = 'Da, jesam' = 15 koraka (sledeća kratka putanja)
  // Posle Q14 'Da, jesam': ostaje 15
  // Posle Q14 'Nisam': 17 koraka (Q15 + Q16/Q17 + Q18)
  function predictTotalSteps() {
    var a = state.answers;

    // Q7 odgovor poznat?
    if (a.q7_continue) {
      if (a.q7_continue.skipToEnd) {
        // 'NE, pokaži rezultat' -> Q1...Q7 + Q18 = 8 koraka
        return 8;
      }
      // 'DA, idemo dalje' - Q14 odgovor poznat?
      if (a.q14_vec_kod_nas) {
        if (a.q14_vec_kod_nas.skipToEnd) {
          // 'Da, jesam' -> Q1...Q14 + Q18 = 15 koraka
          return 15;
        }
        // 'Nisam' -> Q1...Q15 + (Q16 ili Q17) + Q18 = 17 koraka
        return 17;
      }
      // Q7 'DA', Q14 nije odgovoreno: pretpostavi 'Da, jesam' (kraća putanja) = 15
      return 15;
    }

    // Pre Q7: pretpostavi 'NE' (najkraća putanja) = 8 koraka
    return 8;
  }

  // Vraća redni broj trenutnog koraka u predviđenoj putanji (Q1 = 1, Q2 = 2, ...)
  function getStepNumberInPath() {
    if (state.currentIdx < 0) return 0;
    var key = FORM.fields[state.currentIdx].key;

    // Linearne pozicije (Q1 = 1, Q2 = 2, ... Q14 = 14)
    var linearMap = {
      'q1_zadatak': 1, 'q2_vecera': 2, 'q3_nervira': 3, 'q4_ucenje': 4,
      'q5_stan': 5, 'q6_zabavno': 6, 'q7_continue': 7, 'q8_situacija': 8,
      'q9_vreme_dnevno': 9, 'q10_kada_zarada': 10, 'q11_zarada_cilj': 11,
      'q12_motivacija': 12, 'q13_budzet': 13, 'q14_vec_kod_nas': 14
    };
    if (linearMap[key]) return linearMap[key];

    // Q15 = pozicija 15
    if (key === 'q15_60_dana') return 15;

    // Q16 ili Q17 = pozicija 16
    if (key === 'q16_instagram' || key === 'q17_phone') return 16;

    // Q18 = poslednja pozicija (zavisi od putanje)
    if (key === 'q18_kontakt') return predictTotalSteps();

    return state.currentIdx + 1;
  }
  function getNextKey(currentKey) {
    var a = state.answers;

    // Q7: skip-to-end (NE pokaži rezultat odmah)
    if (currentKey === 'q7_continue' && a.q7_continue && a.q7_continue.skipToEnd) return 'q18_kontakt';

    // Q14: već je na edukaciji -> pravo na Q18
    if (currentKey === 'q14_vec_kod_nas' && a.q14_vec_kod_nas && a.q14_vec_kod_nas.skipToEnd) return 'q18_kontakt';

    // Q15: smart routing - HOT lead -> Q17 (telefon), COLD -> Q16 (Instagram)
    if (currentKey === 'q15_60_dana') {
      return isHotLeadAfterQ15(getFlatAnswersForRouting()) ? 'q17_phone' : 'q16_instagram';
    }

    // Q16 (Instagram) -> Q18 direktno (preskoči Q17)
    if (currentKey === 'q16_instagram') return 'q18_kontakt';

    // Q17 (Phone) -> Q18 direktno
    if (currentKey === 'q17_phone') return 'q18_kontakt';

    // Q18 -> kraj
    if (currentKey === 'q18_kontakt') return 'END';

    // Default: linearno sledeći u nizu
    var idx = FORM.fields.findIndex(function(f) { return f.key === currentKey; });
    if (idx === -1 || idx === FORM.fields.length - 1) return 'END';
    return FORM.fields[idx + 1].key;
  }

  // ====================================================================
  // RENDERING
  // ====================================================================
  var stage = document.getElementById('nd-stage');
  var progressFill = document.querySelector('#nd-quiz .nd-progress-fill');
  var stepEls = {}; // key -> HTMLElement

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function renderTitle(field) {
    // Replace *text* with <em>text</em>
    var html = escapeHtml(field.title).replace(/\*([^*]+)\*/g, '<em>$1</em>');
    var req = field.required ? '<span class="nd-q-required">*</span>' : '';
    return '<h2 class="nd-q-title">' + html + req + '</h2>';
  }

  // Vraća redni broj koji treba da se prikaže za polje (na osnovu trenutne putanje).
  // Numeracija se računa dinamički — ne koristi se hardkodirano field.num.
  // Razlog: korisnik može da preskoči pitanja, pa trenutni step može biti npr. 8. iako u JSON-u ima broj 18.
  function getDisplayNumber(field) {
    var path = getPredictedPath();
    var idx = path.indexOf(field.key);
    if (idx === -1) return field.num; // fallback ako nije u trenutnoj putanji
    return idx + 1;
  }

  // Vraća listu key-eva u redosledu kojim će biti prikazani u trenutnoj putanji
  function getPredictedPath() {
    var a = state.answers;
    var path = ['q1_zadatak', 'q2_vecera', 'q3_nervira', 'q4_ucenje', 'q5_stan', 'q6_zabavno', 'q7_continue'];

    if (a.q7_continue && a.q7_continue.skipToEnd) {
      path.push('q18_kontakt');
      return path;
    }
    // Q7 'DA' ili neodgovoreno → idemo dalje pretpostavkom DA
    path = path.concat(['q8_situacija','q9_vreme_dnevno','q10_kada_zarada','q11_zarada_cilj','q12_motivacija','q13_budzet','q14_vec_kod_nas']);

    if (a.q14_vec_kod_nas && a.q14_vec_kod_nas.skipToEnd) {
      path.push('q18_kontakt');
      return path;
    }
    // Q14 'Nisam' ili neodgovoreno → idemo dalje pretpostavkom Nisam
    path.push('q15_60_dana');

    // Posle Q15: HOT → telefon, COLD → Instagram (ako je Q15 odgovoren)
    var hotKnown = a.q15_60_dana != null;
    if (hotKnown) {
      path.push(isHotLeadAfterQ15(getFlatAnswersForRouting()) ? 'q17_phone' : 'q16_instagram');
    } else {
      // Pretpostavi Instagram (default - cold) za predikciju brojeva pre Q15 odgovora
      path.push('q16_instagram');
    }

    path.push('q18_kontakt');
    return path;
  }

  // Helper: vraća flat answers koje su dostupne (bez label/value wrapping-a) za routing
  function getFlatAnswersForRouting() {
    var out = {};
    Object.keys(state.answers).forEach(function(k) {
      var v = state.answers[k];
      if (v && typeof v === 'object' && 'label' in v) out[k] = v.label;
      else out[k] = v;
    });
    return out;
  }

  function renderQuestionHeader(field) {
    var displayNum = getDisplayNumber(field);
    var num = '<span class="nd-q-num" aria-hidden="true" data-fieldkey="' + field.key + '">' + displayNum + '</span>';
    var desc = '';
    if (field.description) {
      var descHtml = field.description.replace(/\n/g, '<br>');
      desc = '<p class="nd-q-desc">' + descHtml + '</p>';
    }
    return '<div class="nd-q-row">' + num + renderTitle(field) + '</div>' + desc;
  }

  // Update brojevi na svim step-ovima (poziva se nakon svakog odgovora)
  function updateAllStepNumbers() {
    Object.keys(stepEls).forEach(function(key) {
      var el = stepEls[key];
      if (!el) return;
      var numEl = el.querySelector('.nd-q-num[data-fieldkey="' + key + '"]');
      if (!numEl) return;
      var field = FORM.fields.find(function(f) { return f.key === key; });
      if (!field) return;
      numEl.textContent = getDisplayNumber(field);
    });
  }

  function letterFor(i) { return String.fromCharCode(65 + i); /* A,B,C,D */ }

  function renderChoice(choice, idx) {
    return '<button type="button" class="nd-choice" data-idx="' + idx + '">' +
             '<span class="nd-choice-key">' + letterFor(idx) + '</span>' +
             '<span class="nd-choice-label">' + escapeHtml(choice.label) + '</span>' +
           '</button>';
  }

  function renderEnterHint() {
    return '<span class="nd-enter-hint">pritisni <kbd>Enter ↵</kbd></span>';
  }

  function buildStepHtml(field) {
    var inner = '';

    if (field.type === 'choice') {
      inner = renderQuestionHeader(field) +
              '<div class="nd-choices">' + field.choices.map(renderChoice).join('') + '</div>' +
              '<div class="nd-actions"><button type="button" class="nd-btn-primary" disabled><span class="nd-btn-label">Dalje</span></button></div>';
    }
    else if (field.type === 'scale') {
      var btns = '';
      for (var i = field.scale.min; i <= field.scale.max; i++) {
        btns += '<button type="button" class="nd-scale-btn" data-val="' + i + '">' + i + '</button>';
      }
      inner = renderQuestionHeader(field) +
              '<div class="nd-scale">' + btns + '</div>' +
              '<div class="nd-actions"><button type="button" class="nd-btn-primary" disabled><span class="nd-btn-label">Dalje</span></button></div>';
    }
    else if (field.type === 'text') {
      var skipBtnText = field.canSkip
        ? '<button type="button" class="nd-btn-skip" data-skip style="margin-left:auto;background:transparent;color:rgba(255,255,255,0.55);border:1px solid rgba(255,255,255,0.18);padding:10px 22px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;">Preskoči</button>'
        : '';
      var actionsAttrText = field.canSkip
        ? ' style="display:flex;align-items:center;gap:12px;"'
        : '';
      inner = renderQuestionHeader(field) +
              '<div class="nd-input-wrap">' +
                '<input type="text" class="nd-input" placeholder="' + escapeHtml(field.placeholder || '') + '" autocomplete="off">' +
              '</div>' +
              '<div class="nd-actions"' + actionsAttrText + '><button type="button" class="nd-btn-primary"><span class="nd-btn-label">Dalje</span></button>' + skipBtnText + '</div>';
    }
    else if (field.type === 'phone') {
      var skipBtnPhone = field.canSkip
        ? '<button type="button" class="nd-btn-skip" data-skip style="margin-left:auto;background:transparent;color:rgba(255,255,255,0.55);border:1px solid rgba(255,255,255,0.18);padding:10px 22px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;">Preskoči</button>'
        : '';
      var actionsAttrPhone = field.canSkip
        ? ' style="display:flex;align-items:center;gap:12px;"'
        : '';
      inner = renderQuestionHeader(field) +
              '<div class="nd-phone-row">' +
                '<button type="button" class="nd-country-trigger" aria-expanded="false" aria-haspopup="listbox">' +
                  '<span class="nd-flag" data-flag></span>' +
                  '<svg class="nd-flag-chevron" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                    '<path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                  '</svg>' +
                '</button>' +
                '<input type="tel" class="nd-input nd-phone-input" placeholder="' + escapeHtml(field.placeholder || '') + '" inputmode="tel" autocomplete="tel-national">' +
                '<div class="nd-country-dropdown" hidden>' +
                  '<div class="nd-country-search-wrap">' +
                    '<input type="text" class="nd-country-search" placeholder="Search countries">' +
                    '<svg class="nd-country-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
                  '</div>' +
                  '<div class="nd-country-list" role="listbox"></div>' +
                '</div>' +
              '</div>' +
              '<div class="nd-actions"' + actionsAttrPhone + '><button type="button" class="nd-btn-primary"><span class="nd-btn-label">Dalje</span></button>' + skipBtnPhone + '</div>';
    }
    else if (field.type === 'contact') {
      inner = renderQuestionHeader(field) +
              '<div class="nd-contact-grid">' +
                '<div class="nd-contact-field">' +
                  '<label class="nd-input-label">Ime<span class="nd-required">*</span></label>' +
                  '<div class="nd-input-wrap"><input type="text" class="nd-input" data-firstname autocomplete="given-name" placeholder="Petar"></div>' +
                '</div>' +
                '<div class="nd-contact-field">' +
                  '<label class="nd-input-label">Email<span class="nd-required">*</span></label>' +
                  '<div class="nd-input-wrap"><input type="email" class="nd-input" data-email autocomplete="email" inputmode="email" placeholder="email@gmail.com"></div>' +
                '</div>' +
              '</div>' +
              '<div class="nd-actions"><button type="button" class="nd-btn-primary" disabled><span class="nd-btn-label">Dalje</span></button></div>' +
              '<div class="nd-error" hidden></div>';
    }

    var stepEl = document.createElement('div');
    stepEl.className = 'nd-step';
    stepEl.dataset.key = field.key;
    stepEl.innerHTML = '<div class="nd-step-inner">' + inner + '</div>';
    return stepEl;
  }

  function buildWelcomeStep() {
    var paragraphsHtml = (FORM.welcome.paragraphs || []).map(function(p) {
      // p može sadržati <strong> tagove — ne escape-ujemo u potpunosti
      return '<p class="nd-welcome-desc">' + p + '</p>';
    }).join('');

    var clockSvg = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>' +
      '<path d="M8 4.5V8L10 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';

    var inner =
      '<div class="nd-welcome">' +
        '<img src="https://naucidizajn.github.io/quiz/images/welcome-image.png" alt="Nau\u010Di Dizajn" style="display:block;max-width:480px;width:100%;height:auto;margin:0 auto 24px;">' +
        '<h1 class="nd-welcome-title">' + escapeHtml(FORM.welcome.title) + '</h1>' +
        paragraphsHtml +
        '<div class="nd-actions"><button type="button" class="nd-btn-primary" data-welcome-start><span class="nd-btn-label">' + escapeHtml(FORM.welcome.buttonText) + '</span></button></div>' +
        '<div class="nd-time-pill">' + clockSvg + ' ' + escapeHtml(FORM.welcome.timeText) + '</div>' +
      '</div>';
    var el = document.createElement('div');
    el.className = 'nd-step';
    el.dataset.key = '__welcome';
    el.innerHTML = '<div class="nd-step-inner">' + inner + '</div>';
    return el;
  }

  function buildLoadingStep() {
    var el = document.createElement('div');
    el.className = 'nd-step';
    el.dataset.key = '__loading';
    el.innerHTML =
      '<div class="nd-step-inner"><div class="nd-loading">' +
        '<div class="nd-spinner"></div>' +
        '<div class="nd-loading-title">Tvoj rezultat se priprema...</div>' +
        '<div class="nd-error" hidden></div>' +
      '</div></div>';
    return el;
  }

  function mountAllSteps() {
    var welcome = buildWelcomeStep();
    stage.appendChild(welcome);
    stepEls.__welcome = welcome;

    FORM.fields.forEach(function(f) {
      var el = buildStepHtml(f);
      stage.appendChild(el);
      stepEls[f.key] = el;
      attachStepBehavior(f, el);
    });

    var loading = buildLoadingStep();
    stage.appendChild(loading);
    stepEls.__loading = loading;

    // Welcome start button
    welcome.querySelector('[data-welcome-start]').addEventListener('click', function() {
      document.getElementById('nd-quiz').classList.add('nd-quiz-started');
      // Drop Tracker: kreiraj sesiju u Quiz API (paralelno sa Make-om)
      apiCreateSession();
      goToKey('q1_zadatak');
    });

    showStepEl(welcome);
  }

  // ====================================================================
  // STEP BEHAVIOR (per type)
  // ====================================================================
  function attachStepBehavior(field, el) {
    // Inject back button na svim step-ovima
    var actions = el.querySelector('.nd-actions');
    if (actions && !actions.querySelector('.nd-btn-back')) {
      var backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'nd-btn-back';
      backBtn.setAttribute('aria-label', 'Nazad');
      backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
      backBtn.addEventListener('click', goBack);
      actions.insertBefore(backBtn, actions.firstChild);
    }

    if (field.type === 'choice') {
      var btns = Array.from(el.querySelectorAll('.nd-choice'));
      var ok   = el.querySelector('.nd-btn-primary');

      btns.forEach(function(b, i) {
        b.addEventListener('click', function() {
          btns.forEach(function(x){ x.classList.remove('nd-selected'); });
          b.classList.add('nd-selected');
          ok.removeAttribute('disabled');
          // Auto-advance for choice questions (Typeform behavior)
          setTimeout(function(){ submitChoice(field, i); }, 280);
        });
      });

      ok.addEventListener('click', function() {
        var sel = el.querySelector('.nd-choice.nd-selected');
        if (sel) submitChoice(field, parseInt(sel.dataset.idx, 10));
      });
    }
    else if (field.type === 'scale') {
      var sbtns = Array.from(el.querySelectorAll('.nd-scale-btn'));
      var sok   = el.querySelector('.nd-btn-primary');
      var sval  = null;
      var advanceTimer = null;

      sbtns.forEach(function(b) {
        b.addEventListener('click', function() {
          sbtns.forEach(function(x){ x.classList.remove('nd-selected'); });
          b.classList.add('nd-selected');
          sval = parseInt(b.dataset.val, 10);
          sok.removeAttribute('disabled');

          // Cancel pending auto-advance (npr. kad korisnik brzo klikne više brojeva)
          // i pokreni novi. Bez state.answers provere — to bi blokiralo back navigaciju.
          if (advanceTimer) clearTimeout(advanceTimer);
          advanceTimer = setTimeout(function() {
            state.answers[field.key] = sval;
            advance(field.key);
          }, 280);
        });
      });

      sok.addEventListener('click', function() {
        if (sval == null) return;
        if (advanceTimer) clearTimeout(advanceTimer);
        state.answers[field.key] = sval;
        advance(field.key);
      });
    }
    else if (field.type === 'text') {
      var tin = el.querySelector('.nd-input');
      var tok = el.querySelector('.nd-btn-primary');
      var tskip = el.querySelector('[data-skip]');
      tok.addEventListener('click', function() {
        var v = (tin.value || '').trim();
        state.answers[field.key] = v; // može biti prazno (opciono)
        advance(field.key);
      });
      if (tskip) {
        tskip.addEventListener('click', function() {
          state.answers[field.key] = '';
          advance(field.key);
        });
      }
      tin.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); tok.click(); }
      });
    }
    else if (field.type === 'phone') {
      var pin = el.querySelector('.nd-phone-input');
      var pok = el.querySelector('.nd-btn-primary');
      var trigger = el.querySelector('.nd-country-trigger');
      var flagEl = el.querySelector('[data-flag]');
      var dropdown = el.querySelector('.nd-country-dropdown');
      var searchInput = el.querySelector('.nd-country-search');
      var listEl = el.querySelector('.nd-country-list');

      // Default zemlja: Srbija (radi i kao fallback ako IP detection padne)
      var selectedCountry = findCountryByCode('RS');

      // Renderuj zastavicu i čuvaj selected stanje
      function setCountry(country) {
        if (!country) return;
        selectedCountry = country;
        flagEl.innerHTML = flagHtml(country.c);
        flagEl.title = country.n + ' (' + country.d + ')';
        // Update selected u listi
        var items = listEl.querySelectorAll('.nd-country-item');
        items.forEach(function(item) {
          item.classList.toggle('nd-selected', item.dataset.code === country.c);
        });
      }

      // Renderuj listu zemalja (sa filterom za search)
      function renderList(filterText) {
        var filter = (filterText || '').trim().toLowerCase();
        var html = '';
        var matched = 0;
        for (var i = 0; i < ND_COUNTRIES.length; i++) {
          var c = ND_COUNTRIES[i];
          if (filter && c.n.toLowerCase().indexOf(filter) === -1 && c.d.indexOf(filter) === -1) continue;
          var isSelected = selectedCountry && c.c === selectedCountry.c;
          html += '<button type="button" class="nd-country-item' + (isSelected ? ' nd-selected' : '') + '" ' +
                    'data-code="' + c.c + '" data-dial="' + c.d + '" role="option">' +
                    '<span class="nd-country-item-flag">' + flagEmoji(c.c) + '</span>' +
                    '<span class="nd-country-item-name">' + escapeHtml(c.n) + '</span>' +
                    '<span class="nd-country-item-dial">' + c.d + '</span>' +
                  '</button>';
          matched++;
        }
        if (matched === 0) {
          html = '<div class="nd-country-empty">No countries found</div>';
        }
        listEl.innerHTML = html;
        // Scroll selected u vidno polje
        if (!filter) {
          var sel = listEl.querySelector('.nd-country-item.nd-selected');
          if (sel) {
            setTimeout(function() {
              sel.scrollIntoView({ block: 'center', behavior: 'instant' });
            }, 0);
          }
        }
      }

      // Otvori/zatvori dropdown
      function openDropdown() {
        dropdown.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        renderList('');
        searchInput.value = '';
        setTimeout(function() { searchInput.focus(); }, 50);
      }
      function closeDropdown() {
        dropdown.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }

      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (dropdown.hidden) openDropdown();
        else closeDropdown();
      });

      // Klik na stavku liste
      listEl.addEventListener('click', function(e) {
        var item = e.target.closest('.nd-country-item');
        if (!item) return;
        var country = findCountryByCode(item.dataset.code);
        if (country) {
          setCountry(country);
          closeDropdown();
          pin.focus();
        }
      });

      // Search filter
      searchInput.addEventListener('input', function() {
        renderList(searchInput.value);
      });
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { closeDropdown(); trigger.focus(); }
        if (e.key === 'Enter') {
          e.preventDefault();
          var firstItem = listEl.querySelector('.nd-country-item');
          if (firstItem) firstItem.click();
        }
      });

      // Klik van dropdown-a → zatvori
      document.addEventListener('click', function(e) {
        if (!dropdown.hidden && !dropdown.contains(e.target) && !trigger.contains(e.target)) {
          closeDropdown();
        }
      });

      // Submit
      pok.addEventListener('click', function() {
        var raw = (pin.value || '').trim();
        var cleaned = raw.replace(/[\s\-\(\)]/g, '');
        // Ukloni vodeću nulu (lokalni format: 060 -> 60)
        cleaned = cleaned.replace(/^0+/, '');
        var dialCode = selectedCountry ? selectedCountry.d : '+381';
        var full = cleaned ? (dialCode + cleaned) : '';
        state.answers[field.key] = full;
        // Sačuvaj i country code za payload
        state.answers[field.key + '_country'] = selectedCountry ? selectedCountry.c : '';
        advance(field.key);
      });
      // Preskoči
      var pskip = el.querySelector('[data-skip]');
      if (pskip) {
        pskip.addEventListener('click', function() {
          state.answers[field.key] = '';
          state.answers[field.key + '_country'] = '';
          advance(field.key);
        });
      }
      pin.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); pok.click(); }
      });

      // Inicijalno: postavi default Srbija, pa pokušaj IP detection
      setCountry(selectedCountry);
      detectCountryByIP(function(code) {
        if (code) {
          var detected = findCountryByCode(code);
          if (detected) {
            setCountry(detected);
            console.log('[ND Kviz] Country auto-detected from IP:', detected.n);
          }
        }
      });
    }
    else if (field.type === 'contact') {
      var firstIn = el.querySelector('input[data-firstname]');
      var emailIn = el.querySelector('input[data-email]');
      var ok2     = el.querySelector('.nd-btn-primary');
      var ok2Lbl  = ok2.querySelector('.nd-btn-label');
      var errEl   = el.querySelector('.nd-error');

      // Two-step submit state: 'ok' → first click confirms, 'submit' → second click sends
      var submitStage = 'ok';

      function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }

      function valid() {
        var fn = (firstIn.value || '').trim();
        var em = (emailIn.value || '').trim();
        return fn.length >= 1 && isValidEmail(em);
      }
      function refresh() {
        ok2.disabled = !valid();
        // Ako korisnik menja polja nakon prvog klika OK → resetuj na "OK"
        if (submitStage === 'submit') {
          submitStage = 'ok';
          ok2Lbl.textContent = 'Dalje';
        }
      }
      firstIn.addEventListener('input', refresh);
      emailIn.addEventListener('input', refresh);

      ok2.addEventListener('click', function() {
        if (!valid()) return;

        if (submitStage === 'ok') {
          // Prvi klik: pretvori OK u Submit
          submitStage = 'submit';
          ok2Lbl.textContent = 'Submit';
          // Fokus na button da Enter pokrene drugi klik
          ok2.focus();
          return;
        }

        // Drugi klik (submit): šalji formu. Email uzimamo iz email input-a.
        var emailVal = emailIn.value.trim();
        var firstNameVal = firstIn.value.trim();
        state.answers[field.key] = {
          firstName: firstNameVal,
          lastName: '',
          name: firstNameVal,
          email: emailVal
        };
        ok2.disabled = true;
        errEl.hidden = true;
        finalize().catch(function(err) {
          errEl.textContent = 'Greška pri slanju. Pokušaj ponovo.';
          errEl.hidden = false;
          ok2.disabled = false;
          console.error('[ND-Quiz] submit error:', err);
        });
      });
      // Ctrl+Enter on any field = submit (Typeform-style)
      [firstIn, emailIn].forEach(function(input) {
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && valid()) {
            e.preventDefault();
            // Force to submit stage and click
            if (submitStage === 'ok') { submitStage = 'submit'; ok2Lbl.textContent = 'Submit'; }
            ok2.click();
          }
        });
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && valid()) {
            e.preventDefault();
            ok2.click();
          }
        });
      });
    }
  }

  function submitChoice(field, idx) {
    var choice = field.choices[idx];
    state.answers[field.key] = {
      label: choice.label,
      value: choice.value || choice.label,
      score: choice.score || null,
      skipToEnd: !!choice.skipToEnd
    };
    // Update outcome scores za Q1-Q6
    if (choice.score && state.scores[choice.score] != null) {
      state.scores[choice.score] += 1;
    }
    advance(field.key);
  }

  function advance(currentKey) {
    // Drop Tracker: log step_completed sa skip detekcijom
    if (ND_STEP_NUMBERS[currentKey]) {
      var answer = state.answers[currentKey];
      var metadata = {};

      // Skip detekcija za Q7 i Q14 (skipToEnd flag na izabranoj opciji)
      if (currentKey === 'q7_continue' && answer && answer.skipToEnd) {
        metadata.is_skip = true;
        metadata.skip_to = 'q18_kontakt';
      } else if (currentKey === 'q14_vec_kod_nas' && answer && answer.skipToEnd) {
        metadata.is_skip = true;
        metadata.skip_to = 'q18_kontakt';
      } else if ((currentKey === 'q16_instagram' || currentKey === 'q17_phone') && (!answer || answer === '')) {
        // Skip detekcija za Q16/Q17 (prazan odgovor = skip)
        metadata.is_skip = true;
      }

      // Snimi odgovor (ako nije skip)
      if (answer !== undefined && answer !== '' && !metadata.is_skip) {
        if (answer && typeof answer === 'object' && 'label' in answer) {
          metadata.answer = answer.label;
        } else if (typeof answer === 'object') {
          metadata.answer = JSON.stringify(answer);
        } else {
          metadata.answer = answer;
        }
      }

      apiLogEvent('step_completed', ND_STEP_NUMBERS[currentKey], currentKey, metadata);
    }

    // Update brojevi na svim step-ovima jer se putanja možda promenila
    updateAllStepNumbers();
    var nextKey = getNextKey(currentKey);
    if (nextKey === 'END') {
      // ovo se dešava samo nakon Q18
      return;
    }
    goToKey(nextKey);
  }

  // ====================================================================
  // STEP TRANSITIONS
  // ====================================================================
  var activeKey = '__welcome';

  function showStepEl(el) {
    el.classList.add('nd-active');
  }

  function goToKey(key) {
    var prevEl = stepEls[activeKey];
    var nextEl = stepEls[key];
    if (!nextEl) { console.warn('[ND-Quiz] unknown step key:', key); return; }

    if (prevEl && prevEl !== nextEl) {
      prevEl.classList.add('nd-leaving');
      prevEl.classList.remove('nd-active');
      // čisti leaving klasu nakon tranzicije
      setTimeout(function() { prevEl.classList.remove('nd-leaving'); }, 600);
    }

    activeKey = key;
    state.visitedKeys.push(key);
    nextEl.classList.add('nd-active');

    // Drop Tracker: log step_viewed (samo za prave kviz step-ove, ne welcome/loading)
    if (ND_STEP_NUMBERS[key]) {
      apiLogEvent('step_viewed', ND_STEP_NUMBERS[key], key, {});
      state.lastStepEnteredAt = Date.now(); // reset timer za time_on_step
    }

    // Focus prvi interaktivni element
    setTimeout(function() {
      var input = nextEl.querySelector('input');
      if (input) input.focus();
    }, 200);

    updateProgress();
    updateCurrentIdx(key);
  }

  // Vrati se na prethodni step (poslednji u visitedKeys, pre trenutnog)
  function goBack() {
    if (state.visitedKeys.length < 2) return;
    // Trenutni je poslednji u visitedKeys; pretposlednji je prethodni
    var currentKey = state.visitedKeys[state.visitedKeys.length - 1];
    var prevKey    = state.visitedKeys[state.visitedKeys.length - 2];
    if (!prevKey) return;

    var prevEl = stepEls[currentKey];
    var nextEl = stepEls[prevKey];
    if (!nextEl) return;

    if (prevEl) {
      prevEl.classList.add('nd-leaving');
      prevEl.classList.remove('nd-active');
      setTimeout(function() { prevEl.classList.remove('nd-leaving'); }, 600);
    }

    // Pop trenutni iz visitedKeys (da ostane tačan progress brojač)
    state.visitedKeys.pop();
    activeKey = prevKey;
    nextEl.classList.add('nd-active');

    setTimeout(function() {
      var input = nextEl.querySelector('input');
      if (input) input.focus();
    }, 200);

    updateAllStepNumbers();
    updateProgress();
    updateCurrentIdx(prevKey);
  }

  function updateCurrentIdx(key) {
    state.currentIdx = FORM.fields.findIndex(function(f) { return f.key === key; });
  }

  function updateProgress() {
    // Dinamičko računanje na osnovu predviđene putanje (1:1 Typeform behavior)
    var idx = state.currentIdx;
    if (idx < 0) {
      progressFill.style.width = '0%';
      progressFill.style.minWidth = '0';
      return;
    }
    var stepNumber = getStepNumberInPath();
    var totalSteps = predictTotalSteps();
    var pct = Math.min(100, Math.round((stepNumber / totalSteps) * 100));
    // Ostavi gap od 8px između fill i track
    progressFill.style.width = 'calc(' + pct + '% - 4px)';
    progressFill.style.minWidth = pct > 0 ? '8px' : '0';
  }

  // ====================================================================
  // KEYBOARD NAV
  // ====================================================================
  document.addEventListener('keydown', function(e) {
    var activeEl = stepEls[activeKey];
    if (!activeEl) return;

    var key = activeKey;
    var field = FORM.fields.find(function(f) { return f.key === key; });

    // A/B/C/D shortcut za choice
    if (field && field.type === 'choice' && /^[a-zA-Z]$/.test(e.key)) {
      var letter = e.key.toUpperCase().charCodeAt(0) - 65;
      var choices = activeEl.querySelectorAll('.nd-choice');
      if (letter >= 0 && letter < choices.length) {
        e.preventDefault();
        choices[letter].click();
        return;
      }
    }

    // Enter na choice (ako je izabrano) -> OK
    if (field && field.type === 'choice' && e.key === 'Enter') {
      var sel = activeEl.querySelector('.nd-choice.nd-selected');
      if (sel) {
        e.preventDefault();
        activeEl.querySelector('.nd-btn-primary').click();
      }
    }

    // Enter na scale (ako je izabran broj) -> OK
    if (field && field.type === 'scale' && e.key === 'Enter') {
      var ssel = activeEl.querySelector('.nd-scale-btn.nd-selected');
      if (ssel) {
        e.preventDefault();
        activeEl.querySelector('.nd-btn-primary').click();
      }
      // brojčani shortcut 0-9 (10 = e + 0)
    }
    if (field && field.type === 'scale' && /^[0-9]$/.test(e.key)) {
      var v = parseInt(e.key, 10);
      var b = activeEl.querySelector('.nd-scale-btn[data-val="' + v + '"]');
      if (b) { e.preventDefault(); b.click(); }
    }

    // Enter na welcome -> kreni
    if (key === '__welcome' && e.key === 'Enter') {
      e.preventDefault();
      activeEl.querySelector('[data-welcome-start]').click();
    }
  });

  // ====================================================================
  // PARTIAL EXIT TRACKING (sendBeacon)
  // ====================================================================
  function buildPayload(opts) {
    opts = opts || {};
    var isPartial = !!opts.partial;

    // Kontakt podaci ako su uneti
    var contact = state.answers.q18_kontakt || {};
    var instagram = state.answers.q16_instagram || '';
    var phone = state.answers.q17_phone || '';
    var phoneCountry = state.answers.q17_phone_country || '';
    // Email iz contact step-a (Q18)
    var email = contact.email || '';

    var payload = {
      submitted_at: new Date().toISOString(),
      started_at: state.startedAt,
      form_id: ND_CONFIG.formId,
      session_id: state.sessionId,

      is_partial: isPartial,
      partial_reason: opts.partialReason || '',

      completed_full_quiz: !!opts.complete,
      exited_early: !!opts.exitedEarly,
      visited_count: state.visitedKeys.length,

      contact: {
        first_name: contact.firstName || '',
        last_name: contact.lastName || '',
        name: contact.name || '',
        email: email,
        phone: phone,
        phone_country: phoneCountry,
        instagram: instagram
      },

      answers: getAnswersWithQuestionLabels(),

      utm: utmData,
      page_url: window.location.href,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent
    };

    // Outcome/scores/lead_quality samo kod full submit-a (partial nema dovoljno odgovora)
    if (!isPartial) {
      var winner = computeWinningOutcome();
      var lq = computeLeadQuality(getFlatAnswers());
      payload.outcome = {
        id: winner,
        title: FORM.outcomes[winner].title,
        redirect_url: FORM.outcomes[winner].redirect
      };
      payload.scores = state.scores;
      payload.lead_quality = lq.quality;
      payload.lead_quality_reason = lq.reason;
    }

    return payload;
  }

  function getFlatAnswers() {
    var out = {};
    Object.keys(state.answers).forEach(function(k) {
      var v = state.answers[k];
      if (v && typeof v === 'object' && 'label' in v) {
        out[k] = v.label;
      } else {
        out[k] = v;
      }
    });
    return out;
  }

  // Mapa: interni key -> celo pitanje (za webhook payload).
  // Q7 je mid-quiz prekidač, Q12 je skala (broj 0-10), Q16/Q17 su opcionalni kontakt.
  // Q18 (kontakt) ne ide u 'answers' jer već postoji u 'contact' bloku payload-a.
  var ND_QUESTION_LABELS = {
    'q1_zadatak':       'Kad dobiješ novi zadatak na poslu, šta ti je najbitnije?',
    'q2_vecera':        'Dolaze ti prijatelji na večeru. Kako pristupaš pripremi?',
    'q3_nervira':       'Šta te najviše nervira kod loših proizvoda ili usluga?',
    'q4_ucenje':        'Kad učiš nešto novo, kako ti je najlakše?',
    'q5_stan':          'Kada sređuješ stan bitno ti je:',
    'q6_zabavno':       'Šta bi ti bilo zabavnije da radiš?',
    'q7_continue':      'Da li želiš da nastaviš sa kvizom?',
    'q8_situacija':     'Koja je tvoja trenutna situacija?',
    'q9_vreme_dnevno':  'Koliko vremena dnevno možeš da posvetiš učenju?',
    'q10_kada_zarada':  'Kada bi da zarađuješ od IT veštine / dizajna?',
    'q11_zarada_cilj':  'Koja mesečna zarada bi za tebe bila pobeda?',
    'q12_motivacija':   'Koliko ti je bitno da promeniš karijeru u narednih 12 meseci?',
    'q13_budzet':       'Ako postoji program koji može da te dovede do cilja, šta te najbolje opisuje?',
    'q14_vec_kod_nas':  'Da li si već kod nas na edukaciji?',
    'q15_60_dana':      'Da li želiš da kreneš sa edukacijom u narednih 60 dana?',
    'q16_instagram':    'Unesi svoj Instagram username',
    'q17_phone':        'Unesi svoj broj telefona',
    'q17_phone_country':'Zemlja telefona (ISO kod)'
  };

  // Vraća answers objekat sa celim pitanjima kao ključevima (za webhook).
  // Preskaće Q18 (kontakt) jer već postoji u 'contact' bloku payload-a.
  function getAnswersWithQuestionLabels() {
    var flat = getFlatAnswers();
    var out = {};
    Object.keys(flat).forEach(function(internalKey) {
      if (internalKey === 'q18_kontakt') return; // skip — već u 'contact'
      var label = ND_QUESTION_LABELS[internalKey] || internalKey;
      out[label] = flat[internalKey];
    });
    return out;
  }

  function sendBeaconJson(url, payload) {
    if (!url || url.indexOf('REPLACE') !== -1) return false; // nije konfigurisano
    try {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      return navigator.sendBeacon(url, blob);
    } catch(e) { return false; }
  }

  function sendFetch(url, payload, timeoutMs) {
    if (ND_CONFIG.isTestEnv) {
      console.log('%c[ND Kviz] Webhook (TEST - not sent):', 'color:#DBFF00;font-weight:bold');
      console.log(payload);
      return Promise.resolve({ ok: true, _test: true });
    }
    if (!url || url.indexOf('REPLACE') !== -1) return Promise.reject(new Error('Webhook URL not configured'));
    var ctrl = new AbortController();
    var t = setTimeout(function(){ ctrl.abort(); }, timeoutMs || 8000);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
      keepalive: true
    }).finally(function(){ clearTimeout(t); });
  }

  // Partial response slanje pri napuštanju (visibilitychange + beforeunload)
  function maybeSendPartial() {
    if (!ND_CONFIG.sendOnExit) return;
    if (state.submitted) return;
    if (state.visitedKeys.length === 0) return;
    state.exitedEarly = true;
    var payload = buildPayload({
      complete: false,
      exitedEarly: true,
      partial: true,
      partialReason: 'exited_early'
    });
    if (ND_CONFIG.isTestEnv) {
      console.log('[ND Kviz] Exit-partial response (TEST - not sent):', payload);
      return;
    }
    sendBeaconJson(ND_CONFIG.webhookUrl, payload);
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') maybeSendPartial();
  });
  window.addEventListener('pagehide', maybeSendPartial);

  // ====================================================================
  // FINAL SUBMIT
  // ====================================================================
  function finalize() {
    state.submitted = true;
    fbqEvent('Lead', { content_name: 'Quiz Completed' });

    // Prikaži loading screen
    var prev = stepEls[activeKey];
    if (prev) { prev.classList.add('nd-leaving'); prev.classList.remove('nd-active'); }
    activeKey = '__loading';
    stepEls.__loading.classList.add('nd-active');
    progressFill.style.width = '100%';

    var payload = buildPayload({ complete: true, exitedEarly: false });

    // ============================================
    // DROP TRACKER: completeSession + lead_submitted event
    // Fire-and-forget — paralelno sa Make webhook-om
    // ============================================
    var contact = payload.contact || {};
    var winner = payload.outcome || {};
    apiCompleteSession({
      first_name: contact.first_name || null,
      last_name: contact.last_name || null,
      name: contact.name || null,
      email: contact.email || null,
      phone: contact.phone || null,
      phone_country: contact.phone_country || null,
      instagram: contact.instagram || null,
      outcome: winner.id || null,
      outcome_scores: payload.scores || {},
      lead_quality: payload.lead_quality || null,
      lead_quality_reason: payload.lead_quality_reason || null,
      answers: payload.answers || {}
    });
    apiLogEvent('lead_submitted', 19, 'lead_submitted', {
      outcome: winner.id || null,
      lead_quality: payload.lead_quality || null
    });

    return sendFetch(ND_CONFIG.webhookUrl, payload, ND_CONFIG.submitTimeoutMs)
      .catch(function(err) {
        // Ako fetch ne uspe, beacon kao backup
        sendBeaconJson(ND_CONFIG.webhookUrl, payload);
        // Ne bacamo grešku korisniku — i dalje ga redirektujemo (lead je već zabeležen ili će se zabeležiti)
        console.warn('[ND-Quiz] webhook fetch failed, beacon attempted:', err);
      })
      .then(function() {
        if (ND_CONFIG.redirectAfterSubmit) {
          var url = payload.outcome.redirect_url;
          // Prosleđujemo session i outcome u URL-u (za rezultat stranicu)
          var sep = url.indexOf('?') === -1 ? '?' : '&';
          var extra = 'sid=' + encodeURIComponent(state.sessionId) +
                      '&lq=' + encodeURIComponent(payload.lead_quality);
          setTimeout(function() {
            window.location.href = url + sep + extra;
          }, 600);
        }
      });
  }

  // ====================================================================
  // INIT
  // ====================================================================
  function injectSkipButtonStyles() {
    if (document.getElementById('nd-skip-btn-styles')) return;
    var style = document.createElement('style');
    style.id = 'nd-skip-btn-styles';
    style.textContent = ''
      + '.nd-btn-skip { transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.1s ease; }'
      + '.nd-btn-skip:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.4) !important; color: rgba(255,255,255,0.9) !important; }'
      + '.nd-btn-skip:active { transform: scale(0.97); }';
    document.head.appendChild(style);
  }

  function init() {
    injectSkipButtonStyles();
    initFbPixel();
    mountAllSteps();
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
