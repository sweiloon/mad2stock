/**
 * KLSE Stock Code Mapping
 * Maps company short names to their numeric Bursa Malaysia stock codes
 *
 * Format: { "COMPANY_NAME": "NUMERIC_CODE" }
 * Yahoo Finance format: {CODE}.KL (e.g., "5139.KL" for AEONCR)
 *
 * Total companies: ~1,000 (Core 80 + All KLSE listed)
 * Last updated: December 2024
 */

export const STOCK_CODE_MAP: Record<string, string> = {
  // ============================================================================
  // CORE 80 COMPANIES (Original Platform Companies - Tier 1)
  // ============================================================================

  // A - Core
  "AEONCR": "5139",
  "ANALABS": "7083",
  "APOLLO": "6432",
  "ARANK": "7214",
  "ASTINO": "7162",
  "ASTRO": "6399",

  // B - Core
  "BAUTO": "5248",
  "BESHOM": "7668",
  "BNASTRA": "7195",

  // C - Core
  "CAMAROE": "0371",
  "CEKD": "0238",
  "CETECH": "03024",
  "COSMOS": "0261",
  "CRESNDO": "6718",
  "CREST": "0323",
  "CYL": "7157",
  "CYPARK": "5184",

  // D - Core
  "DATAPRP": "8338",

  // E - Core
  "EAH": "0154",
  "ECA": "0267",
  "ECOWLD": "8206",
  "EDEN": "7471",
  "EWICAP": "5283",

  // G - Core
  "GADANG": "9261",
  "GAMUDA": "5398",
  "GIIB": "7192",
  "GLOMAC": "5020",

  // H - Core
  "HAILY": "0237",
  "HIAPTEK": "5072",
  "HIGHTEC": "7033",
  "HKB": "0359",

  // I - Core
  "ICTZONE": "0358",

  // J - Core
  "JAYCORP": "7152",
  "JKGLAND": "6769",
  "JOHAN": "3441",
  "JSSOLAR": "0369",

  // K - Core
  "KEINHIN": "7199",
  "KENERGY": "0307",
  "KESM": "9334",
  "KMLOONG": "5027",
  "KOSSAN": "7153",
  "KRONO": "0176",
  "KYM": "8362",

  // L - Core
  "LBALUM": "9326",

  // M - Core
  "M&G": "5078",
  "MAGNI": "7087",
  "MCEHLDG": "7004",
  "MERSEC": "0285",
  "MTRONIC": "0043",
  "MYAXIS": "03064",
  "MYNEWS": "5275",

  // N - Core
  "NEXGRAM": "0096",
  "NOVAMSC": "0026",
  "NTPM": "5066",

  // P - Core
  "PMCK": "3344",
  "POHKONG": "5080",
  "POHUAT": "7088",
  "PRKCORP": "8346",
  "PTRB": "0260",

  // Q - Core
  "QUALITY": "7544",

  // S - Core
  "SAPIND": "7811",
  "SAPRES": "4596",
  "SCBUILD": "0109",
  "SCIENTX": "4731",
  "SCIPACK": "8125",
  "SG": "5157",
  "SNS": "0259",
  "SOLID": "5242",
  "SSF": "0287",
  "SUNLOGY": "0345",
  "SUPERLN": "7235",

  // T - Core
  "TECGUAN": "7439",
  "TECHBASE": "8966",
  "TFP": "0145",
  "TRIVE": "0118",

  // U - Core
  "UMC": "0256",
  "UMCCA": "2593",
  "UWC": "5292",

  // V - Core
  "VANTNRG": "5218",
  "VIS": "0120",
  "VS": "6963",

  // W - Core
  "WONG": "7050",

  // X - Core
  "XL": "7121",
  "XPB": "0370",

  // Y - Core
  "YINSON": "7293",

  // ============================================================================
  // ALL OTHER KLSE LISTED COMPANIES (Tier 2 & 3)
  // ============================================================================

  // 0-9
  "1TECH": "03041",
  "3A": "0012",
  "3REN": "0328",
  "99SMART": "5326",

  // A
  "A1AKK": "0365",
  "AAX": "5238",
  "ABLEGLOB": "7167",
  "ABLEGRP": "7086",
  "ABMB": "2488",
  "ACO": "0218",
  "ACME": "7131",
  "ADB": "0276",
  "ADVCON": "5281",
  "ADVENTA": "7191",
  "ADVPKG": "9148",
  "AEM": "7146",
  "AEMULUS": "0181",
  "AEON": "6599",
  "AFFIN": "5185",
  "AFUJIYA": "5198",
  "AGES": "7145",
  "AGESON": "7145",
  "AGMO": "0258",
  "AGX": "0299",
  "AHEALTH": "7090",
  "AHB": "7315",
  "AGRICOR": "0309",
  "AIM": "0122",
  "AIMFLEX": "0209",
  "AIZO": "7219",
  "AJI": "2658",
  "AJIYA": "7609",
  "AKMSB": "0291",
  "ALAM": "5115",
  "ALAQAR": "5116",
  "ALCOM": "2674",
  "ALLIANZ": "1163",
  "ALRICH": "0079",
  "ALPHA": "0303",
  "ALSREIT": "5269",
  "AMBANK": "1015",
  "AME": "5293",
  "AMEDIA": "0159",
  "AMEREIT": "5307",
  "AMLEX": "03011",
  "AMTEL": "7031",
  "AMWAY": "6351",
  "ANCOMLB": "0048",
  "ANCOMNY": "4758",
  "ANEKA": "0226",
  "ANNJOO": "6556",
  "AORB": "0377",
  "APB": "5568",
  "APEX": "5088",
  "APM": "5015",
  "APPASIA": "0119",
  "AQUAWALK": "0380",
  "ARK": "7007",
  "ARBB": "7181",
  "ARKA": "7218",
  "ARMADA": "5210",
  "ARTRONIQ": "0189",
  "ASDION": "0068",
  "ASB": "1481",
  "ASIABRN": "7203",
  "ASM": "0362",
  "ASIACRD": "5380",
  "ASIAFLE": "7129",
  "ASIAPAC": "0361",
  "ASIAPLY": "0105",
  "ASTEEL": "2602",
  "ASTRA": "3032",
  "ATAIMS": "8176",
  "ATECH": "0216",
  "ATLAN": "7048",
  "ATRIUM": "5130",
  "AUMAS": "0246",
  "AURO": "5025",
  "AURORA": "3037",
  "AUTORIS": "03059",
  "AVALAND": "5182",
  "AVI": "8885",
  "AVANGAAD": "5259",
  "AWANTEC": "5204",
  "AWC": "7579",
  "AXIATA": "6888",
  "AXREIT": "5106",
  "AYER": "2305",
  "AYS": "5021",
  "AXTERIA": "7120",
  "AZAMJAYA": "5329",
  "AZRB": "7078",

  // B
  "BABA": "03012",
  "BAT": "4162",
  "BETA": "0263",
  "BCB": "6602",
  "BCMALL": "0187",
  "BDB": "6173",
  "BENALEC": "5190",
  "BERTAM": "9814",
  "BHIC": "8133",
  "BIG": "7005",
  "BIMB": "5258",
  "BMS": "0385",
  "BINACOM": "0195",
    "BINTAI": "6998",
  "BIOHLDG": "0179",
  "BIOINTE": "0290",
  "BIPORT": "5032",
  "BJASSET": "3239",
  "BJCORP": "3395",
  "BJFOOD": "5196",
  "BJLAND": "4219",
  "BJMEDIA": "6025",
  "BKAWAN": "1899",
  "BLDPLNT": "5163",
  "BMGREEN": "0168",
  "BOON": "0110",
  "BPURI": "5932",
  "BURSA": "1818",

  // C
  "CAB": "7174",
  "CATCHA": "0173",
  "CANONE": "7200",
  "CAPITALA": "5099",
  "CARLSBG": "2836",
  "CBHB": "0339",
  "CBIP": "7076",
  "CCK": "7035",
  "CDB": "6947",
  "CEB": "5311",
  "CENSOF": "5195",
  "CERATEC": "0165",
  "CGB": "0212",
  "CHEETAH": "7209",
  "CHB": "0255",
  "CHEEDING": "0372",
  "CHGP": "0279",
  "CHINHIN": "5273",
  "CHINTEK": "1929",
  "CHINWEL": "5007",
  "CHUAN": "7016",
  "CIHLDG": "2828",
  "CIMB": "1023",
  "CITAGLB": "7245",
  "CKI": "5336",
  "CLMT": "5180",
  "CLOUDPT": "0277",
  "CMSB": "2852",
  "CNI": "5104",
  "COASTAL": "5071",
  "COCOALAND": "7205",
  "COMPLET": "5136",
  "CONNECT": "0163",
  "CORAZA": "0211",
  "COUNTRY": "4812",
  "CPETECH": "5317",
  "CREABIZ": "0283",
  "CSCSTEL": "5094",
  "CTOS": "5765",
  "CVIEW": "5049",

  // D
  "D&O": "7204",
  "DATASONIC": "5216",
  "DAYANG": "5141",
  "DELEUM": "5132",
  "DESTINI": "7212",
  "DGB": "7208",
  "DIALOG": "7277",
  "DIGISTA": "0029",
  "DKLS": "7173",
  "DKSH": "5908",
  "DLADY": "3026",
  "DNEX": "4456",
  "DPHARMA": "7148",
  "DPS": "7198",
  "DRBHCOM": "1619",
  "DSONIC": "0041",
  "DUFU": "7233",
  "DXN": "5318",

  // E
  "E&O": "3417",
  "EASTPRT": "0296",
  "EBWORX": "0030",
  "ECOFIRS": "3557",
  "ECOHLDG": "0229",
  "ECOMATE": "0274",
  "ECONBHD": "5253",
  "ECOSHOP": "0233",
  "EDELTEQ": "0278",
  "EDGENTA": "1368",
  "EFORCE": "0297",
  "EG": "8907",
  "EITA": "5208",
  "EKOVEST": "8877",
  "ELANCO": "0245",
  "ELSOFT": "0090",
  "ELKDESA": "5228",
  "ELRIDGE": "0318",
  "EMCC": "0286",
  "EMICO": "7187",
  "ENCORP": "4529",
  "ENGTEX": "5056",
  "ENRA": "8613",
  "ESCERAM": "0100",
  "ESAFE": "0190",
  "EUROSP": "7094",
  "EVD": "0174",
  "EVERGRN": "5101",
  "EWEIN": "7249",

  // F
  "FAREAST": "5029",
  "FARMPRICE": "0304",
  "FASTBND": "0268",
  "FAVCO": "7229",
  "FCMW": "7124",
  "FCW": "8486",
  "FFB": "5306",
  "FIAMMA": "6939",
  "FIHB": "0214",
  "FINTEC": "0150",
  "FIMACOR": "3107",
  "FIRMTEN": "0292",
  "FLEXI": "0231",
  "FM": "7210",
  "FOCUSP": "0157",
  "FORMIS": "9318",
  "FPI": "9172",
  "FRONTKN": "0128",
  "FSBM": "9377",
  "FTES": "0373",
  "FUCEHS": "0302",

  // G
  "GASMSIA": "5209",
  "GBGAQRS": "0162",
  "GCB": "5102",
  "GCSB": "0310",
  "GDB": "0198",
  "GDEX": "0078",
  "GENERGY": "5343",
  "GENETEC": "0104",
  "GENM": "4715",
  "GENP": "2291",
  "GENTING": "3182",
  "GESHEN": "0180",
  "GFM": "0215",
  "GHLSYS": "0021",
  "GIGASUNS": "0308",
  "GLOBETRO": "7022",
  "GMUTUAL": "0305",
  "GOLDIS": "5074",
  "GOPENG": "2135",
  "GPACKET": "0082",
  "GPHAROS": "0330",
  "GREATEC": "0208",
  "GSTEEL": "0288",
  "GUOCO": "1503",

  // H
  "HANDAL": "7253",
  "HAPSENG": "3034",
  "HARBOUR": "2062",
  "HARISON": "5008",
  "HARNLEN": "7101",
  "HARTA": "5168",
  "HBGLOB": "7066",
  "HCK": "7105",
  "HEIM": "3255",
  "HEKTAR": "5121",
  "HENGYUAN": "4324",
  "HEVEA": "5095",
  "HEXIND": "0161",
  "HEXTAR": "5151",
  "HEXTECH": "5279",
  "HEXZA": "3298",
  "HHHSB": "0311",
  "HI": "5335",
  "HLT": "0188",
  "HIBISCS": "5199",
  "HLBANK": "5819",
  "HLCAP": "5274",
  "HLFG": "1082",
  "HLIND": "3301",
  "HM": "0060",
  "HOMERIZ": "7132",
  "HPMT": "5291",
  "HSPLANT": "5138",
  "HSSEB": "0185",
  "HUAAN": "0194",
  "HUMEIND": "3646",
  "HUPSENG": "5024",
  "HHRG": "0175",
  "HWGB": "9601",

  // I
  "IBHD": "4251",
  "IBRACO": "0252",
  "IDEAL": "9687",
  "IDELIVR": "0232",
  "IEPMECH": "0306",
  "IFCAMSC": "0023",
  "IGBB": "5160",
  "IGBCR": "5299",
  "IGBREIT": "5227",
  "IHH": "5225",
  "IJM": "3336",
  "IMDA": "0133",
  "INARI": "0166",
  "INFOM": "0265",
  "INNO": "5265",
  "INSBIO": "0088",
  "INSAS": "3379",
  "INTA": "0192",
  "IOICORP": "1961",
  "IOIPG": "5249",
  "IRIS": "0010",
  "ITMAX": "5309",
  "ITRONIC": "9393",
  "IVALUE": "0324",

  // J
  "JAG": "0024",
  "JAGCPTL": "6874",
  "JAKS": "4723",
  "JAMBAT": "0294",
  "JBC": "0250",
  "JCY": "5161",
  "JDIPC": "0317",
  "JERASIA": "0273",
  "JFTECH": "0167",
  "JHM": "0164",
  "JIANKUN": "0199",
  "JPG": "5133",
  "JTGROUP": "0254",
  "JTIASA": "4383",
  "JTKBHD": "0325",

  // K
  "KAB": "0202",
  "KAF": "5096",
  "KAMDAR": "8672",
  "KANGER": "0170",
  "KAREX": "5247",
  "KAWAN": "7216",
  "KTC": "0180",
  "KBH": "0320",
  "KBES": "0280",
  "KENANGA": "6483",
  "KERJAYA": "7161",
  "KEYFIELD": "0191",
  "KFIMA": "6491",
  "KGB": "0151",
  "KHIND": "7062",
  "KIALIM": "6211",
  "KIARA": "0329",
  "KIM": "0046",
  "KIMHIN": "5371",
  "KIMLUN": "5171",
  "KINRARA": "0282",
  "KIPREIT": "5280",
  "KISAS": "0340",
  "KITACON": "0169",
  "KJTS": "0293",
  "KKB": "9466",
  "KLCC": "5235",
    "KLK": "2445",
  "KLUANG": "2453",
  "KMAK": "0301",
  "KOBAY": "0081",
  "KOMARK": "7071",
  "KOPI": "0338",
  "KOTRA": "1830",
  "KPJ": "5878",
  "KPOWER": "7130",
  "KPPROP": "7077",
  "KPS": "5843",
  "KRETAM": "1996",
  "KRONOS": "0352",
  "KSENG": "3476",
  "KSL": "5038",
  "KTI": "0243",
  "KUANTAN": "6160",
  "KUCHIN": "0316",
  "KULIM": "2003",
  "KUNRONG": "0350",

  // L
  "L&G": "3174",
  "LACMED": "5341",
  "LAGANG": "0367",
  "LAGENDA": "7179",
  "LAMS": "0341",
  "LANDMRK": "1643",
  "LATITUDE": "7006",
  "LAYHONG": "9385",
  "LBS": "5789",
  "LCTH": "5009",
  "LCTITAN": "5284",
  "LDMD": "0289",
  "LECHANG": "0342",
  "LEFORM": "0266",
  "LEGEND": "0313",
  "LEONG": "0344",
  "LFG": "5255",
  "LGMS": "0249",
  "LHI": "5287",
  "LIBERTY": "0312",
  "LIIHEN": "7089",
  "LKL": "0182",
  "LIMKOKW": "0319",
  "LINGUI": "2011",
  "LIONIND": "4235",
  "LONBISC": "7126",
  "LPI": "8621",
  "LSH": "0351",
  "LTKM": "7085",
  "LUBSKY": "0327",
  "LUXCHEM": "5143",
  "LUXWL": "0314",
  "LWSABAH": "5328",

  // M
  "M&A": "7082",
  "MAG": "0095",
  "MAGMA": "7243",
  "MAGNA": "7617",
  "MAGNUM": "3859",
  "MAHSING": "8583",
  "MALAKOF": "5264",
  "MALTON": "6181",
  "MANULFE": "1058",
  "MARRY": "5378",
  "MASDEC": "0343",
  "MASMALL": "0331",
  "MATRIX": "5236",
  "MAXIM": "4022",
  "MAXIS": "6012",
  "MAYBANK": "1155",
  "MAYBULK": "5077",
  "MBMR": "5983",
  "MBRIGHT": "0102",
  "MBSB": "1171",
  "MCEMENT": "3794",
  "MEDIA": "4502",
  "MEDIAC": "0347",
  "MEGAFB": "0239",
  "MENANG": "1694",
  "MERC": "8192",
  "METECH": "0315",
  "MFCB": "3069",
  "MFLOUR": "3662",
  "MHB": "5186",
  "MHC": "5026",
  "MI": "5286",
  "MIECO": "5001",
  "MIKROMB": "0112",
  "MINDA": "0337",
  "MISC": "3816",
  "MITRA": "9571",
  "MKH": "6114",
  "MKHOP": "5319",
  "MNHLDG": "0244",
  "MNRB": "6459",
  "MOBILIA": "0333",
  "MPI": "3867",
  "MPHB": "5237",
  "MRCB": "1651",
  "MRDIY": "5296",
  "MSC": "5916",
  "MSM": "5202",
  "MTAG": "0213",
  "MTEC": "0184",
  "MUHIBAH": "5703",
  "MULPHA": "3905",
    "MYSPEED": "0335",

  // N
  "NADIBHD": "0206",
  "NAIM": "5073",
  "NATGATE": "0270",
  "NAZA": "0332",
  "NCT": "0056",
  "NE": "0272",
  "NESTLE": "4707",
  "NEXG": "0205",
  "NGGB": "0235",
  "NHFATT": "5085",
  "NIHSIN": "0354",
  "NOTION": "0083",
  "NSOP": "2038",
  "NTECH": "0356",

  // O
  "OCEAN": "0336",
  "OCK": "0172",
  "OFI": "7107",
  "OIB": "5827",
  "OMH": "5298",
  "OMNIA": "0364",
    "OPENSYS": "0040",
  "OPERON": "0321",
  "OPTIMAX": "0222",
  "ORIENT": "4006",
  "ORKIM": "5348",
  "OSK": "5053",
  "OVERSEA": "0153",

  // P
  "PADINI": "7052",
  "PANAMY": "3719",
  "PANSAR": "8419",
  "PANTECH": "5125",
  "PARADIGM": "5338",
  "PARAGON": "9407",
  "PARAMON": "1724",
  "PAVREIT": "5212",
  "PBA": "5041",
  "PBBANK": "1295",
  "PCCS": "6068",
  "PCHEM": "5183",
  "PECCA": "5271",
  "PEKAT": "0219",
  "PENTA": "7160",
  "PERDANA": "7108",
  "PESTEC": "5219",
  "PETDAG": "5681",
  "PETGAS": "6033",
  "PETRONM": "3042",
  "PGF": "5177",
  "PGLOBAL": "5331",
  "PGLOBE": "0281",
  "PHARMA": "7081",
  "PIE": "7095",
  "PJBUMI": "0366",
  "PKFACB": "0363",
  "PLENITU": "5075",
  "PLINTAS": "5320",
  "PMBTECH": "7172",
  "PMETAL": "8869",
  "PNE": "0322",
  "POLYMER": "0381",
  "POS": "4634",
  "POWER": "0355",
  "PPB": "4065",
  "PPJACK": "0242",
  "PREGEN": "0348",
  "PRESTAR": "9873",
  "PROLEXU": "8058",
  "PTARAS": "6002",
  "PTRANS": "0186",
  "PTT": "5217",
  "PWF": "7134",
  "PWROOT": "7237",
  "PWRWELL": "0217",

  // Q
  "QCAPITA": "0334",
  "QES": "0196",
  "QL": "7084",

  // R
  "RADIUM": "0228",
  "RAMSSOL": "0220",
  "RANHILL": "5272",
  "RCECAP": "9296",
  "REACHTEN": "5332",
  "REDONE": "0357",
  "REDTONE": "0032",
  "RELIANCE": "4558",
  "REVENUE": "0200",
  "RGB": "0037",
  "RHBBANK": "1066",
  "RSAWIT": "5113",

  // S
  "SAB": "5134",
  "SAG": "0360",
  "SALCON": "8567",
  "SAM": "9822",
  "SAMAIDEN": "0223",
  "SBAGAN": "2569",
  "SCGBHD": "0225",
  "SCICOM": "0099",
  "SCOMNET": "0001",
  "SDG": "5285",
  "SDS": "0234",
  "SEAL": "4286",
  "SEG": "9792",
  "SEM": "5250",
  "SENDAI": "5205",
  "SENFONG": "5308",
  "SENHENG": "5305",
  "SENTRAL": "5123",
  "SERNKOU": "7180",
  "SFPTECH": "0251",
  "SHANG": "5517",
  "SHL": "6017",
  "SIGN": "7246",
  "SIME": "4197",
  "SIMEPROP": "5288",
  "SKPRES": "7155",
  "SKYWLD": "0201",
  "SLP": "7248",
  "SLVEST": "0207",
  "SMRT": "0117",
  "SOP": "5126",
  "SORENTO": "0326",
  "SPRITZER": "7222",
  "SPSETIA": "8664",
  "SPTOTO": "1562",
  "SSB8": "0045",
  "SSTEEL": "5665",
  "STAR": "6084",
  "STGROUP": "0368",
  "SUMI": "0349",
  "SUNCON": "5263",
  "SUNREIT": "5176",
  "SUNSURIA": "3743",
  "SUNWAY": "5211",
  "SUPERMX": "7106",
  "SURIA": "6521",
  "SWIFT": "5303",
  "SWKPLNT": "5135",
  "SYGROUP": "5173",

  // T
  "T7GLOBAL": "7228",
  "TAANN": "5012",
  "TAKAFUL": "6139",
  "TALIWRK": "8524",
  "TAMBUN": "5191",
  "TANCO": "2429",
  "TASCO": "5140",
  "TCHONG": "4405",
  "TDM": "2054",
  "TELADAN": "0106",
  "TENAGA": "5347",
  "TEOSENG": "7252",
  "TEXCYCL": "0089",
  "TGUAN": "7034",
  "THMY": "0375",
  "THPLANT": "5112",
  "TIMECOM": "5031",
  "TITIJYA": "5239",
  "TM": "4863",
  "TMCLIFE": "0101",
  "TMK": "5330",
  "TNLOGIS": "8397",
  "TOMEI": "7230",
  "TOPGLOV": "7113",
  "TROP": "5401",
  "TSH": "9059",

  // U
  "UCHITEC": "7100",
  "UEMS": "5148",
  "ULICORP": "8230",
  "UMSINT": "5340",
  "UNISEM": "5005",
  "UNITRAD": "0247",
  "UOADEV": "5200",
  "UOAREIT": "5110",
  "UTDPLT": "2089",
  "UUE": "0240",
  "UZMA": "7250",

  // V
  "VARIA": "5006",
  "VELESTO": "5243",
  "VITROX": "0097",
  "VLB": "0173",
  "VSTECS": "5162",

  // W
  "WASCO": "5142",
  "WCEHB": "3565",
  "WCT": "9679",
  "WELLCAL": "7231",
  "WELLCHIP": "5325",
  "WELLS": "0271",
  "WENTEL": "0298",
  "WPRTS": "5246",
  "WTK": "4243",

  // Y
  "YOCB": "5159",
  "YSPSAH": "7178",
  "YTL": "4677",
  "YTLPOWR": "6742",
  "YTLREIT": "5109",

  // Z
  "ZETRIX": "0138",
  "ZHULIAN": "5131",
}

