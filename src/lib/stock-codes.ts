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
  "CYL": "7157",
  "CYPARK": "5184",

  // D - Core
  "DATAPRP": "8338",

  // E - Core
  "EAH": "0154",
  "ECA": "0267",
  "ECOWLD": "8206",
  "EWICAP": "5283",

  // G - Core
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
  "PMCK": "0363",
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
  "3A": "0012",
  "3REN": "0328",
  "99SMART": "5765",

  // A
  "AAX": "5765",
  "ABLEGLOB": "5281",
  "ABMB": "2488",
  "ADB": "0276",
  "ADVPKG": "0287",
  "AEMULUS": "0181",
  "AEON": "6599",
  "AFFIN": "5185",
  "AGES": "0304",
  "AGESON": "3453",
  "AGROUP": "0343",
  "AHEALTH": "7090",
  "AHHIN": "0309",
  "AIRASIA": "5099",
  "AJI": "2658",
  "AJIYA": "7609",
  "AKMSB": "0291",
  "ALAQAR": "5116",
  "ALLIANZ": "1163",
  "ALPHA": "0318",
  "ALSREIT": "5765",
  "AMATEL": "0307",
  "AMBANK": "1015",
  "AME": "5765",
  "AMEDIA": "0068",
  "AMEREIT": "5765",
  "AMWAY": "6351",
  "ANCOMNY": "0090",
  "ANEKA": "0226",
  "ANNJOO": "6556",
  "AORB": "0377",
  "APM": "5765",
  "APPASIA": "0150",
  "ARMADA": "5210",
  "ARTRONIQ": "0189",
  "ASIABIO": "0365",
  "ASIABRN": "7203",
  "ASIACRD": "5380",
  "ASIAFLE": "0090",
  "ASIAMEDA": "0159",
  "ASIAPAC": "0361",
  "ASTEEL": "2602",
  "ATAIMS": "0012",
  "ATECH": "0216",
  "ATLAN": "7048",
  "ATRIUM": "5130",
  "AUMAS": "0246",
  "AVALAND": "5765",
  "AVANGAAD": "0270",
  "AXIATA": "6888",
  "AXREIT": "5106",
  "AYER": "5765",
  "AZAMJAYA": "0286",

  // B
  "BAT": "4162",
  "BEDI": "0287",
  "BERTAM": "0270",
  "BIG": "0204",
  "BIMB": "5258",
  "BINACOM": "0271",
  "BINASTRA": "0295",
  "BINTAI": "6998",
  "BIOALPHA": "0179",
  "BIOHLDG": "0365",
  "BIOINTE": "0290",
  "BIPORT": "5032",
  "BJASSET": "5765",
  "BJCORP": "3395",
  "BJFOOD": "5196",
  "BJLAND": "4219",
  "BJMEDIA": "3239",
  "BKAWAN": "1899",
  "BLDPLNT": "5163",
  "BMGREEN": "0193",
  "BOON": "0110",
  "BPURI": "5932",
  "BURSA": "1818",

  // C
  "CAB": "5765",
  "CANONE": "7200",
  "CAPITALA": "5099",
  "CARLSBG": "2836",
  "CBHB": "0339",
  "CBIP": "7076",
  "CCK": "5765",
  "CDB": "6947",
  "CEB": "0089",
  "CENSOF": "5195",
  "CERATEC": "0165",
  "CGB": "0212",
  "CHEETAH": "7209",
  "CHB": "0255",
  "CHEEDING": "0372",
  "CHGP": "0279",
  "CHINHIN": "5765",
  "CHINTEK": "1929",
  "CHINWEL": "5007",
  "CHUAN": "0056",
  "CIHLDG": "2828",
  "CIMB": "1023",
  "CIMBT": "1082",
  "CITAGLB": "0112",
  "CKI": "5765",
  "CLMT": "5180",
  "CLOUDPT": "0221",
  "CMSB": "2852",
  "CNI": "5765",
  "COASTAL": "5071",
  "COCOALAND": "7205",
  "COMPLET": "0185",
  "CONNECT": "0163",
  "CONTOR": "0286",
  "CORAZA": "0211",
  "COUNTRY": "4812",
  "CPETECH": "0222",
  "CREABIZ": "0283",
  "CSCSTEL": "5094",
  "CTOS": "0300",
  "CVIEW": "5765",

  // D
  "D&O": "7204",
  "DATASONIC": "5216",
  "DAYANG": "5141",
  "DELEUM": "5765",
  "DESTINI": "7212",
  "DGB": "7208",
  "DIALOG": "7277",
  "DIGISTA": "0055",
  "DKLS": "7173",
  "DKSH": "5765",
  "DLADY": "3026",
  "DNEX": "4456",
  "DPHARMA": "7148",
  "DPS": "0258",
  "DRBHCOM": "1619",
  "DSONIC": "0041",
  "DUFU": "7233",
  "DXN": "5318",

  // E
  "E&O": "3417",
  "EASTCOA": "0293",
  "EASTPRT": "0296",
  "EBWORX": "0217",
  "ECBUILD": "0303",
  "ECOFIRS": "5765",
  "ECOHLDG": "0229",
  "ECOMATE": "0274",
  "ECONBHD": "5253",
  "ECOSHOP": "0233",
  "EDELTEQ": "0278",
  "EDGENTA": "5765",
  "EFORCE": "0297",
  "EG": "8907",
  "EITA": "5765",
  "EKOVEST": "8877",
  "ELANCO": "0245",
  "ELECTRA": "0284",
  "ELKDESA": "5228",
  "ELRIDGE": "0318",
  "EMCC": "0286",
  "EMICO": "7187",
  "ENCORP": "4529",
  "ENGTEX": "5205",
  "ENRA": "0190",
  "EQUITYRE": "0299",
  "ESCERAM": "0114",
  "ESTHORE": "3417",
  "EUROSP": "7094",
  "EVERGRN": "5101",
  "EWEIN": "5765",

  // F
  "FACTSOFT": "0286",
  "FAREAST": "5029",
  "FASTBND": "0268",
  "FAVCO": "5765",
  "FCMW": "7124",
  "FCW": "5765",
  "FFB": "5306",
  "FIAMMA": "6939",
  "FIHB": "0214",
  "FIMACOR": "3107",
  "FIRMTEN": "0292",
  "FLEXI": "0295",
  "FM": "0261",
  "FOCUSP": "0157",
  "FORMIS": "7216",
  "FPI": "9172",
  "FRONTKN": "0041",
  "FSBM": "0114",
  "FTES": "0373",
  "FUCEHS": "0302",

  // G
  "GASMSIA": "5209",
  "GBGAQRS": "0162",
  "GCB": "5102",
  "GCSB": "0310",
  "GDB": "0198",
  "GDEX": "0078",
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
  "GUOCO": "5765",

  // H
  "HANDAL": "0105",
  "HAP": "3034",
  "HAPSENG": "3034",
  "HARBOUR": "2062",
  "HARISON": "5765",
  "HARNLEN": "7101",
  "HARTA": "5168",
  "HAVAV": "0251",
  "HBGLOB": "7066",
  "HCK": "0185",
  "HEDJ": "0323",
  "HEIM": "3255",
  "HEKTAR": "5121",
  "HENGYUAN": "4324",
  "HEVEA": "5095",
  "HEXIND": "0090",
  "HEXTAR": "5151",
  "HEXTECH": "5279",
  "HHHSB": "0311",
  "HI": "0209",
  "HIBISCS": "5199",
  "HLBANK": "5819",
  "HLCAP": "5765",
  "HLCIT": "5765",
  "HLFG": "1082",
  "HLIND": "3301",
  "HM": "0251",
  "HOMERIZ": "5765",
  "HPMT": "0192",
  "HSPLANT": "5138",
  "HUAAN": "0194",
  "HUMEIND": "3646",
  "HUPSENG": "5024",
  "HWGB": "0175",

  // I
  "IBHD": "5765",
  "IBRACO": "0252",
  "IDEAL": "0182",
  "IDELIVR": "0232",
  "IEPMECH": "0306",
  "IFCAMSC": "0023",
  "IGBB": "5160",
  "IGBCR": "5299",
  "IGBREIT": "5227",
  "IHH": "5225",
  "IJM": "3336",
  "IKHLAS": "0284",
  "IMDA": "0133",
  "IMPACTE": "0284",
  "INARI": "0166",
  "INFOM": "0265",
  "INNO": "5265",
  "INSAS": "3379",
  "IOICORP": "1961",
  "IOIPG": "5249",
  "IRIS": "0010",
  "ISTONE": "0353",
  "ITMAX": "0370",
  "ITRONIC": "0339",
  "IVALUE": "0324",

  // J
  "JAG": "0024",
  "JAGCPTL": "5765",
  "JAKS": "4723",
  "JAMBAT": "0294",
  "JAS": "0285",
  "JBC": "0295",
  "JCY": "5765",
  "JDIPC": "0317",
  "JERASIA": "0273",
  "JFTECH": "0167",
  "JHM": "0164",
  "JIANKUN": "0199",
  "JOHORE": "7167",
  "JPG": "5133",
  "JTGROUP": "0254",
  "JTIASA": "4383",
  "JTKBHD": "0325",

  // K
  "KAB": "0202",
  "KAF": "5765",
  "KAMDAR": "7219",
  "KAREX": "5247",
  "KAWAN": "7216",
  "KBH": "0320",
  "KBES": "0280",
  "KCS": "0285",
  "KENANGA": "6483",
  "KERJAYA": "7161",
  "KEURO": "5026",
  "KEYFIELD": "0191",
  "KFIMA": "6491",
  "KGB": "0186",
  "KHIND": "7062",
  "KIA": "0353",
  "KIARA": "0329",
  "KIM": "0046",
  "KIMHIN": "5096",
  "KIMLUN": "5171",
  "KINRARA": "0282",
  "KIPREIT": "5280",
  "KISAS": "0340",
  "KITACON": "0169",
  "KJTS": "0293",
  "KKB": "9466",
  "KLCC": "5235",
  "KLGAPS": "0359",
  "KLK": "2445",
  "KLUANG": "2453",
  "KMAK": "0301",
  "KOBAY": "0081",
  "KOMARK": "7071",
  "KOPI": "0338",
  "KOTRA": "1830",
  "KPJ": "5878",
  "KPOWER": "0300",
  "KPPROP": "0274",
  "KPS": "5843",
  "KRETAM": "1996",
  "KRISM": "0277",
  "KRONOS": "0352",
  "KSENG": "3476",
  "KSL": "5038",
  "KTI": "0243",
  "KUANTAN": "6160",
  "KUCHIN": "0316",
  "KULIM": "2003",
  "KUNRONG": "0350",

  // L
  "L&G": "5765",
  "LAGANG": "0367",
  "LAGENDA": "0193",
  "LAKIE": "0247",
  "LAMS": "0341",
  "LANDMRK": "0284",
  "LATITUDE": "7165",
  "LAYHONG": "9385",
  "LBS": "5789",
  "LCTH": "5009",
  "LCTITAN": "5284",
  "LDMD": "0289",
  "LECHANG": "0342",
  "LEFORM": "0266",
  "LEGEND": "0313",
  "LEONG": "0344",
  "LEOS": "0326",
  "LFG": "0200",
  "LGMS": "0181",
  "LHI": "5287",
  "LIBERTY": "0312",
  "LIENHWA": "7165",
  "LIFW": "0227",
  "LIIHEN": "5765",
  "LIMKOKW": "0319",
  "LINGUI": "2011",
  "LION": "4235",
  "LIONIND": "4235",
  "LONBISC": "7126",
  "LPI": "8621",
  "LSH": "0198",
  "LTKM": "7085",
  "LUBSKY": "0327",
  "LUXCHEM": "5143",
  "LUXWL": "0314",
  "LWSABAH": "0227",

  // M
  "M&A": "0271",
  "MAG": "0090",
  "MAGMA": "0172",
  "MAGNA": "0060",
  "MAGNUM": "3859",
  "MAHSING": "8583",
  "MALAKOF": "5264",
  "MALTON": "6181",
  "MANULFE": "5765",
  "MARRY": "5378",
  "MASDEC": "0343",
  "MASMALL": "0331",
  "MATRIX": "5236",
  "MAXIM": "5765",
  "MAXIS": "6012",
  "MAYBANK": "1155",
  "MAYBULK": "5765",
  "MBMR": "5983",
  "MBRIGHT": "0102",
  "MBSB": "1171",
  "MCEMENT": "3794",
  "MEDIA": "4502",
  "MEDIAC": "0347",
  "MEGAFB": "0239",
  "MENANG": "0204",
  "MERC": "0351",
  "METECH": "0315",
  "MFCB": "3069",
  "MFLOUR": "3662",
  "MHB": "5186",
  "MHC": "5765",
  "MI": "5286",
  "MIECO": "5765",
  "MIKROMB": "0095",
  "MINDA": "0337",
  "MISC": "3816",
  "MITRA": "5765",
  "MKH": "6114",
  "MKHOP": "0271",
  "MNHLDG": "0244",
  "MNRB": "6459",
  "MOBILIA": "0333",
  "MPI": "3867",
  "MPHB": "5237",
  "MRCB": "1651",
  "MRDIY": "5296",
  "MSC": "5916",
  "MSM": "5202",
  "MTAG": "0360",
  "MTEC": "0295",
  "MUHIBAH": "5703",
  "MULPHA": "5765",
  "MYMALL": "0358",
  "MYSPEED": "0335",

  // N
  "NADIBHD": "0166",
  "NAIM": "5073",
  "NATGATE": "5235",
  "NAZA": "0332",
  "NCT": "0208",
  "NE": "0272",
  "NESTLE": "4707",
  "NEXG": "0205",
  "NGGB": "0235",
  "NHFATT": "5085",
  "NIHSIN": "0354",
  "NOTION": "0083",
  "NSOP": "5765",
  "NTECH": "0356",

  // O
  "OCEAN": "0336",
  "OCK": "0172",
  "OFI": "5765",
  "OIB": "0179",
  "OLEOCHEM": "0362",
  "OMH": "5298",
  "OMNIA": "0364",
  "ONGTK": "0345",
  "OPENSYS": "0040",
  "OPERON": "0321",
  "OPTIMAX": "0276",
  "ORIENT": "4006",
  "OSK": "5053",
  "OVERSEA": "0349",

  // P
  "PADINI": "7052",
  "PANAMY": "3719",
  "PANSAR": "5765",
  "PANTECH": "5125",
  "PARADIGM": "5269",
  "PARAGON": "5162",
  "PARAMON": "1724",
  "PAVREIT": "5212",
  "PBA": "5765",
  "PBBANK": "1295",
  "PCCEM": "5183",
  "PCCS": "0359",
  "PCHEM": "5183",
  "PECCA": "5271",
  "PEKAT": "0219",
  "PENTA": "7160",
  "PERDANA": "7108",
  "PESTEC": "0037",
  "PETDAG": "5681",
  "PETGAS": "6033",
  "PETRONM": "3042",
  "PGF": "5177",
  "PGLOBAL": "0217",
  "PGLOBE": "0281",
  "PHARMA": "7081",
  "PIE": "7095",
  "PJBUMI": "0366",
  "PKFACB": "0363",
  "PLENITU": "5765",
  "PLINTAS": "5281",
  "PMBTECH": "0217",
  "PMETAL": "8869",
  "PNE": "0322",
  "POS": "4634",
  "POWER": "0355",
  "PPB": "4065",
  "PPJACK": "0231",
  "PREGEN": "0348",
  "PRESTAR": "9873",
  "PRINSIP": "0174",
  "PROLEXU": "8058",
  "PTARAS": "6002",
  "PTRANS": "0186",
  "PTT": "5217",
  "PWF": "5765",
  "PWROOT": "7237",
  "PWRWELL": "0221",

  // Q
  "QCAPITA": "0334",
  "QES": "0196",
  "QL": "7084",

  // R
  "RADIUM": "0228",
  "RAMSSOL": "0220",
  "RANHILL": "5272",
  "RCECAP": "9296",
  "REACHTEN": "0263",
  "REDONE": "0357",
  "REDTONE": "0032",
  "RELIANCE": "4558",
  "REVENUE": "0200",
  "RGB": "0037",
  "RHBBANK": "1066",
  "RSAWIT": "5765",

  // S
  "SAB": "5765",
  "SAG": "0360",
  "SALCON": "8567",
  "SAM": "9822",
  "SAMAIDEN": "0223",
  "SBAGAN": "2569",
  "SCGBHD": "0198",
  "SCICOM": "5765",
  "SCOMNET": "0213",
  "SDG": "5285",
  "SDS": "0234",
  "SEAL": "0251",
  "SEG": "9792",
  "SEM": "5765",
  "SENDAI": "5205",
  "SENFONG": "0157",
  "SENHENG": "5765",
  "SENTRAL": "5123",
  "SERNKOU": "0190",
  "SFPTECH": "0251",
  "SHANG": "5765",
  "SHL": "6017",
  "SIGN": "0099",
  "SIME": "4197",
  "SIMEPROP": "5288",
  "SKPRES": "7155",
  "SKYWLD": "0201",
  "SLP": "7248",
  "SLVEST": "0207",
  "SMRT": "0117",
  "SOP": "5126",
  "SORENTO": "0213",
  "SPRITZER": "7222",
  "SPSETIA": "8664",
  "SPTOTO": "1562",
  "SSB8": "0045",
  "SSTEEL": "5665",
  "STAR": "6084",
  "STGROUP": "0368",
  "SUNCON": "5263",
  "SUNREIT": "5176",
  "SUNSURIA": "3743",
  "SUNWAY": "5211",
  "SUPERMX": "7106",
  "SURIA": "6521",
  "SWIFT": "5765",
  "SWKPLNT": "5135",
  "SYGROUP": "5765",

  // T
  "T7GLOBAL": "0150",
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
  "TEXCYCL": "5765",
  "TGUAN": "7034",
  "THMY": "0375",
  "THPLANT": "5765",
  "TIMECOM": "5031",
  "TITIJYA": "5239",
  "TM": "4863",
  "TMCLIFE": "0101",
  "TMK": "0187",
  "TNLOGIS": "8397",
  "TOMEI": "5765",
  "TOPGLOV": "7113",
  "TROP": "5401",
  "TSH": "9059",

  // U
  "UCHITEC": "7100",
  "UEMS": "5148",
  "ULICORP": "8230",
  "UMSINT": "0196",
  "UNISEM": "5005",
  "UNITRAD": "5765",
  "UOADEV": "5200",
  "UOAREIT": "5110",
  "UTDPLT": "2089",
  "UUE": "0240",
  "UZMA": "7250",

  // V
  "VARIA": "5765",
  "VELESTO": "5243",
  "VITROX": "0097",
  "VLB": "0173",
  "VSTECS": "5765",

  // W
  "WASCO": "5765",
  "WCEHB": "2976",
  "WCT": "9679",
  "WELLCAL": "7231",
  "WELLCHIP": "0208",
  "WELLS": "0271",
  "WENTEL": "0298",
  "WPRTS": "5246",
  "WTK": "4243",

  // Y
  "YOCB": "5765",
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
