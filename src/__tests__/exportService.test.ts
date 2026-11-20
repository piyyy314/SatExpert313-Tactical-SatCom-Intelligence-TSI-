import { describe, it, expect, vi, beforeEach } from 'vitest';

const { saveMock } = vi.hoisted(() => ({
  saveMock: vi.fn()
}));

vi.mock('jspdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jspdf')>();
  const OriginalJsPDF = actual.default || (actual as any).jsPDF;
  const WrappedJsPDF = function (...args: any[]) {
    const instance = new OriginalJsPDF(...args);
    instance.save = saveMock;
    return instance;
  } as any;
  WrappedJsPDF.API = OriginalJsPDF.API;
  WrappedJsPDF.prototype = OriginalJsPDF.prototype;
  return {
    ...actual,
    default: WrappedJsPDF,
    jsPDF: WrappedJsPDF
  };
});

import {
  exportService,
  exportToPDF,
  calculateFSPL,
  formatCoordinates,
  TacticalReportData,
  ModuleExportData
} from '../services/exportService.ts';

describe('Centralized Export Service', () => {
  let fakeAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    saveMock.mockClear();
    fakeAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    };

    if (typeof global.document === 'undefined') {
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(fakeAnchor),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        }
      };
    }

    if (typeof global.URL === 'undefined' || !global.URL.createObjectURL) {
      (global as any).URL = {
        createObjectURL: vi.fn().mockReturnValue('blob:test-export'),
        revokeObjectURL: vi.fn()
      };
    }
  });

  it('computes FSPL and formats tactical coordinates properly', () => {
    expect(calculateFSPL(0)).toBe(205.5);
    expect(calculateFSPL(36000, 12.0)).toBeGreaterThan(204);
    expect(formatCoordinates({ lat: 26.5, lng: 56.4 })).toBe('26.5000°N, 56.4000°E');
    expect(formatCoordinates({ lat: -33.8688, lng: -118.2437 })).toBe('33.8688°S, 118.2437°W');
  });

  it('generates multi-page tactical PDF report with logs and custom notes', () => {
    const data: TacticalReportData = {
      classification: 'TOP SECRET // NOFORN',
      defcon: 2,
      isStealthMode: true,
      isJamming: true,
      jammingPower: 65,
      weather: 'LIGHT_RAIN',
      operatorName: 'OPERATOR-313',
      stationCoordinates: { lat: 26.34, lng: 56.41 },
      selectedSatellite: {
        id: 't-11w',
        name: 'Telstar 11N',
        longitude: -37.5,
        orbitalSlot: '37.5°W',
        operator: 'Telesat',
        status: 'active'
      },
      lookAngles: {
        azimuth: 248.4,
        elevation: 19.2,
        skew: -41.3,
        distance: 39420
      },
      telemetry: {
        snr: '12.4',
        rxPower: '-47.2',
        bucTemp: '48.1',
        packetLoss: '0.25',
        status: 'NOMINAL'
      },
      activeView: 'tactical',
      notes: 'Elevated RF sweep interference observed near TSS inbound channel.',
      eventLogs: [
        {
          id: 'log-1',
          timestamp: '12:00:00',
          satName: 'Telstar 11N',
          satId: 't-11w',
          status: 'CRITICAL',
          detail: 'High-power thermal anomaly detected.'
        }
      ]
    };

    const { doc, filename } = exportService.exportTacticalReportPDF(data);
    expect(doc.getNumberOfPages()).toBe(2);
    expect(filename).toContain('Tactical_Report_Telstar_11N_');
    expect(saveMock).toHaveBeenCalledWith(filename);
  });

  it('supports generic exportToPDF function across app modules without disk writes', () => {
    const payload: ModuleExportData = {
      moduleTitle: 'Quantum Entropy',
      moduleSubtitle: 'FIPS 203/204 RNG Telemetry',
      classification: 'SECRET // REL TO NATO',
      metadata: {
        ShannonEntropy: '7.984 bits',
        KeyStatus: 'LOCKED'
      },
      summaryText: 'Entropy pool operating within NIST SP 800-90B bounds.',
      columns: [
        { header: 'Metric', key: 'metric' },
        { header: 'Reading', key: 'value' }
      ],
      rows: [
        { metric: 'QBER', value: '0.18%' },
        { metric: 'Fidelity', value: '99.7%' }
      ]
    };

    const filename = exportToPDF(payload);
    expect(filename).toMatch(/^TSI_Quantum_Entropy_Report_\d+\.pdf$/);
    expect(saveMock).toHaveBeenCalledWith(filename);
  });
});