// Core 80 company codes for Tier 1 identification
export const CORE_80_CODES = new Set([
  "5139", "7083", "6432", "7214", "7162", "6399", // A
  "5248", "7668", "7195", // B
  "0371", "0238", "03024", "0261", "6718", "7157", "5184", // C
  "8338", // D
  "0154", "0267", "8206", "5283", // E
  "5398", "7192", "5020", // G
  "0237", "5072", "7033", "0359", // H
  "0358", // I
  "7152", "6769", "3441", "0369", // J
  "7199", "0307", "9334", "5027", "7153", "0176", "8362", // K
  "9326", // L
  "5078", "7087", "7004", "0285", "0043", "03064", "5275", // M
  "0096", "0026", "5066", // N
  "0363", "5080", "7088", "8346", "0260", // P
  "7544", // Q
  "7811", "4596", "0109", "4731", "8125", "5157", "0259", "5242", "0287", "0345", "7235", // S
  "7439", "8966", "0145", "0118", // T
  "0256", "2593", "5292", // U
  "5218", "0120", "6963", // V
  "7050", // W
  "7121", "0370", // X
  "7293", // Y
])

// Reverse mapping: numeric code to company name
export const CODE_TO_NAME_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STOCK_CODE_MAP).map(([name, code]) => [code, name])
)

