import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  exportModuleToPDF, 
  exportModuleToDocs, 
  exportModuleToCSV, 
  ModuleExportData 
} from '../utils/universalExportService.ts';

describe('Universal Export Service', () => {
  let fakeElement: any;

  beforeEach(() => {
    fakeElement = {
      href: '',
      download: '',
      click: vi.fn()
    };

    if (typeof global.document === 'undefined') {
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(fakeElement),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        }
      };
    }

    if (typeof global.URL === 'undefined' || !global.URL.createObjectURL) {
      (global as any).URL = {
        createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
        revokeObjectURL: vi.fn()
      };
    }
  });

  it('generates a valid jsPDF instance and triggers save for module export', () => {
    const data: ModuleExportData = {
      moduleTitle: 'Drone Swarm Command',
      moduleSubtitle: 'Active Tactical Swarm Grid Telemetry',
      classification: 'TOP SECRET // NOFORN',
      metadata: {
        'Active Drones': 18,
        'Mesh Frequency': '2.485 GHz',
        'C2 Link': 'NOMINAL'
      },
      summaryText: 'All 18 autonomous drone units in tight vector formation. Battery levels at 88%.',
      columns: [
        { header: 'Drone ID', key: 'id' },
        { header: 'Battery %', key: 'battery' },
        { header: 'Status', key: 'status' }
      ],
      rows: [
        { id: 'SWARM-01', battery: '92%', status: 'NOMINAL' },
        { id: 'SWARM-02', battery: '88%', status: 'NOMINAL' }
      ]
    };

    const filename = exportModuleToPDF(data);
    expect(filename).toContain('Drone_Swarm_Command');
    expect(filename).toContain('.pdf');
  });

  it('generates a Word (.doc) formatted blob link for module export', () => {
    const data: ModuleExportData = {
      moduleTitle: 'Electronic Warfare',
      moduleSubtitle: 'RF Jammer Spectrum Matrix',
      summaryText: 'RF Noise density injected at 50 mW/MHz across Ku band.'
    };

    const filename = exportModuleToDocs(data);
    expect(filename).toContain('Electronic_Warfare');
    expect(filename).toContain('.doc');
  });

  it('generates a CSV download for tabular data', () => {
    const columns = [
      { header: 'Satellite Name', key: 'name' },
      { header: 'Orbital Slot', key: 'slot' }
    ];
    const rows = [
      { name: 'Eutelsat 36B', slot: '36.0°E' },
      { name: 'Telstar 11N', slot: '37.5°W' }
    ];

    const filename = exportModuleToCSV('Constellation View', columns, rows);
    expect(filename).toContain('Constellation_View');
    expect(filename).toContain('.csv');
  });
});
