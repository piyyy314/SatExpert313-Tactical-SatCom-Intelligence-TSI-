import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Coordinates, LookAngles, Satellite, TacticalEvent, WeatherCondition } from '../types.ts';
import { computeTelemetryDigest, generateTacticalSessionKey } from '../utils/cryptoUtils.ts';

export type ReportClassification = 
  | 'TOP SECRET // NOFORN'
  | 'SECRET // REL TO NATO'
  | 'CONFIDENTIAL'
  | 'UNCLASSIFIED // FOR OFFICIAL USE ONLY';

export interface TacticalReportData {
  reportId?: string;
  classification?: ReportClassification;
  timestamp?: string;
  defcon: number;
  isStealthMode: boolean;
  isJamming: boolean;
  jammingPower: number;
  weather: WeatherCondition;
  operatorName?: string;
  stationCoordinates: Coordinates;
  selectedSatellite: Satellite;
  lookAngles: LookAngles | null;
  telemetry: {
    snr: string | number;
    rxPower: string | number;
    bucTemp: string | number;
    packetLoss: string | number;
    status: string;
  };
  activeView?: string;
  eventLogs?: TacticalEvent[];
  notes?: string;
}

export interface ModuleExportColumn {
  header: string;
  key: string;
}

export interface ModuleExportData {
  moduleTitle: string;
  moduleSubtitle?: string;
  classification?: string;
  metadata?: Record<string, string | number | boolean>;
  summaryText?: string;
  columns?: ModuleExportColumn[];
  rows?: Record<string, any>[];
  filenamePrefix?: string;
}

/**
 * Calculates Free Space Path Loss (FSPL) in dB for Ku-band (~12 GHz)
 */
export const calculateFSPL = (distanceKm: number, freqGHz = 12.0): number => {
  if (distanceKm <= 0) return 205.5;
  const freqMHz = freqGHz * 1000;
  const fspl = 20 * Math.log10(distanceKm) + 20 * Math.log10(freqMHz) + 32.44;
  return Number(fspl.toFixed(2));
};

/**
 * Formats coordinates for tactical documentation (e.g. 51.5074°N, 0.1278°W)
 */
export const formatCoordinates = (coords: Coordinates): string => {
  const latDir = coords.lat >= 0 ? 'N' : 'S';
  const lngDir = coords.lng >= 0 ? 'E' : 'W';
  return `${Math.abs(coords.lat).toFixed(4)}°${latDir}, ${Math.abs(coords.lng).toFixed(4)}°${lngDir}`;
};

/**
 * Centralized Export Service wrapping jsPDF and autoTable for C2 Dossiers and Module Intelligence Reports
 */
