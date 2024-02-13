import { schemas } from '../schemas/fingerprint-server-api.yaml.client';

const response = {
  products: {
    identification: {
      data: {
        visitorId: 'e0srMXYG7PjFCAbE0yIH',
        requestId: '1707752932805.PWJZXo',
        browserDetails: {
          browserName: 'Chrome',
          browserMajorVersion: '121',
          browserFullVersion: '121.0.0',
          os: 'Mac OS X',
          osVersion: '10.15.7',
          device: 'Other',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        },
        incognito: false,
        ip: '194.65.9.105',
        ipLocation: {
          accuracyRadius: 200,
          latitude: 38.7373,
          longitude: -9.1945,
          postalCode: '1399-001',
          timezone: 'Europe/Lisbon',
          city: {
            name: 'Lisbon',
          },
          country: {
            code: 'PT',
            name: 'Portugal',
          },
          continent: {
            code: 'EU',
            name: 'Europe',
          },
          subdivisions: [
            {
              isoCode: '11',
              name: 'Lisbon',
            },
          ],
        },
        timestamp: 1707752932823,
        time: '2024-02-12T15:48:52Z',
        url: 'https://demo.fingerprint.com/playground',
        tag: {},
        confidence: {
          score: 1,
        },
        visitorFound: true,
        firstSeenAt: {
          global: '2023-12-11T20:19:26.996Z',
          subscription: '2023-12-11T20:19:26.996Z',
        },
        lastSeenAt: {
          global: '2024-02-12T14:17:07.282Z',
          subscription: '2024-02-12T14:17:07.282Z',
        },
      },
    },
    botd: {
      data: {
        bot: {
          result: 'notDetected',
        },
        url: 'https://demo.fingerprint.com/playground',
        ip: '194.65.9.105',
        time: '2024-02-12T15:48:52.854Z',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        requestId: '1707752932805.PWJZXo',
      },
    },
    rootApps: {
      data: {
        result: false,
      },
    },
    emulator: {
      // somebullshit: true,
      data: {
        // anotherbullshit: true,
        result: false,
      },
    },
    ipInfo: {
      data: {
        v4: {
          address: '194.65.9.105',
          geolocation: {
            accuracyRadius: 200,
            latitude: 38.7373,
            longitude: -9.1945,
            postalCode: '1399-001',
            timezone: 'Europe/Lisbon',
            city: {
              name: 'Lisbon',
            },
            country: {
              code: 'PT',
              name: 'Portugal',
            },
            continent: {
              code: 'EU',
              name: 'Europe',
            },
            subdivisions: [
              {
                isoCode: '11',
                name: 'Lisbon',
              },
            ],
          },
          asn: {
            asn: '3243',
            name: 'Servicos De Comunicacoes E Multimedia S.A.',
            network: '194.65.0.0/16',
          },
          datacenter: {
            result: false,
            name: '',
          },
        },
      },
    },
    ipBlocklist: {
      data: {
        result: false,
        details: {
          emailSpam: false,
          attackSource: false,
        },
      },
    },
    tor: {
      data: {
        result: false,
      },
    },
    vpn: {
      data: {
        result: false,
        originTimezone: 'Europe/Lisbon',
        originCountry: 'unknown',
        methods: {
          timezoneMismatch: false,
          publicVPN: false,
          auxiliaryMobile: false,
        },
      },
    },
    proxy: {
      data: {
        result: false,
      },
    },
    incognito: {
      data: {
        result: false,
      },
    },
    tampering: {
      data: {
        result: false,
        anomalyScore: 0,
      },
    },
    clonedApp: {
      data: {
        result: false,
      },
    },
    factoryReset: {
      data: {
        time: '1970-01-01T00:00:00Z',
        timestamp: 0,
      },
    },
    jailbroken: {
      data: {
        result: false,
      },
    },
    frida: {
      data: {
        result: false,
      },
    },
    privacySettings: {
      data: {
        result: false,
      },
    },
    virtualMachine: {
      data: {
        result: false,
      },
    },
    rawDeviceAttributes: {
      data: {
        applePay: {
          value: -1,
        },
        architecture: {
          value: 127,
        },
        audio: {
          value: 124.04344968475198,
        },
        canvas: {
          value: {
            Geometry: '32a115bd05e0f411c5ecd7e285fd36e2',
            Text: '1fd188f9714ca90a5a10eb2fc306b5eb',
            Winding: true,
          },
        },
        colorDepth: {
          value: 30,
        },
        colorGamut: {
          value: 'p3',
        },
        contrast: {
          value: 0,
        },
        cookiesEnabled: {
          value: true,
        },
        cpuClass: {},
        deviceMemory: {
          value: 8,
        },
        domBlockers: {},
        emoji: {
          value: {
            bottom: 28,
            font: 'Times',
            height: 18.5,
            left: 8,
            right: 1288,
            top: 9.5,
            width: 1280,
            x: 8,
            y: 9.5,
          },
        },
        fontPreferences: {
          value: {
            apple: 147.5625,
            default: 147.5625,
            min: 9.234375,
            mono: 133.0625,
            sans: 144.015625,
            serif: 147.5625,
            system: 146.09375,
          },
        },
        fonts: {
          value: ['Arial Unicode MS', 'Gill Sans', 'Helvetica Neue', 'Menlo'],
        },
        forcedColors: {
          value: false,
        },
        hardwareConcurrency: {
          value: 8,
        },
        hdr: {
          value: true,
        },
        indexedDB: {
          value: true,
        },
        invertedColors: {},
        languages: {
          value: [['en-US']],
        },
        localStorage: {
          value: true,
        },
        math: {
          value: '5963cfe25fe61d0bbd7b4920bc602dc8',
        },
        mathML: {
          value: {
            bottom: 26.5,
            font: 'Times',
            height: 18.5,
            left: 8,
            right: 294.53125,
            top: 8,
            width: 286.53125,
            x: 8,
            y: 8,
          },
        },
        monochrome: {
          value: 0,
        },
        openDatabase: {
          value: false,
        },
        osCpu: {},
        pdfViewerEnabled: {
          value: true,
        },
        platform: {
          value: 'MacIntel',
        },
        plugins: {
          value: [
            {
              description: 'Portable Document Format',
              mimeTypes: [
                {
                  suffixes: 'pdf',
                  type: 'application/x-google-chrome-pdf',
                },
              ],
              name: 'Chrome PDF Plugin',
            },
            {
              description: '',
              mimeTypes: [
                {
                  suffixes: 'pdf',
                  type: 'application/pdf',
                },
              ],
              name: 'Chrome PDF Viewer',
            },
          ],
        },
        privateClickMeasurement: {},
        reducedMotion: {
          value: false,
        },
        screenFrame: {
          value: [40, 0, 0, 0],
        },
        screenResolution: {
          value: [982, 1512],
        },
        sessionStorage: {
          value: true,
        },
        timezone: {
          value: 'Europe/Lisbon',
        },
        touchSupport: {
          value: {
            maxTouchPoints: 0,
            touchEvent: false,
            touchStart: false,
          },
        },
        vendor: {
          value: 'Google Inc.',
        },
        vendorFlavors: {
          value: ['chrome'],
        },
        webGlBasics: {
          value: {
            renderer: 'WebKit WebGL',
            rendererUnmasked: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
            vendor: 'WebKit',
            vendorUnmasked: 'Google Inc. (Apple)',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
          },
        },
        webGlExtensions: {
          value: {
            contextAttributes: '6b1ed336830d2bc96442a9d76373252a',
            extensionParameters: 'e10f179213af605e5c667167d18c6ce0',
            extensions: 'c2ff46f5dd0784c4e34b0c09bd5cdbf3',
            parameters: '0426062c5aaf9dc5cd53c37ba0a5ab79',
            shaderPrecisions: 'f223dfbcd580cf142da156d93790eb83',
          },
        },
      },
    },
    highActivity: {
      data: {
        result: true,
        dailyRequests: 22,
      },
    },
    locationSpoofing: {
      data: {
        result: false,
      },
    },
  },
};

const result = schemas.EventResponse.safeParse(response, {});

console.log(JSON.stringify(result, null, 2));