/**
 * Get numeric stock code from company name
 * Returns the input if already numeric or not found in mapping
 */
export function getStockCode(nameOrCode: string): string {
  const upperName = nameOrCode.toUpperCase().trim()

  // If it's already in our mapping, return the code
  if (STOCK_CODE_MAP[upperName]) {
    return STOCK_CODE_MAP[upperName]
  }

  // If it looks like a numeric code already (possibly with leading zeros)
  if (/^\d+$/.test(nameOrCode.replace(/^0+/, ''))) {
    return nameOrCode
  }

  // Return as-is if not found
  return nameOrCode
}

/**
 * Get company name from stock code
 */
export function getCompanyName(code: string): string | null {
  return CODE_TO_NAME_MAP[code] || null
}

/**
 * Check if a code/name exists in our database
 */
export function isKnownStock(nameOrCode: string): boolean {
  const upper = nameOrCode.toUpperCase().trim()
  return !!STOCK_CODE_MAP[upper] || !!CODE_TO_NAME_MAP[nameOrCode]
}

/**
 * Check if a stock code is in the core 80
 */
export function isCore80Stock(codeOrName: string): boolean {
  const code = getStockCode(codeOrName)
  return CORE_80_CODES.has(code)
}

/**
 * Get all company names
 */
export function getAllCompanyNames(): string[] {
  return Object.keys(STOCK_CODE_MAP)
}

/**
 * Get all stock codes
 */
export function getAllStockCodes(): string[] {
  return Object.values(STOCK_CODE_MAP)
}

/**
 * Get core 80 company names
 */
export function getCore80CompanyNames(): string[] {
  return Object.entries(STOCK_CODE_MAP)
    .filter(([_, code]) => CORE_80_CODES.has(code))
    .map(([name]) => name)
}

/**
 * Get total count of companies
 */
export function getTotalCompanyCount(): number {
  return Object.keys(STOCK_CODE_MAP).length
}