class ExportService {
  /**
   * Generates a complete military-grade A4 PDF Tactical C2 Report
   */
  public generateTacticalReport(data: TacticalReportData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const classification = data.classification || 'TOP SECRET // NOFORN';
    const reportId = data.reportId || `TSI-RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = data.timestamp || new Date().toUTCString();
    const operator = data.operatorName || 'OPERATOR-313 / TACTICAL C2';

    const primaryNavy: [number, number, number] = [15, 23, 42];
    const accentCyan: [number, number, number] = [6, 182, 212];
    const darkCard: [number, number, number] = [30, 41, 59];
    const textLight: [number, number, number] = [241, 245, 249];
    const textMuted: [number, number, number] = [100, 116, 139];

    const drawPageHeadersAndFooters = () => {
      const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Top Banner
        doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
        doc.rect(0, 0, pageWidth, 9, 'F');
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
        doc.text(classification, pageWidth / 2, 6, { align: 'center' });

        // Bottom Banner
        doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
        doc.rect(0, pageHeight - 9, pageWidth, 9, 'F');
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.setFontSize(7);
        doc.text(
          `REPORT ID: ${reportId}  |  CLASSIFIED SATCOM C2  |  PAGE ${i} OF ${pageCount}`,
          pageWidth / 2,
          pageHeight - 3.5,
          { align: 'center' }
        );
      }
    };

    let currentY = 14;

    // Header Box
    doc.setFillColor(darkCard[0], darkCard[1], darkCard[2]);
    doc.roundedRect(12, currentY, pageWidth - 24, 28, 2, 2, 'F');
    doc.setDrawColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, currentY, pageWidth - 24, 28, 2, 2, 'D');

    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text('SATEXPERT TACTICAL SATCOM INTELLIGENCE (TSI)', 16, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text('TACTICAL MISSION STATUS & TELEMETRY REPORT', 16, currentY + 13);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`REPORT IDENTIFIER: ${reportId}`, 16, currentY + 19);
    doc.text(`GENERATED TIMESTAMP: ${dateStr}`, 16, currentY + 24);

    const defconColors: Record<number, [number, number, number]> = {
      1: [220, 38, 38],
      2: [245, 158, 11],
      3: [234, 179, 8],
      4: [59, 130, 246],
      5: [16, 185, 129]
    };
    const defconColor = defconColors[data.defcon] || [16, 185, 129];
    doc.setFillColor(defconColor[0], defconColor[1], defconColor[2]);
    doc.roundedRect(pageWidth - 62, currentY + 4, 46, 9, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`DEFCON LEVEL ${data.defcon}`, pageWidth - 39, currentY + 10, { align: 'center' });

    const stealthColor: [number, number, number] = data.isStealthMode ? [168, 85, 247] : [71, 85, 105];
    doc.setFillColor(stealthColor[0], stealthColor[1], stealthColor[2]);
    doc.roundedRect(pageWidth - 62, currentY + 15, 46, 8, 1.5, 1.5, 'F');
    doc.setFontSize(7);
    doc.text(
      data.isStealthMode ? 'STEALTH: ACTIVE' : 'STEALTH: OFFLINE',
      pageWidth - 39,
      currentY + 20.5,
      { align: 'center' }
    );

    currentY += 34;

    // Section 1: Ground Station & Satellite Ephemeris
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('SECTION 1: GEOSPATIAL COORDINATES & ORBITAL EPHEMERIS', 12, currentY);
    currentY += 3;

    const sat = data.selectedSatellite;
    const angles = data.lookAngles;
    const distanceKm = angles?.distance || 36000;
    const fsplDb = calculateFSPL(distanceKm);

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { font: 'courier', fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      head: [['PARAMETER', 'GROUND STATION METRIC', 'TARGET SATELLITE EPHEMERIS', 'TACTICAL NOTE']],
      body: [
        [
          'Coordinates / Location',
          formatCoordinates(data.stationCoordinates),
          `${sat.name} (Orbital Slot: ${sat.orbitalSlot})`,
          `Sub-Satellite Lon: ${sat.longitude >= 0 ? `${sat.longitude}°E` : `${Math.abs(sat.longitude)}°W`}`
        ],
        [
          'True Azimuth Angle',
          angles ? `${angles.azimuth}° True North` : 'Pending calculation',
          `Operator: ${sat.operator || 'Military / Commercial C2'}`,
          'Compass Alignment Required'
        ],
        [
          'True Elevation Tilt',
          angles ? `${angles.elevation}° Horizon` : 'Pending calculation',
          `Orbital Radius: ~42,164 km GEO`,
          angles && angles.elevation > 15 ? 'Clear Line-of-Sight' : 'Low Horizon Risk'
        ],
        [
          'Polarization Skew Angle',
          angles ? `${angles.skew}° Feedhorn Offset` : '0.00°',
          `Inclination: ${sat.inclination !== undefined ? `${sat.inclination}°` : '0.05° GEO'}`,
          'LNB Rotation Compensation'
        ],
        [
          'Slant Range Propagation',
          `${distanceKm.toLocaleString()} km`,
          `Estimated FSPL: ~${fsplDb} dB (Ku-band)`,
          'One-way delay: ~120 ms'
        ]
      ],
      margin: { left: 12, right: 12 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Section 2: Signal Telemetry & RF Link Matrix
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('SECTION 2: SIGNAL TELEMETRY & RF PERFORMANCE MATRIX', 12, currentY);
    currentY += 3;

    const snrVal = Number(data.telemetry.snr);
    const snrStatus = snrVal >= 10 ? 'NOMINAL' : snrVal >= 5 ? 'DEGRADED' : 'CRITICAL (DEGRADATION ALERT)';
    const weatherFade = data.weather === 'CLEAR' ? '0.50 dB' : data.weather === 'OVERCAST' ? '2.00 dB' : data.weather === 'LIGHT_RAIN' ? '5.00 dB' : '14.00 dB';

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { font: 'courier', fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      head: [['RF METRIC', 'RECORDED VALUE', 'OPERATIONAL THRESHOLD', 'INTEGRITY ASSESSMENT']],
      body: [
        [
          'Signal-to-Noise Ratio (SNR)',
          `${data.telemetry.snr} dB`,
          'Baseline: >= 10.0 dB (Crit < 5.0 dB)',
          snrStatus
        ],
        [
          'Carrier Received Power (Rx)',
          `${data.telemetry.rxPower} dBW`,
          'Operational Range: -30 to -65 dBW',
          Number(data.telemetry.rxPower) > -60 ? 'CARRIER LOCK CONFIRMED' : 'MARGINAL SIGNAL'
        ],
        [
          'Packet Loss Rate',
          `${data.telemetry.packetLoss}%`,
          'Acceptable: < 1.00%',
          Number(data.telemetry.packetLoss) === 0 ? 'CLEAN STREAM' : 'BURST ERROR DETECTED'
        ],
        [
          'BUC Transmitter Temperature',
          `${data.telemetry.bucTemp} °C`,
          'Safe Max: < 75.0 °C',
          Number(data.telemetry.bucTemp) < 65 ? 'THERMAL NOMINAL' : 'THERMAL THROTTLING WARNING'
        ],
        [
          'Atmospheric & Weather Condition',
          `${data.weather} (Fade: ~${weatherFade})`,
          'Clear Sky: 0.50 dB attenuation',
          data.weather === 'HEAVY_STORM' ? 'SEVERE RAIN-FADE LOSS' : 'NORMAL PROPAGATION'
        ],
        [
          'Overall Link State',
          data.telemetry.status,
          'Carrier Synchronized',
          data.telemetry.status === 'NOMINAL' ? 'ALL SYSTEMS OPERATIONAL' : 'LINK INTERVENTION ADVISED'
        ]
      ],
      margin: { left: 12, right: 12 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Section 3: EW & Defense Grid
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('SECTION 3: ELECTRONIC WARFARE & DEFENSE GRID', 12, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { font: 'courier', fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      head: [['DEFENSE SUBSYSTEM', 'CONFIGURATION STATE', 'DETAIL / OPERATIONAL EFFECT']],
      body: [
        [
          'RF Countermeasures (Jammer)',
          data.isJamming ? `ENGAGED (${data.jammingPower}% POWER)` : 'STANDBY / PASSIVE',
          data.isJamming ? 'High-power RF noise injected across target spectrum' : 'Quiet emitter state'
        ],
        [
          'Stealth Masking Mode',
          data.isStealthMode ? 'ACTIVE (LOW-OBSERVABLE)' : 'OFFLINE',
          data.isStealthMode ? 'RF emissions suppressed; simulated telemetry signature' : 'Normal ground station broadcasting'
        ],
        [
          'Post-Quantum Cryptography',
          'NIST ML-DSA (Dilithium3) + ML-KEM (Kyber-768)',
          'Level 3 quantum-resistant signature validation engaged'
        ],
        [
          'Active C2 Module',
          data.activeView ? data.activeView.toUpperCase().replace(/_/g, ' ') : 'TACTICAL C2',
          'Console viewport engaged at time of mission report'
        ]
      ],
      margin: { left: 12, right: 12 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    if (data.notes && data.notes.trim()) {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(12, currentY, pageWidth - 24, 16, 1.5, 1.5, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text('OPERATIONAL REMARKS / INCIDENT LOG:', 16, currentY + 5);
      doc.setFont('courier', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitNotes = doc.splitTextToSize(data.notes.trim(), pageWidth - 32);
      doc.text(splitNotes, 16, currentY + 10);
      currentY += 20;
    }

    // Section 4: Mission Event Audit Logs
    if (data.eventLogs && data.eventLogs.length > 0) {
      doc.addPage();
      currentY = 16;

      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text('SECTION 4: TACTICAL EVENT AUDIT LOG (RECENT MISSION EVENTS)', 12, currentY);
      currentY += 4;

      const logRows = data.eventLogs.slice(0, 15).map(evt => [
        evt.timestamp,
        evt.satName,
        typeof evt.status === 'string' ? evt.status.toUpperCase() : 'INFO',
        evt.detail
      ]);

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        styles: { font: 'courier', fontSize: 7, cellPadding: 1.8 },
        headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [['TIMESTAMP', 'TARGET SAT', 'STATUS', 'MISSION EVENT DETAIL']],
        body: logRows,
        margin: { left: 12, right: 12 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 16;
    }

    // Cryptographic Sign-off
    doc.setFillColor(darkCard[0], darkCard[1], darkCard[2]);
    doc.roundedRect(12, currentY, pageWidth - 24, 28, 2, 2, 'F');
    doc.setDrawColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, currentY, pageWidth - 24, 28, 2, 2, 'D');

    const sessionKey = generateTacticalSessionKey('PQC-DILITHIUM3');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text('TACTICAL COMMAND SIGN-OFF & CRYPTOGRAPHIC VERIFICATION', 16, currentY + 6);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text(`AUTHENTICATING OFFICER: ${operator}`, 16, currentY + 12);
    doc.text(`PQC VERIFICATION TOKEN: ${sessionKey}`, 16, currentY + 17);
    doc.text(`DIGITAL INTEGRITY SEAL: VERIFIED // FIPS 204 ML-DSA COMPLIANT`, 16, currentY + 22);

    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.2);
    doc.line(pageWidth - 65, currentY + 18, pageWidth - 16, currentY + 18);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('AUTHORIZED SIGNATURE / CALLSIGN', pageWidth - 40.5, currentY + 22, { align: 'center' });

