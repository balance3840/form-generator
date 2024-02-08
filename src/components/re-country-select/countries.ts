const countries = [
    {
        "name": "Afghanistan",
        "dialCode": "+93",
        "code": "af"
    },
    {
        "name": "Albania",
        "dialCode": "+355",
        "code": "al"
    },
    {
        "name": "Algeria",
        "dialCode": "+213",
        "code": "dz"
    },
    {
        "name": "Andorra",
        "dialCode": "+376",
        "code": "ad"
    },
    {
        "name": "Angola",
        "dialCode": "+244",
        "code": "ao"
    },
    {
        "name": "Argentina",
        "dialCode": "+54",
        "code": "ar"
    },
    {
        "name": "Armenia",
        "dialCode": "+374",
        "code": "am"
    },
    {
        "name": "Australia",
        "dialCode": "+61",
        "code": "au"
    },
    {
        "name": "Austria",
        "dialCode": "+43",
        "code": "at"
    },
    {
        "name": "Azerbaijan",
        "dialCode": "+994",
        "code": "az"
    },
    {
        "name": "Bahamas",
        "dialCode": "+1",
        "code": "bs"
    },
    {
        "name": "Bahrain",
        "dialCode": "+973",
        "code": "bh"
    },
    {
        "name": "Bangladesh",
        "dialCode": "+880",
        "code": "bd"
    },
    {
        "name": "Barbados",
        "dialCode": "+1",
        "code": "bb"
    },
    {
        "name": "Belarus",
        "dialCode": "+375",
        "code": "by"
    },
    {
        "name": "Belgium",
        "dialCode": "+32",
        "code": "be"
    },
    {
        "name": "Belize",
        "dialCode": "+501",
        "code": "bz"
    },
    {
        "name": "Benin",
        "dialCode": "+229",
        "code": "bj"
    },
    {
        "name": "Bhutan",
        "dialCode": "+975",
        "code": "bt"
    },
    {
        "name": "Bolivia",
        "dialCode": "+591",
        "code": "bo"
    },
    {
        "name": "Bosnia and Herzegovina",
        "dialCode": "+387",
        "code": "ba"
    },
    {
        "name": "Botswana",
        "dialCode": "+267",
        "code": "bw"
    },
    {
        "name": "Brazil",
        "dialCode": "+55",
        "code": "br"
    },
    {
        "name": "Brunei Darussalam",
        "dialCode": "+673",
        "code": "bn"
    },
    {
        "name": "Bulgaria",
        "dialCode": "+359",
        "code": "bg"
    },
    {
        "name": "Burkina Faso",
        "dialCode": "+226",
        "code": "bf"
    },
    {
        "name": "Burundi",
        "dialCode": "+257",
        "code": "bi"
    },
    {
        "name": "Cabo Verde",
        "dialCode": "+238",
        "code": "cv"
    },
    {
        "name": "Cambodia",
        "dialCode": "+855",
        "code": "kh"
    },
    {
        "name": "Cameroon",
        "dialCode": "+237",
        "code": "cm"
    },
    {
        "name": "Canada",
        "dialCode": "+1",
        "code": "ca"
    },
    {
        "name": "Chile",
        "dialCode": "+56",
        "code": "cl"
    },
    {
        "name": "China",
        "dialCode": "+86",
        "code": "cn"
    },
    {
        "name": "Colombia",
        "dialCode": "+57",
        "code": "co"
    },
    {
        "name": "Comoros",
        "dialCode": "+269",
        "code": "km"
    },
    {
        "name": "Congo",
        "dialCode": "+242",
        "code": "cg"
    },
    {
        "name": "Democratic Republic of the Congo",
        "dialCode": "+243",
        "code": "cd"
    },
    {
        "name": "Costa Rica",
        "dialCode": "+506",
        "code": "cr"
    },
    {
        "name": "Cote d'Ivoire",
        "dialCode": "+225",
        "code": "ci"
    },
    {
        "name": "Croatia",
        "dialCode": "+385",
        "code": "hr"
    },
    {
        "name": "Cuba",
        "dialCode": "+53",
        "code": "cu"
    },
    {
        "name": "Cyprus",
        "dialCode": "+357",
        "code": "cy"
    },
    {
        "name": "Czech Republic",
        "dialCode": "+420",
        "code": "cz"
    },
    {
        "name": "Denmark",
        "dialCode": "+45",
        "code": "dk"
    },
    {
        "name": "Djibouti",
        "dialCode": "+253",
        "code": "dj"
    },
    {
        "name": "Dominica",
        "dialCode": "+1",
        "code": "dm"
    },
    {
        "name": "Dominican Republic",
        "dialCode": "+1",
        "code": "do"
    },
    {
        "name": "Ecuador",
        "dialCode": "+593",
        "code": "ec"
    },
    {
        "name": "Egypt",
        "dialCode": "+20",
        "code": "eg"
    },
    {
        "name": "El Salvador",
        "dialCode": "+503",
        "code": "sv"
    },
    {
        "name": "Equatorial Guinea",
        "dialCode": "+240",
        "code": "gq"
    },
    {
        "name": "Eritrea",
        "dialCode": "+291",
        "code": "er"
    },
    {
        "name": "Estonia",
        "dialCode": "+372",
        "code": "ee"
    },
    {
        "name": "Eswatini",
        "dialCode": "+268",
        "code": "sz"
    },
    {
        "name": "Ethiopia",
        "dialCode": "+251",
        "code": "et"
    },
    {
        "name": "Fiji",
        "dialCode": "+679",
        "code": "fj"
    },
    {
        "name": "Finland",
        "dialCode": "+358",
        "code": "fi"
    },
    {
        "name": "France",
        "dialCode": "+33",
        "code": "fr"
    },
    {
        "name": "Gabon",
        "dialCode": "+241",
        "code": "ga"
    },
    {
        "name": "Gambia",
        "dialCode": "+220",
        "code": "gm"
    },
    {
        "name": "Georgia",
        "dialCode": "+995",
        "code": "ge"
    },
    {
        "name": "Germany",
        "dialCode": "+49",
        "code": "de"
    },
    {
        "name": "Ghana",
        "dialCode": "+233",
        "code": "gh"
    },
    {
        "name": "Greece",
        "dialCode": "+30",
        "code": "gr"
    },
    {
        "name": "Grenada",
        "dialCode": "+1",
        "code": "gd"
    },
    {
        "name": "Guatemala",
        "dialCode": "+502",
        "code": "gt"
    },
    {
        "name": "Guinea",
        "dialCode": "+224",
        "code": "gn"
    },
    {
        "name": "Guinea-Bissau",
        "dialCode": "+245",
        "code": "gw"
    },
    {
        "name": "Guyana",
        "dialCode": "+592",
        "code": "gy"
    },
    {
        "name": "Haiti",
        "dialCode": "+509",
        "code": "ht"
    },
    {
        "name": "Honduras",
        "dialCode": "+504",
        "code": "hn"
    },
    {
        "name": "Hungary",
        "dialCode": "+36",
        "code": "hu"
    },
    {
        "name": "Iceland",
        "dialCode": "+354",
        "code": "is"
    },
    {
        "name": "India",
        "dialCode": "+91",
        "code": "in"
    },
    {
        "name": "Indonesia",
        "dialCode": "+62",
        "code": "id"
    },
    {
        "name": "Iran",
        "dialCode": "+98",
        "code": "ir"
    },
    {
        "name": "Iraq",
        "dialCode": "+964",
        "code": "iq"
    },
    {
        "name": "Ireland",
        "dialCode": "+353",
        "code": "ie"
    },
    {
        "name": "Israel",
        "dialCode": "+972",
        "code": "il"
    },
    {
        "name": "Italy",
        "dialCode": "+39",
        "code": "it"
    },
    {
        "name": "Jamaica",
        "dialCode": "+1",
        "code": "jm"
    },
    {
        "name": "Japan",
        "dialCode": "+81",
        "code": "jp"
    },
    {
        "name": "Jordan",
        "dialCode": "+962",
        "code": "jo"
    },
    {
        "name": "Kazakhstan",
        "dialCode": "+7 7",
        "code": "kz"
    },
    {
        "name": "Kenya",
        "dialCode": "+254",
        "code": "ke"
    },
    {
        "name": "Kiribati",
        "dialCode": "+686",
        "code": "ki"
    },
    {
        "name": "Kuwait",
        "dialCode": "+965",
        "code": "kw"
    },
    {
        "name": "Kyrgyzstan",
        "dialCode": "+996",
        "code": "kg"
    },
    {
        "name": "Laos",
        "dialCode": "+856",
        "code": "la"
    },
    {
        "name": "Latvia",
        "dialCode": "+371",
        "code": "lv"
    },
    {
        "name": "Lebanon",
        "dialCode": "+961",
        "code": "lb"
    },
    {
        "name": "Lesotho",
        "dialCode": "+266",
        "code": "ls"
    },
    {
        "name": "Liberia",
        "dialCode": "+231",
        "code": "lr"
    },
    {
        "name": "Libya",
        "dialCode": "+218",
        "code": "ly"
    },
    {
        "name": "Liechtenstein",
        "dialCode": "+423",
        "code": "li"
    },
    {
        "name": "Lithuania",
        "dialCode": "+370",
        "code": "lt"
    },
    {
        "name": "Luxembourg",
        "dialCode": "+352",
        "code": "lu"
    },
    {
        "name": "Madagascar",
        "dialCode": "+261",
        "code": "mg"
    },
    {
        "name": "Malawi",
        "dialCode": "+265",
        "code": "mw"
    },
    {
        "name": "Malaysia",
        "dialCode": "+60",
        "code": "my"
    },
    {
        "name": "Maldives",
        "dialCode": "+960",
        "code": "mv"
    },
    {
        "name": "Mali",
        "dialCode": "+223",
        "code": "ml"
    },
    {
        "name": "Malta",
        "dialCode": "+356",
        "code": "mt"
    },
    {
        "name": "Marshall Islands",
        "dialCode": "+692",
        "code": "mh"
    },
    {
        "name": "Mauritania",
        "dialCode": "+222",
        "code": "mr"
    },
    {
        "name": "Mauritius",
        "dialCode": "+230",
        "code": "mu"
    },
    {
        "name": "Mexico",
        "dialCode": "+52",
        "code": "mx"
    },
    {
        "name": "Micronesia",
        "dialCode": "+691",
        "code": "fm"
    },
    {
        "name": "Moldova",
        "dialCode": "+373",
        "code": "md"
    },
    {
        "name": "Monaco",
        "dialCode": "+377",
        "code": "mc"
    },
    {
        "name": "Mongolia",
        "dialCode": "+976",
        "code": "mn"
    },
    {
        "name": "Montenegro",
        "dialCode": "+382",
        "code": "me"
    },
    {
        "name": "Morocco",
        "dialCode": "+212",
        "code": "ma"
    },
    {
        "name": "Mozambique",
        "dialCode": "+258",
        "code": "mz"
    },
    {
        "name": "Myanmar",
        "dialCode": "+95",
        "code": "mm"
    },
    {
        "name": "Namibia",
        "dialCode": "+264",
        "code": "na"
    },
    {
        "name": "Nauru",
        "dialCode": "+674",
        "code": "nr"
    },
    {
        "name": "Nepal",
        "dialCode": "+977",
        "code": "np"
    },
    {
        "name": "Netherlands",
        "dialCode": "+31",
        "code": "nl"
    },
    {
        "name": "New Zealand",
        "dialCode": "+64",
        "code": "nz"
    },
    {
        "name": "Nicaragua",
        "dialCode": "+505",
        "code": "ni"
    },
    {
        "name": "Niger",
        "dialCode": "+227",
        "code": "ne"
    },
    {
        "name": "Nigeria",
        "dialCode": "+234",
        "code": "ng"
    },
    {
        "name": "North Macedonia",
        "dialCode": "+389",
        "code": "mk"
    },
    {
        "name": "Norway",
        "dialCode": "+47",
        "code": "no"
    },
    {
        "name": "Oman",
        "dialCode": "+968",
        "code": "om"
    },
    {
        "name": "Pakistan",
        "dialCode": "+92",
        "code": "pk"
    },
    {
        "name": "Palau",
        "dialCode": "+680",
        "code": "pw"
    },
    {
        "name": "Palestine",
        "dialCode": "+970",
        "code": "ps"
    },
    {
        "name": "Panama",
        "dialCode": "+507",
        "code": "pa"
    },
    {
        "name": "Papua New Guinea",
        "dialCode": "+675",
        "code": "pg"
    },
    {
        "name": "Paraguay",
        "dialCode": "+595",
        "code": "py"
    },
    {
        "name": "Peru",
        "dialCode": "+51",
        "code": "pe"
    },
    {
        "name": "Philippines",
        "dialCode": "+63",
        "code": "ph"
    },
    {
        "name": "Poland",
        "dialCode": "+48",
        "code": "pl"
    },
    {
        "name": "Portugal",
        "dialCode": "+351",
        "code": "pt"
    },
    {
        "name": "Qatar",
        "dialCode": "+974",
        "code": "qa"
    },
    {
        "name": "Romania",
        "dialCode": "+40",
        "code": "ro"
    },
    {
        "name": "Russian Federation",
        "dialCode": "+7",
        "code": "ru"
    },
    {
        "name": "Rwanda",
        "dialCode": "+250",
        "code": "rw"
    },
    {
        "name": "Saint Kitts and Nevis",
        "dialCode": "+1",
        "code": "kn"
    },
    {
        "name": "Saint Lucia",
        "dialCode": "+1",
        "code": "lc"
    },
    {
        "name": "Saint Vincent and the Grenadines",
        "dialCode": "+1",
        "code": "vc"
    },
    {
        "name": "Samoa",
        "dialCode": "+685",
        "code": "ws"
    },
    {
        "name": "San Marino",
        "dialCode": "+378",
        "code": "sm"
    },
    {
        "name": "Sao Tome and Principe",
        "dialCode": "+239",
        "code": "st"
    },
    {
        "name": "Saudi Arabia",
        "dialCode": "+966",
        "code": "sa"
    },
    {
        "name": "Senegal",
        "dialCode": "+221",
        "code": "sn"
    },
    {
        "name": "Serbia",
        "dialCode": "+381",
        "code": "rs"
    },
    {
        "name": "Seychelles",
        "dialCode": "+248",
        "code": "sc"
    },
    {
        "name": "Sierra Leone",
        "dialCode": "+232",
        "code": "sl"
    },
    {
        "name": "Singapore",
        "dialCode": "+65",
        "code": "sg"
    },
    {
        "name": "Slovakia",
        "dialCode": "+421",
        "code": "sk"
    },
    {
        "name": "Slovenia",
        "dialCode": "+386",
        "code": "si"
    },
    {
        "name": "Solomon Islands",
        "dialCode": "+677",
        "code": "sb"
    },
    {
        "name": "Somalia",
        "dialCode": "+252",
        "code": "so"
    },
    {
        "name": "South Africa",
        "dialCode": "+27",
        "code": "za"
    },
    {
        "name": "South Sudan",
        "dialCode": "+211",
        "code": "ss"
    },
    {
        "name": "Spain",
        "dialCode": "+34",
        "code": "es"
    },
    {
        "name": "Sri Lanka",
        "dialCode": "+94",
        "code": "lk"
    },
    {
        "name": "Sudan",
        "dialCode": "+249",
        "code": "sd"
    },
    {
        "name": "Suriname",
        "dialCode": "+597",
        "code": "sr"
    },
    {
        "name": "Sweden",
        "dialCode": "+46",
        "code": "se"
    },
    {
        "name": "Switzerland",
        "dialCode": "+41",
        "code": "ch"
    },
    {
        "name": "Syria",
        "dialCode": "+963",
        "code": "sy"
    },
    {
        "name": "Taiwan",
        "dialCode": "+886",
        "code": "tw"
    },
    {
        "name": "Tajikistan",
        "dialCode": "+992",
        "code": "tj"
    },
    {
        "name": "Tanzania",
        "dialCode": "+255",
        "code": "tz"
    },
    {
        "name": "Thailand",
        "dialCode": "+66",
        "code": "th"
    },
    {
        "name": "Timor-Leste",
        "dialCode": "+670",
        "code": "tl"
    },
    {
        "name": "Togo",
        "dialCode": "+228",
        "code": "tg"
    },
    {
        "name": "Tonga",
        "dialCode": "+676",
        "code": "to"
    },
    {
        "name": "Trinidad and Tobago",
        "dialCode": "+1",
        "code": "tt"
    },
    {
        "name": "Tunisia",
        "dialCode": "+216",
        "code": "tn"
    },
    {
        "name": "Turkey",
        "dialCode": "+90",
        "code": "tr"
    },
    {
        "name": "Turkmenistan",
        "dialCode": "+993",
        "code": "tm"
    },
    {
        "name": "Tuvalu",
        "dialCode": "+688",
        "code": "tv"
    },
    {
        "name": "Uganda",
        "dialCode": "+256",
        "code": "ug"
    },
    {
        "name": "Ukraine",
        "dialCode": "+380",
        "code": "ua"
    },
    {
        "name": "United Arab Emirates",
        "dialCode": "+971",
        "code": "ae"
    },
    {
        "name": "United Kingdom",
        "dialCode": "+44",
        "code": "gb"
    },
    {
        "name": "United States",
        "dialCode": "+1",
        "code": "us"
    },
    {
        "name": "Uruguay",
        "dialCode": "+598",
        "code": "uy"
    },
    {
        "name": "Uzbekistan",
        "dialCode": "+998",
        "code": "uz"
    },
    {
        "name": "Vanuatu",
        "dialCode": "+678",
        "code": "vu"
    },
    {
        "name": "Venezuela",
        "dialCode": "+58",
        "code": "ve"
    },
    {
        "name": "Vietnam",
        "dialCode": "+84",
        "code": "vn"
    },
    {
        "name": "Yemen",
        "dialCode": "+967",
        "code": "ye"
    },
    {
        "name": "Zambia",
        "dialCode": "+260",
        "code": "zm"
    },
    {
        "name": "Zimbabwe",
        "dialCode": "+263",
        "code": "zw"
    }
];

export default countries;