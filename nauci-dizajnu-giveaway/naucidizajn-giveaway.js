  (function() {
    'use strict';

    // ====================================================================
    // ENV DETECTION
    // ====================================================================
    var ND_IS_TEST_ENV = (function() {
      if (typeof location === 'undefined') return false;
      var host = (location.hostname || '').toLowerCase();
      return host === 'localhost' || host === '127.0.0.1' ||
             host.indexOf('.github.io') !== -1 || host.endsWith('github.io') ||
             host === '';
    })();

    var ND_CONFIG = {
      webhookUrl: 'https://hook.eu2.make.com/dlstkyxp1k8vf20lfy6xjmhjordumax3',
      formId: 'naucidizajn-giveaway-maj-2026',
      thankYouUrl: 'https://naucidizajn.com/giveaway-maj-2026-uspesna-prijava',
      submitTimeoutMs: 8000,
      sendOnExit: true,
      isTestEnv: ND_IS_TEST_ENV
    };

    if (ND_IS_TEST_ENV) {
      var banner = document.getElementById('nd-test-banner');
      if (banner) banner.hidden = false;
      console.log('%c[ND Giveaway] TEST ENV (' + (location.hostname || 'file://') + ')', 'color:#DBFF00;font-weight:bold');
      console.log('  • Webhook: DISABLED (samo console.log payload-a)');
      console.log('  • Redirect: DISABLED (loading screen ostaje)');
    }

    // ====================================================================
    // COUNTRIES (kopirano iz kviza, sa dodatnim min/max digit info za Balkan + susedne)
    // ====================================================================
    var ND_COUNTRIES = [
      {c:'AF',n:'Afghanistan',d:'+93'},{c:'AL',n:'Albania',d:'+355'},{c:'DZ',n:'Algeria',d:'+213'},
      {c:'AS',n:'American Samoa',d:'+1684'},{c:'AD',n:'Andorra',d:'+376'},{c:'AO',n:'Angola',d:'+244'},
      {c:'AI',n:'Anguilla',d:'+1264'},{c:'AG',n:'Antigua and Barbuda',d:'+1268'},{c:'AR',n:'Argentina',d:'+54'},
      {c:'AM',n:'Armenia',d:'+374'},{c:'AW',n:'Aruba',d:'+297'},{c:'AU',n:'Australia',d:'+61'},
      {c:'AT',n:'Austria',d:'+43'},{c:'AZ',n:'Azerbaijan',d:'+994'},{c:'BS',n:'Bahamas',d:'+1242'},
      {c:'BH',n:'Bahrain',d:'+973'},{c:'BD',n:'Bangladesh',d:'+880'},{c:'BB',n:'Barbados',d:'+1246'},
      {c:'BY',n:'Belarus',d:'+375'},{c:'BE',n:'Belgium',d:'+32'},{c:'BZ',n:'Belize',d:'+501'},
      {c:'BJ',n:'Benin',d:'+229'},{c:'BM',n:'Bermuda',d:'+1441'},{c:'BT',n:'Bhutan',d:'+975'},
      {c:'BO',n:'Bolivia',d:'+591'},{c:'BA',n:'Bosnia and Herzegovina',d:'+387'},{c:'BW',n:'Botswana',d:'+267'},
      {c:'BR',n:'Brazil',d:'+55'},{c:'BN',n:'Brunei',d:'+673'},{c:'BG',n:'Bulgaria',d:'+359'},
      {c:'BF',n:'Burkina Faso',d:'+226'},{c:'BI',n:'Burundi',d:'+257'},{c:'KH',n:'Cambodia',d:'+855'},
      {c:'CM',n:'Cameroon',d:'+237'},{c:'CA',n:'Canada',d:'+1'},{c:'CV',n:'Cape Verde',d:'+238'},
      {c:'KY',n:'Cayman Islands',d:'+1345'},{c:'CF',n:'Central African Republic',d:'+236'},
      {c:'TD',n:'Chad',d:'+235'},{c:'CL',n:'Chile',d:'+56'},{c:'CN',n:'China',d:'+86'},
      {c:'CO',n:'Colombia',d:'+57'},{c:'KM',n:'Comoros',d:'+269'},{c:'CG',n:'Congo',d:'+242'},
      {c:'CD',n:'Congo, Democratic Republic',d:'+243'},{c:'CK',n:'Cook Islands',d:'+682'},
      {c:'CR',n:'Costa Rica',d:'+506'},{c:'CI',n:'Côte d\'Ivoire',d:'+225'},{c:'HR',n:'Croatia',d:'+385'},
      {c:'CU',n:'Cuba',d:'+53'},{c:'CY',n:'Cyprus',d:'+357'},{c:'CZ',n:'Czech Republic',d:'+420'},
      {c:'DK',n:'Denmark',d:'+45'},{c:'DJ',n:'Djibouti',d:'+253'},{c:'DM',n:'Dominica',d:'+1767'},
      {c:'DO',n:'Dominican Republic',d:'+1809'},{c:'EC',n:'Ecuador',d:'+593'},{c:'EG',n:'Egypt',d:'+20'},
      {c:'SV',n:'El Salvador',d:'+503'},{c:'GQ',n:'Equatorial Guinea',d:'+240'},{c:'ER',n:'Eritrea',d:'+291'},
      {c:'EE',n:'Estonia',d:'+372'},{c:'ET',n:'Ethiopia',d:'+251'},{c:'FK',n:'Falkland Islands',d:'+500'},
      {c:'FO',n:'Faroe Islands',d:'+298'},{c:'FJ',n:'Fiji',d:'+679'},{c:'FI',n:'Finland',d:'+358'},
      {c:'FR',n:'France',d:'+33'},{c:'GF',n:'French Guiana',d:'+594'},{c:'PF',n:'French Polynesia',d:'+689'},
      {c:'GA',n:'Gabon',d:'+241'},{c:'GM',n:'Gambia',d:'+220'},{c:'GE',n:'Georgia',d:'+995'},
      {c:'DE',n:'Germany',d:'+49'},{c:'GH',n:'Ghana',d:'+233'},{c:'GI',n:'Gibraltar',d:'+350'},
      {c:'GR',n:'Greece',d:'+30'},{c:'GL',n:'Greenland',d:'+299'},{c:'GD',n:'Grenada',d:'+1473'},
      {c:'GP',n:'Guadeloupe',d:'+590'},{c:'GU',n:'Guam',d:'+1671'},{c:'GT',n:'Guatemala',d:'+502'},
      {c:'GN',n:'Guinea',d:'+224'},{c:'GW',n:'Guinea-Bissau',d:'+245'},{c:'GY',n:'Guyana',d:'+592'},
      {c:'HT',n:'Haiti',d:'+509'},{c:'HN',n:'Honduras',d:'+504'},{c:'HK',n:'Hong Kong',d:'+852'},
      {c:'HU',n:'Hungary',d:'+36'},{c:'IS',n:'Iceland',d:'+354'},{c:'IN',n:'India',d:'+91'},
      {c:'ID',n:'Indonesia',d:'+62'},{c:'IR',n:'Iran',d:'+98'},{c:'IQ',n:'Iraq',d:'+964'},
      {c:'IE',n:'Ireland',d:'+353'},{c:'IL',n:'Israel',d:'+972'},{c:'IT',n:'Italy',d:'+39'},
      {c:'JM',n:'Jamaica',d:'+1876'},{c:'JP',n:'Japan',d:'+81'},{c:'JO',n:'Jordan',d:'+962'},
      {c:'KZ',n:'Kazakhstan',d:'+7'},{c:'KE',n:'Kenya',d:'+254'},{c:'KI',n:'Kiribati',d:'+686'},
      {c:'KP',n:'Korea, North',d:'+850'},{c:'KR',n:'Korea, South',d:'+82'},{c:'KW',n:'Kuwait',d:'+965'},
      {c:'KG',n:'Kyrgyzstan',d:'+996'},{c:'LA',n:'Laos',d:'+856'},{c:'LV',n:'Latvia',d:'+371'},
      {c:'LB',n:'Lebanon',d:'+961'},{c:'LS',n:'Lesotho',d:'+266'},{c:'LR',n:'Liberia',d:'+231'},
      {c:'LY',n:'Libya',d:'+218'},{c:'LI',n:'Liechtenstein',d:'+423'},{c:'LT',n:'Lithuania',d:'+370'},
      {c:'LU',n:'Luxembourg',d:'+352'},{c:'MO',n:'Macau',d:'+853'},{c:'MK',n:'North Macedonia',d:'+389'},
      {c:'MG',n:'Madagascar',d:'+261'},{c:'MW',n:'Malawi',d:'+265'},{c:'MY',n:'Malaysia',d:'+60'},
      {c:'MV',n:'Maldives',d:'+960'},{c:'ML',n:'Mali',d:'+223'},{c:'MT',n:'Malta',d:'+356'},
      {c:'MH',n:'Marshall Islands',d:'+692'},{c:'MQ',n:'Martinique',d:'+596'},{c:'MR',n:'Mauritania',d:'+222'},
      {c:'MU',n:'Mauritius',d:'+230'},{c:'YT',n:'Mayotte',d:'+262'},{c:'MX',n:'Mexico',d:'+52'},
      {c:'FM',n:'Micronesia',d:'+691'},{c:'MD',n:'Moldova',d:'+373'},{c:'MC',n:'Monaco',d:'+377'},
      {c:'MN',n:'Mongolia',d:'+976'},{c:'ME',n:'Montenegro',d:'+382'},{c:'MS',n:'Montserrat',d:'+1664'},
      {c:'MA',n:'Morocco',d:'+212'},{c:'MZ',n:'Mozambique',d:'+258'},{c:'MM',n:'Myanmar',d:'+95'},
      {c:'NA',n:'Namibia',d:'+264'},{c:'NR',n:'Nauru',d:'+674'},{c:'NP',n:'Nepal',d:'+977'},
      {c:'NL',n:'Netherlands',d:'+31'},{c:'NC',n:'New Caledonia',d:'+687'},{c:'NZ',n:'New Zealand',d:'+64'},
      {c:'NI',n:'Nicaragua',d:'+505'},{c:'NE',n:'Niger',d:'+227'},{c:'NG',n:'Nigeria',d:'+234'},
      {c:'NU',n:'Niue',d:'+683'},{c:'NF',n:'Norfolk Island',d:'+672'},{c:'NO',n:'Norway',d:'+47'},
      {c:'OM',n:'Oman',d:'+968'},{c:'PK',n:'Pakistan',d:'+92'},{c:'PW',n:'Palau',d:'+680'},
      {c:'PS',n:'Palestine',d:'+970'},{c:'PA',n:'Panama',d:'+507'},{c:'PG',n:'Papua New Guinea',d:'+675'},
      {c:'PY',n:'Paraguay',d:'+595'},{c:'PE',n:'Peru',d:'+51'},{c:'PH',n:'Philippines',d:'+63'},
      {c:'PL',n:'Poland',d:'+48'},{c:'PT',n:'Portugal',d:'+351'},{c:'PR',n:'Puerto Rico',d:'+1787'},
      {c:'QA',n:'Qatar',d:'+974'},{c:'RE',n:'Reunion',d:'+262'},{c:'RO',n:'Romania',d:'+40'},
      {c:'RU',n:'Russia',d:'+7'},{c:'RW',n:'Rwanda',d:'+250'},{c:'SH',n:'Saint Helena',d:'+290'},
      {c:'KN',n:'Saint Kitts and Nevis',d:'+1869'},{c:'LC',n:'Saint Lucia',d:'+1758'},
      {c:'PM',n:'Saint Pierre and Miquelon',d:'+508'},{c:'VC',n:'Saint Vincent',d:'+1784'},
      {c:'WS',n:'Samoa',d:'+685'},{c:'SM',n:'San Marino',d:'+378'},{c:'ST',n:'Sao Tome and Principe',d:'+239'},
      {c:'SA',n:'Saudi Arabia',d:'+966'},{c:'SN',n:'Senegal',d:'+221'},{c:'RS',n:'Serbia',d:'+381'},
      {c:'SC',n:'Seychelles',d:'+248'},{c:'SL',n:'Sierra Leone',d:'+232'},{c:'SG',n:'Singapore',d:'+65'},
      {c:'SK',n:'Slovakia',d:'+421'},{c:'SI',n:'Slovenia',d:'+386'},{c:'SB',n:'Solomon Islands',d:'+677'},
      {c:'SO',n:'Somalia',d:'+252'},{c:'ZA',n:'South Africa',d:'+27'},{c:'ES',n:'Spain',d:'+34'},
      {c:'LK',n:'Sri Lanka',d:'+94'},{c:'SD',n:'Sudan',d:'+249'},{c:'SR',n:'Suriname',d:'+597'},
      {c:'SZ',n:'Swaziland',d:'+268'},{c:'SE',n:'Sweden',d:'+46'},{c:'CH',n:'Switzerland',d:'+41'},
      {c:'SY',n:'Syria',d:'+963'},{c:'TW',n:'Taiwan',d:'+886'},{c:'TJ',n:'Tajikistan',d:'+992'},
      {c:'TZ',n:'Tanzania',d:'+255'},{c:'TH',n:'Thailand',d:'+66'},{c:'TL',n:'Timor-Leste',d:'+670'},
      {c:'TG',n:'Togo',d:'+228'},{c:'TK',n:'Tokelau',d:'+690'},{c:'TO',n:'Tonga',d:'+676'},
      {c:'TT',n:'Trinidad and Tobago',d:'+1868'},{c:'TN',n:'Tunisia',d:'+216'},{c:'TR',n:'Turkey',d:'+90'},
      {c:'TM',n:'Turkmenistan',d:'+993'},{c:'TC',n:'Turks and Caicos',d:'+1649'},{c:'TV',n:'Tuvalu',d:'+688'},
      {c:'UG',n:'Uganda',d:'+256'},{c:'UA',n:'Ukraine',d:'+380'},{c:'AE',n:'United Arab Emirates',d:'+971'},
      {c:'GB',n:'United Kingdom',d:'+44'},{c:'US',n:'United States',d:'+1'},{c:'UY',n:'Uruguay',d:'+598'},
      {c:'UZ',n:'Uzbekistan',d:'+998'},{c:'VU',n:'Vanuatu',d:'+678'},{c:'VA',n:'Vatican',d:'+39'},
      {c:'VE',n:'Venezuela',d:'+58'},{c:'VN',n:'Vietnam',d:'+84'},{c:'YE',n:'Yemen',d:'+967'},
      {c:'ZM',n:'Zambia',d:'+260'},{c:'ZW',n:'Zimbabwe',d:'+263'}
    ];

    // Min/Max digit length za number bez country code-a (NSN — National Significant Number).
    // Default fallback (van mape): 6–15 cifara (ITU E.164 maksimum). Mapa pokriva Balkan +
    // susedne zemlje koje su najveći deo prijava za giveaway. Vrednosti su konzervativne.
    var ND_PHONE_NSN_LEN = {
      RS: [8, 9], BA: [8, 8], ME: [8, 8], HR: [8, 9], SI: [8, 8], MK: [8, 8],
      AL: [9, 9], BG: [8, 9], RO: [9, 9], HU: [8, 9], AT: [10, 11], DE: [10, 11],
      CH: [9, 9], IT: [9, 10], FR: [9, 9], US: [10, 10], CA: [10, 10], GB: [10, 10],
      ES: [9, 9], NL: [9, 9], BE: [8, 9], SE: [7, 9], NO: [8, 8], DK: [8, 8],
      FI: [5, 11], PT: [9, 9], GR: [10, 10], IE: [9, 9], TR: [10, 10], CZ: [9, 9],
      SK: [9, 9], PL: [9, 9], LU: [8, 9], EE: [7, 8], LV: [8, 8], LT: [8, 8],
      RU: [10, 10], UA: [9, 9], BY: [9, 9], MD: [8, 8], CY: [8, 8], MT: [8, 8]
    };
    function phoneRange(countryCode) {
      var r = ND_PHONE_NSN_LEN[countryCode];
      return r ? r : [6, 15];
    }

    function findCountryByCode(code) {
      for (var i = 0; i < ND_COUNTRIES.length; i++) {
        if (ND_COUNTRIES[i].c === code) return ND_COUNTRIES[i];
      }
      return null;
    }
    function flagHtml(code) {
      var safe = String(code || '').toLowerCase().replace(/[^a-z]/g, '');
      return '<span class="fi fi-' + safe + '" aria-hidden="true"></span>';
    }
    function flagEmoji(code) {
      return flagHtml(code);
    }

    // IP geolocation za default country (3 fallback providera sa timeout-om).
    function detectCountryByIP(callback) {
      var providers = [
        { url: 'https://ipapi.co/json/', field: 'country_code' },
        { url: 'https://api.country.is/', field: 'country' },
        { url: 'https://ipwho.is/', field: 'country_code' }
      ];
      function tryProvider(idx) {
        if (idx >= providers.length) { callback(null); return; }
        var p = providers[idx];
        var ctrl = new AbortController();
        var t = setTimeout(function(){ ctrl.abort(); tryProvider(idx + 1); }, 3000);
        fetch(p.url, { signal: ctrl.signal })
          .then(function(r){ return r.json(); })
          .then(function(data){
            clearTimeout(t);
            var code = data && data[p.field];
            if (code && typeof code === 'string') callback(code.toUpperCase());
            else tryProvider(idx + 1);
          })
          .catch(function(){ clearTimeout(t); tryProvider(idx + 1); });
      }
      tryProvider(0);
    }

    // ====================================================================
    // FORM SCHEMA
    // ====================================================================
    var FORM = {
      welcome: {
        title: 'Prijavi se za giveaway i imaš šansu da osvojiš 6 meseci individualnog web dizajn mentorstva',
        paragraphs: [
          'Inače, cena mentorstva je <strong>2.300€</strong>.',
          'Popuni kratku prijavu i učestvuj u izvlačenju 🎯'
        ],
        buttonText: 'Prijavi se',
        timeText: 'Traje oko 1 minut'
      },
      fields: [
        {
          key: 'q1_laptop', type: 'choice',
          title: 'Da li imaš laptop / računar?',
          required: true,
          choices: [ { label: 'DA' }, { label: 'NE' } ]
        },
        {
          key: 'q2_posao', type: 'choice',
          title: 'Da li trenutno imaš posao?',
          required: true,
          choices: [ { label: 'DA' }, { label: 'NE' } ]
        },
        {
          key: 'q3_cilj', type: 'choice',
          title: 'Šta želiš da se desi nakon 6 meseci mentorstva?',
          required: true,
          choices: [
            { label: 'Nađem full-time posao web dizajnera' },
            { label: 'Krenem da radim freelance i nađem prve klijente' }
          ]
        },
        {
          key: 'q4_dizajn', type: 'choice',
          title: 'Da li se trenutno baviš dizajnom?',
          required: true,
          choices: [
            { label: 'Ne, hteo bih da krenem sa mentorom od nule' },
            { label: 'Radim malo dizajn, ali ne sa klijentima' },
            { label: 'Radim dizajn sa klijentima, želim da se usavršim uz mentora' }
          ]
        },
        {
          key: 'q5_vreme', type: 'choice',
          title: 'Koliko vremena možeš dnevno da posvetiš učenju nove veštine?',
          required: true,
          choices: [
            { label: 'Manje od 1h dnevno (ne prijavljuj se)' },
            { label: '1-2h dnevno' },
            { label: '2-5h dnevno' },
            { label: '5h+ dnevno' }
          ]
        },
        {
          key: 'q6_kada', type: 'choice',
          title: 'Ako osvojiš, kada bi mogao/la da kreneš sa mentorstvom?',
          required: true,
          choices: [
            { label: 'Odmah' },
            { label: 'U narednih mesec dana' },
            { label: 'Tek kasnije' }
          ]
        },
        {
          key: 'q7_zasto', type: 'textarea',
          title: 'Zašto bismo baš tebe izabrali za punu stipendiju?',
          description: 'Napiši u 2-3 rečenice.',
          required: true,
          placeholder: 'Tvoj odgovor…'
        },
        {
          key: 'q8_kontakt', type: 'contact',
          title: 'Podaci',
          description: 'Sva polja su obavezna — koristimo ih da te kontaktiramo ako osvojiš.',
          required: true
        },
        {
          key: 'q9_optin', type: 'choice',
          title: 'Želim da me Nauči Dizajn kontaktira putem emaila ili telefona u vezi sa individualnim mentorstvom i posebnim ponudama.',
          required: true,
          choices: [ { label: 'DA' }, { label: 'NE' } ]
        }
      ]
    };

    // Mapa: interni key → pun tekst pitanja (koristi se za webhook payload key-eve).
    var ND_QUESTION_LABELS = {
      q1_laptop: 'Da li imaš laptop / računar',
      q2_posao: 'Da li trenutno imaš posao',
      q3_cilj:  'Šta želiš da se desi nakon 6 meseci mentorstva?',
      q4_dizajn:'Da li se trenutno baviš dizajnom?',
      q5_vreme: 'Koliko vremena možeš dnevno da posvetiš učenju nove veštine?',
      q6_kada:  'Ako osvojiš, kada bi mogao/la da kreneš sa mentorstvom?',
      q7_zasto: 'Zašto bismo baš tebe izabrali za punu stipendiju?',
      q9_optin: 'Želim da me Nauči Dizajn kontaktira putem emaila ili telefona u vezi sa individualnim mentorstvom i posebnim ponudama.'
    };

    // ====================================================================
    // STATE
    // ====================================================================
    function generateSessionId() {
      var rand = Math.random().toString(36).slice(2, 10);
      return 'nd_gv_' + Date.now().toString(36) + '_' + rand;
    }

    var state = {
      currentIdx: -1,
      answers: {},
      visitedKeys: [],
      sessionId: generateSessionId(),
      startedAt: new Date().toISOString(),
      submitted: false,
      exitedEarly: false,
      ref: '' // referral kod
    };

    // ====================================================================
    // REFERRAL CAPTURE
    // ====================================================================
    var REF_STORAGE = 'nd_ref'; // isti key kao u referral landing-head.html
    function captureRef() {
      try {
        var p = new URLSearchParams(window.location.search);
        var fromUrl = p.get('r');
        if (fromUrl) {
          var clean = fromUrl.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
          if (clean.length >= 4) {
            try { localStorage.setItem(REF_STORAGE, clean); } catch(e) {}
            state.ref = clean;
            return clean;
          }
        }
        // Pad-back: localStorage (npr. korisnik je već posetio landing pre)
        var stored = '';
        try { stored = localStorage.getItem(REF_STORAGE) || ''; } catch(e) {}
        if (stored) state.ref = stored;
        return stored;
      } catch(e) { return ''; }
    }

    // ====================================================================
    // UTM
    // ====================================================================
    function captureUtm() {
      var p = new URLSearchParams(window.location.search);
      var utm = {};
      ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k){
        var v = p.get(k);
        if (v) utm[k] = v;
      });
      return utm;
    }
    var utmData = captureUtm();

    // ====================================================================
    // RENDERING HELPERS
    // ====================================================================
    var stage = document.getElementById('nd-stage');
    var formEl = document.getElementById('nd-form');
    var progressFill = document.querySelector('#nd-form .nd-progress-fill');
    var stepEls = {};
    var activeKey = '__welcome';

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
      });
    }
    function letterFor(i) { return String.fromCharCode(65 + i); }

    function renderTitle(field) {
      var html = escapeHtml(field.title).replace(/\*([^*]+)\*/g, '<em>$1</em>');
      var req = field.required ? '<span class="nd-q-required">*</span>' : '';
      return '<h2 class="nd-q-title">' + html + req + '</h2>';
    }

    function renderQuestionHeader(field, displayNum) {
      var num = '<span class="nd-q-num" aria-hidden="true">' + displayNum + '</span>';
      var desc = '';
      if (field.description) {
        var descHtml = escapeHtml(field.description).replace(/\n/g, '<br>');
        desc = '<p class="nd-q-desc">' + descHtml + '</p>';
      }
      return '<div class="nd-q-row">' + num + renderTitle(field) + '</div>' + desc;
    }

    function renderChoice(choice, idx) {
      return '<button type="button" class="nd-choice" data-idx="' + idx + '">' +
        '<span class="nd-choice-key">' + letterFor(idx) + '</span>' +
        '<span class="nd-choice-label">' + escapeHtml(choice.label) + '</span>' +
        '</button>';
    }

    function renderEnterHint() {
      // Disabled per user feedback — hint je sklonjen sa svih koraka.
      return '';
    }

    // ====================================================================
    // STEP BUILDERS
    // ====================================================================
    function buildWelcomeStep() {
      var w = FORM.welcome;
      var paragraphs = w.paragraphs.map(function(p) {
        return '<p class="nd-welcome-desc">' + p + '</p>';
      }).join('');
      var clockSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      var el = document.createElement('div');
      el.className = 'nd-step';
      el.setAttribute('data-key', '__welcome');
      el.innerHTML =
        '<div class="nd-step-inner">' +
          '<div class="nd-welcome">' +
            '<h1 class="nd-welcome-title">' + escapeHtml(w.title) + '</h1>' +
            paragraphs +
            '<div class="nd-actions">' +
              '<button type="button" class="nd-btn-primary" data-action="start">' +
                '<span class="nd-btn-label">' + escapeHtml(w.buttonText) + '</span>' +
              '</button>' +
            '</div>' +
            '<div class="nd-time-pill">' + clockSvg + '<span>' + escapeHtml(w.timeText) + '</span></div>' +
          '</div>' +
        '</div>';
      return el;
    }

    function buildLoadingStep() {
      var el = document.createElement('div');
      el.className = 'nd-step';
      el.setAttribute('data-key', '__loading');
      el.innerHTML =
        '<div class="nd-step-inner">' +
          '<div class="nd-loading">' +
            '<div class="nd-spinner" aria-hidden="true"></div>' +
            '<div class="nd-loading-title">Šaljemo tvoju prijavu…</div>' +
            '<div class="nd-error" id="nd-loading-error" hidden></div>' +
          '</div>' +
        '</div>';
      return el;
    }

    function buildStepHtml(field, displayNum) {
      var header = renderQuestionHeader(field, displayNum);

      if (field.type === 'choice') {
        var choicesHtml = field.choices.map(renderChoice).join('');
        return header +
          '<div class="nd-choices" role="group">' + choicesHtml + '</div>' +
          '<div class="nd-actions">' +
            '<button type="button" class="nd-btn-primary" disabled><span class="nd-btn-label">OK</span></button>' +
            renderEnterHint() +
          '</div>';
      }

      if (field.type === 'textarea') {
        return header +
          '<div class="nd-textarea-wrap" data-wrap="textarea">' +
            '<textarea class="nd-textarea" rows="1" placeholder="' +
              escapeHtml(field.placeholder || '') + '"></textarea>' +
          '</div>' +
          '<div class="nd-field-error" data-error="textarea">Napiši kratak odgovor (bar 2-3 rečenice).</div>' +
          '<div class="nd-actions">' +
            '<button type="button" class="nd-btn-primary" disabled><span class="nd-btn-label">OK</span></button>' +
          '</div>';
      }

      if (field.type === 'contact') {
        return header +
          '<div class="nd-contact-grid">' +
            '<label class="nd-contact-field">' +
              '<div class="nd-input-wrap" data-wrap="fullName">' +
                '<span class="nd-input-label">Ime i prezime<span class="nd-required">*</span></span>' +
                '<input class="nd-input" type="text" autocomplete="name" data-field="fullName" />' +
              '</div>' +
              '<div class="nd-field-error" data-error="fullName">Unesi ime i prezime.</div>' +
            '</label>' +
            '<label class="nd-contact-field">' +
              '<div class="nd-input-wrap" data-wrap="email">' +
                '<span class="nd-input-label">Email<span class="nd-required">*</span></span>' +
                '<input class="nd-input" type="email" autocomplete="email" data-field="email" />' +
              '</div>' +
              '<div class="nd-field-error" data-error="email">Unesi validnu email adresu.</div>' +
            '</label>' +
            '<label class="nd-contact-field">' +
              '<div class="nd-input-wrap" style="border-bottom:none; padding-bottom:0;">' +
                '<span class="nd-input-label">Broj telefona<span class="nd-required">*</span></span>' +
              '</div>' +
              '<div class="nd-phone-row" data-wrap="phone">' +
                '<button type="button" class="nd-country-trigger" aria-expanded="false" aria-haspopup="listbox" aria-label="Izaberi zemlju">' +
                  '<span class="nd-flag" data-flag></span>' +
                  '<svg class="nd-flag-chevron" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 1 6 6 11 1"/></svg>' +
                '</button>' +
                '<input class="nd-phone-input nd-input" type="tel" inputmode="tel" autocomplete="tel-national" data-field="phone" placeholder="60 1234567" />' +
                '<div class="nd-country-dropdown" role="listbox" hidden>' +
                  '<div class="nd-country-search-wrap">' +
                    '<input class="nd-country-search" type="text" placeholder="Pretraži zemlje…" />' +
                    '<svg class="nd-country-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                  '</div>' +
                  '<div class="nd-country-list"></div>' +
                '</div>' +
              '</div>' +
              '<div class="nd-field-error" data-error="phone">Proveri broj telefona.</div>' +
            '</label>' +
          '</div>' +
          '<div class="nd-actions">' +
            '<button type="button" class="nd-btn-primary" disabled><span class="nd-btn-label">OK</span></button>' +
          '</div>';
      }

      return header + '<div class="nd-actions"><button type="button" class="nd-btn-primary" disabled>OK</button></div>';
    }

    function mountAllSteps() {
      // Welcome
      var welcomeEl = buildWelcomeStep();
      stage.appendChild(welcomeEl);
      stepEls.__welcome = welcomeEl;
      requestAnimationFrame(function() { welcomeEl.classList.add('nd-active'); });

      // Pitanja
      FORM.fields.forEach(function(field, idx) {
        var displayNum = idx + 1; // linearno
        var el = document.createElement('div');
        el.className = 'nd-step';
        el.setAttribute('data-key', field.key);
        el.innerHTML = '<div class="nd-step-inner">' + buildStepHtml(field, displayNum) + '</div>';
        stage.appendChild(el);
        stepEls[field.key] = el;
        attachStepBehavior(field, el);
      });

      // Loading
      var loadingEl = buildLoadingStep();
      stage.appendChild(loadingEl);
      stepEls.__loading = loadingEl;

      // Welcome start handler
      var startBtn = welcomeEl.querySelector('[data-action="start"]');
      startBtn.addEventListener('click', function() {
        formEl.classList.add('nd-form-started');
        goToKey(FORM.fields[0].key);
      });
    }

    // ====================================================================
    // STEP BEHAVIOR (po tipu)
    // ====================================================================
    function attachStepBehavior(field, el) {
      // Back button (svuda osim na prvom pitanju)
      var actions = el.querySelector('.nd-actions');
      if (actions && field.key !== FORM.fields[0].key) {
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
            setTimeout(function(){ submitChoice(field, i); }, 280);
          });
        });
        ok.addEventListener('click', function() {
          var sel = el.querySelector('.nd-choice.nd-selected');
          if (sel) submitChoice(field, parseInt(sel.dataset.idx, 10));
        });
      }
      else if (field.type === 'textarea') {
        var ta = el.querySelector('.nd-textarea');
        var tok = el.querySelector('.nd-btn-primary');
        var taWrap = el.querySelector('[data-wrap="textarea"]');
        var taErr = el.querySelector('[data-error="textarea"]');

        function taSetError(on, msg) {
          taWrap.classList.toggle('nd-has-error', !!on);
          if (msg) taErr.textContent = msg;
          taErr.classList.toggle('nd-show', !!on);
        }
        function taAutoGrow() {
          ta.style.height = 'auto';
          ta.style.height = ta.scrollHeight + 'px';
        }
        function taValid() { return (ta.value || '').trim().length >= 3; }

        ta.addEventListener('input', function() {
          if (taValid()) {
            tok.removeAttribute('disabled');
            if (taWrap.classList.contains('nd-has-error')) taSetError(false);
          } else {
            tok.setAttribute('disabled', '');
          }
          taAutoGrow();
        });
        ta.addEventListener('blur', function() {
          if ((ta.value || '').trim().length > 0 && !taValid()) {
            taSetError(true, 'Napiši kratak odgovor (bar 2-3 rečenice).');
          }
        });
        tok.addEventListener('click', function() {
          if (!taValid()) { taSetError(true, 'Napiši kratak odgovor (bar 2-3 rečenice).'); return; }
          state.answers[field.key] = (ta.value || '').trim();
          advance(field.key);
        });
        ta.addEventListener('keydown', function(e) {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault(); tok.click();
          }
        });
      }
      else if (field.type === 'contact') {
        setupContactStep(field, el);
      }
    }

    // ====================================================================
    // CONTACT STEP (ime + prezime + email + telefon sa per-country validacijom)
    // ====================================================================
    function setupContactStep(field, el) {
      var inputs = {
        fullName: el.querySelector('[data-field="fullName"]'),
        email:    el.querySelector('[data-field="email"]'),
        phone:    el.querySelector('[data-field="phone"]')
      };
      var wraps = {
        fullName: el.querySelector('[data-wrap="fullName"]'),
        email:    el.querySelector('[data-wrap="email"]'),
        phone:    el.querySelector('[data-wrap="phone"]')
      };
      var errors = {
        fullName: el.querySelector('[data-error="fullName"]'),
        email:    el.querySelector('[data-error="email"]'),
        phone:    el.querySelector('[data-error="phone"]')
      };
      var ok      = el.querySelector('.nd-btn-primary');
      var trigger = el.querySelector('.nd-country-trigger');
      var flagEl  = el.querySelector('[data-flag]');
      var dropdown = el.querySelector('.nd-country-dropdown');
      var searchInput = el.querySelector('.nd-country-search');
      var listEl  = el.querySelector('.nd-country-list');

      var selectedCountry = findCountryByCode('RS');

      function isValidEmail(em) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
      }
      function digitsOnly(s) { return String(s || '').replace(/\D/g, ''); }

      function isFullNameValid() {
        var v = (inputs.fullName.value || '').trim();
        if (v.length < 3) return false;
        // Mora da postoji bar jedna pauza između imena i prezimena (Marko Marković)
        return /\s/.test(v) && v.split(/\s+/).filter(Boolean).length >= 2;
      }
      function isPhoneValid() {
        // Bez per-country blokade — prihvatamo bilo koju dužinu sa makar 4 cifre.
        return digitsOnly(inputs.phone.value).length >= 4;
      }

      function setError(key, hasError, msg) {
        if (wraps[key]) wraps[key].classList.toggle('nd-has-error', !!hasError);
        if (errors[key]) {
          if (msg) errors[key].textContent = msg;
          errors[key].classList.toggle('nd-show', !!hasError);
        }
      }

      function validateField(key) {
        if (key === 'fullName') {
          var v = (inputs.fullName.value || '').trim();
          if (v.length === 0) { setError('fullName', true, 'Unesi ime i prezime.'); return false; }
          if (!isFullNameValid()) { setError('fullName', true, 'Unesi i ime i prezime (npr. „Marko Marković").'); return false; }
          setError('fullName', false); return true;
        }
        if (key === 'email') {
          var em = (inputs.email.value || '').trim();
          if (em.length === 0) { setError('email', true, 'Unesi email.'); return false; }
          if (!isValidEmail(em)) { setError('email', true, 'Unesi validnu email adresu.'); return false; }
          setError('email', false); return true;
        }
        if (key === 'phone') {
          var n = digitsOnly(inputs.phone.value).length;
          if (n === 0) { setError('phone', true, 'Unesi broj telefona.'); return false; }
          if (!isPhoneValid()) { setError('phone', true, 'Broj prekratak.'); return false; }
          setError('phone', false); return true;
        }
        return true;
      }

      function refreshOk() {
        var fnOk = isFullNameValid();
        var emOk = isValidEmail((inputs.email.value || '').trim());
        var phOk = isPhoneValid();
        if (fnOk && emOk && phOk) ok.removeAttribute('disabled');
        else ok.setAttribute('disabled', '');
      }

      // ----- Country picker -----
      function setCountry(country) {
        if (!country) return;
        selectedCountry = country;
        flagEl.innerHTML = flagHtml(country.c);
        flagEl.title = country.n + ' (' + country.d + ')';
        var items = listEl.querySelectorAll('.nd-country-item');
        items.forEach(function(item) {
          item.classList.toggle('nd-selected', item.dataset.code === country.c);
        });
        // Ako je phone polje već imalo error, re-validate za novu zemlju
        if (wraps.phone.classList.contains('nd-has-error')) validateField('phone');
        refreshOk();
      }
      function renderList(filterText) {
        var filter = (filterText || '').trim().toLowerCase();
        var html = '';
        for (var i = 0; i < ND_COUNTRIES.length; i++) {
          var c = ND_COUNTRIES[i];
          if (filter && c.n.toLowerCase().indexOf(filter) === -1 && c.d.indexOf(filter) === -1) continue;
          var isSel = selectedCountry && c.c === selectedCountry.c;
          html += '<button type="button" class="nd-country-item' + (isSel ? ' nd-selected' : '') + '" ' +
                    'data-code="' + c.c + '" data-dial="' + c.d + '" role="option">' +
                    '<span class="nd-country-item-flag">' + flagEmoji(c.c) + '</span>' +
                    '<span class="nd-country-item-name">' + escapeHtml(c.n) + '</span>' +
                    '<span class="nd-country-item-dial">' + c.d + '</span>' +
                  '</button>';
        }
        if (!html) html = '<div class="nd-country-empty">Nema rezultata</div>';
        listEl.innerHTML = html;
        listEl.querySelectorAll('.nd-country-item').forEach(function(item) {
          item.addEventListener('click', function() {
            var code = item.dataset.code;
            var ctry = findCountryByCode(code);
            if (ctry) { setCountry(ctry); closeDropdown(); inputs.phone.focus(); }
          });
        });
      }
      function openDropdown() {
        dropdown.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        renderList('');
        setTimeout(function(){ searchInput.value = ''; searchInput.focus(); }, 50);
      }
      function closeDropdown() {
        dropdown.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }
      trigger.addEventListener('click', function() {
        if (dropdown.hidden) openDropdown(); else closeDropdown();
      });
      searchInput.addEventListener('input', function() { renderList(searchInput.value); });
      document.addEventListener('click', function(e) {
        if (!dropdown.hidden && !dropdown.contains(e.target) && !trigger.contains(e.target)) closeDropdown();
      });

      // Init country = Srbija, pa pokušaj IP geo detection
      setCountry(selectedCountry);
      detectCountryByIP(function(code) {
        if (!code) return;
        var c = findCountryByCode(code);
        if (c) setCountry(c);
      });

      // ----- Validation listeners -----
      // Input: live refresh OK button + clear error ako je polje postalo validno
      // Blur: full validation (error message appears if invalid)
      ['fullName', 'email', 'phone'].forEach(function(key) {
        var inp = inputs[key];
        inp.addEventListener('input', function() {
          // Ako je polje već imalo error, proveri da li je sad validno → clear
          if (wraps[key].classList.contains('nd-has-error')) validateField(key);
          refreshOk();
        });
        inp.addEventListener('blur', function() {
          // Validate samo ako je korisnik nešto kucao (ne lupi error odmah kad korisnik tab-uje preko praznog polja iz keyboard nav-a)
          if ((inp.value || '').trim().length > 0) validateField(key);
          refreshOk();
        });
      });

      // ----- OK click -----
      ok.addEventListener('click', function() {
        // Force-validate sva polja (handluje slučaj kad korisnik klikne OK bez blur-a)
        var v1 = validateField('fullName');
        var v2 = validateField('email');
        var v3 = validateField('phone');
        refreshOk();
        if (!v1 || !v2 || !v3) return;

        // Split fullName na first + last (prvi token = ime, ostatak = prezime)
        var full = (inputs.fullName.value || '').trim().replace(/\s+/g, ' ');
        var parts = full.split(' ');
        var first = parts[0] || '';
        var last  = parts.slice(1).join(' ') || '';

        state.answers[field.key] = {
          firstName: first,
          lastName: last,
          name: full,
          email: (inputs.email.value || '').trim().toLowerCase(),
          phone: digitsOnly(inputs.phone.value),
          phone_country: selectedCountry.c,
          phone_dial: selectedCountry.d,
          phone_full: selectedCountry.d + digitsOnly(inputs.phone.value)
        };
        advance(field.key);
      });
    }

    // ====================================================================
    // SUBMIT CHOICE → ADVANCE
    // ====================================================================
    function submitChoice(field, idx) {
      var choice = field.choices[idx];
      state.answers[field.key] = { label: choice.label, idx: idx };
      advance(field.key);
    }

    function advance(currentKey) {
      var nextKey = getNextKey(currentKey);
      if (nextKey === 'END') { finalize(); return; }
      goToKey(nextKey);
    }

    function getNextKey(currentKey) {
      // Linearno — nema skip-to-end logike
      var idx = FORM.fields.findIndex(function(f){ return f.key === currentKey; });
      if (idx === -1 || idx === FORM.fields.length - 1) return 'END';
      return FORM.fields[idx + 1].key;
    }

    // ====================================================================
    // STEP TRANSITIONS
    // ====================================================================
    function goToKey(key) {
      var prevEl = stepEls[activeKey];
      var nextEl = stepEls[key];
      if (!nextEl) { console.warn('[ND Giveaway] unknown step key:', key); return; }

      if (prevEl && prevEl !== nextEl) {
        prevEl.classList.add('nd-leaving');
        prevEl.classList.remove('nd-active');
        setTimeout(function(){ prevEl.classList.remove('nd-leaving'); }, 600);
      }
      activeKey = key;
      state.visitedKeys.push(key);
      nextEl.classList.add('nd-active');

      setTimeout(function() {
        var input = nextEl.querySelector('input, textarea');
        if (input) input.focus();
      }, 200);

      updateProgress();
      updateCurrentIdx(key);
    }

    function goBack() {
      if (state.visitedKeys.length < 2) return;
      var currentKey = state.visitedKeys[state.visitedKeys.length - 1];
      var prevKey    = state.visitedKeys[state.visitedKeys.length - 2];
      if (!prevKey) return;

      var prevEl = stepEls[currentKey];
      var nextEl = stepEls[prevKey];
      if (!nextEl) return;

      if (prevEl) {
        prevEl.classList.add('nd-leaving');
        prevEl.classList.remove('nd-active');
        setTimeout(function(){ prevEl.classList.remove('nd-leaving'); }, 600);
      }
      state.visitedKeys.pop();
      activeKey = prevKey;
      nextEl.classList.add('nd-active');

      setTimeout(function() {
        var input = nextEl.querySelector('input, textarea');
        if (input) input.focus();
      }, 200);

      updateProgress();
      updateCurrentIdx(prevKey);
    }

    function updateCurrentIdx(key) {
      state.currentIdx = FORM.fields.findIndex(function(f){ return f.key === key; });
    }

    function updateProgress() {
      var total = FORM.fields.length;
      var idx = state.currentIdx;
      var stepNumber = idx >= 0 ? (idx + 1) : 0;
      var pct = Math.min(100, Math.round((stepNumber / total) * 100));
      progressFill.style.width = 'calc(' + pct + '% - 4px)';
      progressFill.style.minWidth = pct > 0 ? '8px' : '0';
    }

    // ====================================================================
    // KEYBOARD NAV
    // ====================================================================
    document.addEventListener('keydown', function(e) {
      var activeEl = stepEls[activeKey];
      if (!activeEl) return;

      var field = FORM.fields.find(function(f){ return f.key === activeKey; });

      // A/B/C/D shortcut za choice
      if (field && field.type === 'choice' && /^[a-zA-Z]$/.test(e.key) && !e.metaKey && !e.ctrlKey) {
        var letter = e.key.toUpperCase().charCodeAt(0) - 65;
        var choices = activeEl.querySelectorAll('.nd-choice');
        if (letter >= 0 && letter < choices.length) {
          e.preventDefault();
          choices[letter].click();
          return;
        }
      }
      // Enter za OK
      if (e.key === 'Enter' && !e.shiftKey) {
        // Textarea — Enter pravi new line, Cmd/Ctrl+Enter handluje handler
        if (field && field.type === 'textarea' && !e.metaKey && !e.ctrlKey) return;
        // Choice — ako je izabran, OK
        if (field && field.type === 'choice') {
          var sel = activeEl.querySelector('.nd-choice.nd-selected');
          if (sel) {
            var ok = activeEl.querySelector('.nd-btn-primary:not([disabled])');
            if (ok) { e.preventDefault(); ok.click(); }
          }
          return;
        }
        // Contact — Enter na poslednjem polju submit-uje ako sva polja validna
        if (field && field.type === 'contact') {
          var ok2 = activeEl.querySelector('.nd-btn-primary:not([disabled])');
          if (ok2) { e.preventDefault(); ok2.click(); }
          return;
        }
      }
    });

    // ====================================================================
    // PAYLOAD + WEBHOOK
    // ====================================================================
    function buildPayload(opts) {
      opts = opts || {};
      var isPartial = !!opts.partial;
      var contact = state.answers.q8_kontakt || {};
      var optin = state.answers.q9_optin || {};

      var answersByLabel = {};
      Object.keys(ND_QUESTION_LABELS).forEach(function(key) {
        var a = state.answers[key];
        if (a == null) return;
        var label = ND_QUESTION_LABELS[key];
        if (a && typeof a === 'object' && 'label' in a) answersByLabel[label] = a.label;
        else answersByLabel[label] = a;
      });

      return {
        submitted_at: new Date().toISOString(),
        started_at: state.startedAt,
        form_id: ND_CONFIG.formId,
        session_id: state.sessionId,
        is_partial: isPartial,
        partial_reason: opts.partialReason || '',
        completed_full: !!opts.complete,
        exited_early: !!opts.exitedEarly,
        visited_count: state.visitedKeys.length,
        contact: {
          first_name: contact.firstName || '',
          last_name: contact.lastName || '',
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          phone_country: contact.phone_country || '',
          phone_dial: contact.phone_dial || '',
          phone_full: contact.phone_full || ''
        },
        opt_in: optin.label === 'DA',
        opt_in_raw: optin.label || '',
        answers: answersByLabel,
        referral: {
          referred_by_code: state.ref || '',
          source_url: window.location.href
        },
        utm: utmData,
        page_url: window.location.href,
        referrer: document.referrer || '',
        user_agent: navigator.userAgent
      };
    }

    function sendBeaconJson(url, payload) {
      if (!url) return false;
      try {
        var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        return navigator.sendBeacon(url, blob);
      } catch(e) { return false; }
    }

    function sendFetch(url, payload, timeoutMs) {
      if (ND_CONFIG.isTestEnv) {
        console.log('%c[ND Giveaway] Webhook (TEST — not sent):', 'color:#DBFF00;font-weight:bold');
        console.log(payload);
        // Plain-text JSON dump za test okruženja gde console ne prikazuje objekat:
        try { console.log('[ND Giveaway] payload JSON:\n' + JSON.stringify(payload, null, 2)); } catch(e) {}
        try { window.__ndLastPayload = payload; } catch(e) {}
        return Promise.resolve({ ok: true, _test: true });
      }
      if (!url) return Promise.reject(new Error('webhook url not configured'));
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
        console.log('[ND Giveaway] Exit-partial (TEST — not sent):', payload);
        return;
      }
      sendBeaconJson(ND_CONFIG.webhookUrl, payload);
    }

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') maybeSendPartial();
    });
    window.addEventListener('pagehide', maybeSendPartial);

    // ====================================================================
    // FINALIZE (submit + sessionStorage stash + redirect na thank-you)
    // ====================================================================
    function finalize() {
      state.submitted = true;
      var payload = buildPayload({ complete: true, exitedEarly: false });

      // Prikaži loading screen
      var prev = stepEls[activeKey];
      if (prev) { prev.classList.add('nd-leaving'); prev.classList.remove('nd-active'); }
      activeKey = '__loading';
      stepEls.__loading.classList.add('nd-active');
      progressFill.style.width = '100%';

      // sessionStorage stash za thank-you embed referral sistema (postojeći key 'nd_signup')
      try {
        var stash = {
          email: payload.contact.email,
          name: payload.contact.name,
          ref: payload.referral.referred_by_code,
          ts: Date.now()
        };
        sessionStorage.setItem('nd_signup', JSON.stringify(stash));
      } catch(e) { console.warn('[ND Giveaway] sessionStorage stash failed', e); }

      return sendFetch(ND_CONFIG.webhookUrl, payload, ND_CONFIG.submitTimeoutMs)
        .catch(function(err) {
          sendBeaconJson(ND_CONFIG.webhookUrl, payload);
          console.warn('[ND Giveaway] webhook fetch failed, beacon attempted:', err);
        })
        .then(function() {
          if (ND_CONFIG.isTestEnv) {
            console.log('[ND Giveaway] Submit complete (TEST). Redirect URL bi bio:', ND_CONFIG.thankYouUrl);
            var errEl = document.getElementById('nd-loading-error');
            if (errEl) {
              errEl.hidden = false;
              errEl.style.color = '#DBFF00';
              errEl.textContent = '✓ TEST mode — payload je u console. Redirect je ovde isključen.';
            }
            return;
          }
          setTimeout(function() {
            window.location.href = ND_CONFIG.thankYouUrl;
          }, 600);
        });
    }

    // ====================================================================
    // INIT
    // ====================================================================
    function init() {
      captureRef();
      if (state.ref) console.log('[ND Giveaway] Referral kod uhvaćen:', state.ref);
      mountAllSteps();
      updateProgress();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