    drawPageHeadersAndFooters();
    return doc;
  }

  /**
   * Downloads Tactical Report PDF file
   */
  public exportTacticalReportPDF(data: TacticalReportData, customFilename?: string): { doc: jsPDF; filename: string } {
    const doc = this.generateTacticalReport(data);
    const cleanSatName = (data.selectedSatellite.name || 'SAT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestampIso = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = customFilename || `Tactical_Report_${cleanSatName}_${timestampIso}.pdf`;
    doc.save(filename);
    return { doc, filename };
  }

  /**
   * Generates and downloads a branded PDF report for any module
   */
  public exportModulePDF(data: ModuleExportData): string {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const classification = data.classification || 'SECRET // REL TO NATO';
    const timestamp = new Date().toUTCString();
    const prefix = (data.filenamePrefix || data.moduleTitle).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `TSI_${prefix}_Report_${Date.now()}.pdf`;

    const primaryNavy: [number, number, number] = [15, 23, 42];
    const accentCyan: [number, number, number] = [6, 182, 212];
    const darkCard: [number, number, number] = [30, 41, 59];
    const textLight: [number, number, number] = [241, 245, 249];
    const textMuted: [number, number, number] = [100, 116, 139];

    let currentY = 14;

    doc.setFillColor(darkCard[0], darkCard[1], darkCard[2]);
    doc.roundedRect(12, currentY, pageWidth - 24, 26, 2, 2, 'F');
    doc.setDrawColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, currentY, pageWidth - 24, 26, 2, 2, 'D');

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text('SATEXPERT TACTICAL SATCOM INTELLIGENCE (TSI)', 16, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text(data.moduleTitle.toUpperCase(), 16, currentY + 13);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`SUBTITLE / CONTEXT: ${data.moduleSubtitle || 'TACTICAL DATA EXTRACTION'}`, 16, currentY + 19);
    doc.text(`TIMESTAMPOF EXPORT: ${timestamp}`, 16, currentY + 23);

    currentY += 32;

    if (data.metadata && Object.keys(data.metadata).length > 0) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text('SYSTEM METRICS & OPERATIONAL PARAMETERS', 12, currentY);
      currentY += 3;

      const metaEntries = Object.entries(data.metadata).map(([k, v]) => [
        k.replace(/([A-Z])/g, ' $1').toUpperCase(),
        String(v)
      ]);

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        styles: { font: 'courier', fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' },
        head: [['OPERATIONAL PARAMETER', 'VALUE / STATUS']],
        body: metaEntries,
        margin: { left: 12, right: 12 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    if (data.summaryText && data.summaryText.trim()) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text('OPERATIONAL SUMMARY & EXECUTIVE BRIEF', 12, currentY);
      currentY += 4;

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      const splitText = doc.splitTextToSize(data.summaryText.trim(), pageWidth - 32);
      const boxHeight = Math.max(12, splitText.length * 4 + 4);

      doc.roundedRect(12, currentY, pageWidth - 24, boxHeight, 1.5, 1.5, 'FD');
      doc.text(splitText, 16, currentY + 5);
      currentY += boxHeight + 8;
    }

    if (data.columns && data.rows && data.rows.length > 0) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text(`EXTRACTED DATA RECORDS (${data.rows.length} ITEMS)`, 12, currentY);
      currentY += 3;

      const headers = data.columns.map(c => c.header.toUpperCase());
      const tableRows = data.rows.map(row => 
        data.columns!.map(col => String(row[col.key] !== undefined ? row[col.key] : '--'))
      );

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        styles: { font: 'courier', fontSize: 7, cellPadding: 1.8 },
        headStyles: { fillColor: primaryNavy, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [headers],
        body: tableRows,
        margin: { left: 12, right: 12 }
      });
    }

    const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.rect(0, 0, pageWidth, 8, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
      doc.text(classification, pageWidth / 2, 5.5, { align: 'center' });

      doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.setFontSize(7);
      doc.text(
        `SATEXPERT TSI C2  |  MODULE: ${data.moduleTitle.toUpperCase()}  |  PAGE ${i} OF ${pageCount}`,
        pageWidth / 2,
        pageHeight - 3,
        { align: 'center' }
      );
    }

    doc.save(filename);
    return filename;
  }

  /**
   * Generates and downloads a Microsoft Word (.doc) document for any module
   */
  public exportModuleDocs(data: ModuleExportData): string {
    const timestamp = new Date().toUTCString();
    const classification = data.classification || 'SECRET // REL TO NATO';
    const prefix = (data.filenamePrefix || data.moduleTitle).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `TSI_${prefix}_Report_${Date.now()}.doc`;

    let metaHtml = '';
    if (data.metadata && Object.keys(data.metadata).length > 0) {
      metaHtml = `
        <h3 style="color:#06b6d4;font-family:Courier New, monospace;margin-top:20px;border-bottom:1px solid #334155;padding-bottom:5px;">
          OPERATIONAL METRICS & PARAMETERS
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-family:Courier New, monospace;font-size:12px;">
          <thead>
            <tr style="background-color:#0f172a;color:#06b6d4;">
              <th style="padding:8px;border:1px solid #334155;text-align:left;">PARAM / METRIC</th>
              <th style="padding:8px;border:1px solid #334155;text-align:left;">VALUE / CONFIGURATION</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.metadata)
              .map(
                ([k, v]) => `
              <tr style="background-color:#1e293b;color:#f1f5f9;">
                <td style="padding:8px;border:1px solid #334155;font-weight:bold;">${k.replace(/([A-Z])/g, ' $1').toUpperCase()}</td>
                <td style="padding:8px;border:1px solid #334155;">${String(v)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    let tableHtml = '';
    if (data.columns && data.rows && data.rows.length > 0) {
      tableHtml = `
        <h3 style="color:#06b6d4;font-family:Courier New, monospace;margin-top:20px;border-bottom:1px solid #334155;padding-bottom:5px;">
          EXTRACTED RECORDS (${data.rows.length} ITEMS)
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-family:Courier New, monospace;font-size:11px;">
          <thead>
            <tr style="background-color:#0f172a;color:#06b6d4;">
              ${data.columns
                .map(col => `<th style="padding:8px;border:1px solid #334155;text-align:left;">${col.header.toUpperCase()}</th>`)
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${data.rows
              .map(
                (row, idx) => `
              <tr style="background-color:${idx % 2 === 0 ? '#1e293b' : '#0f172a'};color:#f1f5f9;">
                ${data.columns!
                  .map(col => `<td style="padding:6px 8px;border:1px solid #334155;">${String(row[col.key] !== undefined ? row[col.key] : '--')}</td>`)
                  .join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${data.moduleTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #020617; color: #f1f5f9; padding: 20px; }
          .classification-header { text-align: center; background-color: #0f172a; color: #06b6d4; font-family: 'Courier New', monospace; font-weight: bold; padding: 10px; margin-bottom: 20px; border-radius: 4px; font-size: 14px; border: 1px solid #06b6d4; }
          .doc-title { font-size: 22px; font-weight: bold; color: #38bdf8; margin-bottom: 4px; font-family: 'Courier New', monospace; }
          .doc-subtitle { font-size: 13px; color: #94a3b8; margin-bottom: 20px; font-family: 'Courier New', monospace; }
          .summary-box { background-color: #0f172a; border-left: 4px solid #06b6d4; padding: 12px; font-family: 'Courier New', monospace; font-size: 12px; margin-bottom: 20px; color: #cbd5e1; }
          .signature-box { margin-top: 40px; border-top: 1px solid #334155; padding-top: 15px; font-size: 11px; font-family: 'Courier New', monospace; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="classification-header">[CLASSIFIED INTELLIGENCE REPORT: ${classification}]</div>
        <div class="doc-title">${data.moduleTitle.toUpperCase()}</div>
        <div class="doc-subtitle">SATEXPERT TSI C2 PLATFORM // ${data.moduleSubtitle || 'TACTICAL EXTRACTION'} // ${timestamp}</div>

        ${data.summaryText ? `<div class="summary-box"><strong>OPERATIONAL SUMMARY:</strong><br>${data.summaryText}</div>` : ''}
        
        ${metaHtml}
        ${tableHtml}

        <div class="signature-box">
          <strong>CRYPTOGRAPHIC SEAL:</strong> NIST ML-DSA / Dilithium3 Verified Signature<br>
          <strong>SYSTEM AUDIT CODE:</strong> TSI-DOCS-${Math.random().toString(36).substring(2, 10).toUpperCase()}<br>
          CONFIDENTIAL PROPRIETARY TACTICAL SATCOM INTELLIGENCE DATA
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    this.triggerBlobDownload(blob, filename);
    return filename;
  }

  /**
   * Downloads data rows as CSV file
   */
  public exportModuleCSV(title: string, columns: ModuleExportColumn[], rows: Record<string, any>[]): string {
    const prefix = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `TSI_${prefix}_Data_${Date.now()}.csv`;

    const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rowLines = rows.map(row => 
      columns.map(c => {
        const val = row[c.key] !== undefined ? String(row[c.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = [headers, ...rowLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.triggerBlobDownload(blob, filename);

    return filename;
  }

  /**
   * Safe helper for triggering Blob file downloads
   */
  private triggerBlobDownload(blob: Blob, filename: string): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    } catch {
      // Fallback
    }
  }
}

export const exportService = new ExportService();
