import React, { useState } from 'react';
import { Newspaper, Info, Search, RefreshCw, Send, ShieldAlert, Link } from 'lucide-react';

interface FeedItem {
  id: string;
  source: 'SPACE_SEC' | 'SWEATH' | 'INTELL';
  title: string;
  summary: string;
  date: string;
  severity: 'CRITICAL' | 'MEDIUM' | 'INFO';
}

const BULLETIN_ITEMS: FeedItem[] = [
  {
    id: '1',
    source: 'SPACE_SEC',
    title: 'Anomalous Ku-Band Power Spike observed in Pacific sector',
    summary: 'Spectral defense radars captured unauthorized sweeps targetting commercial maritime transceivers. S-Band links remained nominal.',
    date: '2026-05-20 02:15',
    severity: 'CRITICAL'
  },
  {
    id: '2',
    source: 'SWEATH',
    title: 'Solar Flare Alert - M3.4 class coronal mass ejection heading towards Earth orbit',
    summary: 'Expect higher atmospheric attenuation and moderate ionospheric scintillation across L-Band frequencies over the next 24 hours.',
    date: '2026-05-19 18:40',
    severity: 'MEDIUM'
  },
  {
    id: '3',
    source: 'INTELL',
    title: 'Regional APT-41 targeting space payload software pipelines',
    summary: 'Mitigation bulletin issued for all operators managing VSAT firmware nodes. Inject specialized honeypots and rigid custom YARA checkers.',
    date: '2026-05-19 12:10',
    severity: 'CRITICAL'
  },
  {
    id: '4',
    source: 'SPACE_SEC',
    title: 'Starlink constellation firmware lock successfully deployed',
    summary: 'Upstream nodes now benefit from reinforced quantum entropy key handshakes. Zero packet drift reported across pilot groups.',
    date: '2026-05-18 09:30',
    severity: 'INFO'
  },
];

export const RSSReader: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'SPACE_SEC' | 'SWEATH' | 'INTELL'>('ALL');
  const [search, setSearch] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [customItems, setCustomItems] = useState<FeedItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAggregateFeed = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
    }, 800);
  };

  const handlePostBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle) return;

    const newItem: FeedItem = {
      id: Math.random().toString(),
      source: 'SPACE_SEC',
      title: customTitle,
      summary: customSummary || 'Manual operator telemetry dispatch recorded in terminal space workspace.',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      severity: 'INFO',
    };

    setCustomItems(prev => [newItem, ...prev]);
    setCustomTitle('');
    setCustomSummary('');
  };

  const allItems = [...customItems, ...BULLETIN_ITEMS];

  const filteredItems = allItems.filter(item => {
    const sourceMatches = filter === 'ALL' || item.source === filter;
    const textMatches = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        item.summary.toLowerCase().includes(search.toLowerCase());
    return sourceMatches && textMatches;
  });

  return (
    <div className="p-6 bg-slate-950 border-2 border-slate-900 rounded-3xl text-slate-100 flex flex-col space-y-6 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <Newspaper className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">Satellite Intel Reader & RSS Feed</h3>
            <p className="text-[10px] text-slate-500 font-mono">Aggregated secure tactical updates, solar weather bulletins, and cyber threat vectors</p>
          </div>
        </div>
        <button
          onClick={handleAggregateFeed}
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Newsfeed List & Filters */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            {/* Source selects */}
            <div className="flex gap-1">
              {['ALL', 'SPACE_SEC', 'SWEATH', 'INTELL'].map((src) => (
                <button
                  key={src}
                  onClick={() => setFilter(src as any)}
                  className={`px-2.5 py-1 rounded-lg border text-[8px] font-bold font-mono transition ${
                    filter === src
                      ? 'bg-purple-950/40 border-purple-500 text-purple-400'
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>

            {/* Search inputs */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search feeds..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black border border-slate-900 rounded-xl px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500 w-full sm:w-40"
              />
              <Search className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
            {filteredItems.length === 0 ? (
              <div className="text-slate-600 italic text-center text-xs py-12 uppercase tracking-wider">No matching feeds found...</div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-slate-950/45 border border-slate-900 p-4 rounded-2xl space-y-2 hover:border-slate-800 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                      {item.source}
                    </span>
                    <span className="text-[7.5px] font-mono text-slate-500 leading-none">{item.date}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 uppercase">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed">{item.summary}</p>

                  <div className="flex items-center justify-between text-[7px] font-mono pt-1">
                    <span className="text-slate-600">SEVERITY LEVEL</span>
                    <span className={`font-black ${
                      item.severity === 'CRITICAL' ? 'text-red-500 animate-pulse' : item.severity === 'MEDIUM' ? 'text-amber-500' : 'text-cyan-400'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dispatch center: post custom bulletin */}
        <div className="lg:col-span-5 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between">
          <form onSubmit={handlePostBulletin} className="space-y-4">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
              <span>Broadcast Custom Warning</span>
            </span>

            <div className="flex flex-col space-y-1">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Warning Stream Title</label>
              <input
                type="text"
                placeholder="e.g. Spectral interference on Ku-Band"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
                className="bg-black border border-slate-900 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[7px] font-mono text-slate-500 uppercase">Summary details</label>
              <textarea
                placeholder="Details of the anomaly..."
                rows={4}
                value={customSummary}
                onChange={(e) => setCustomSummary(e.target.value)}
                className="bg-black border border-slate-900 rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 py-2 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider transition flex items-center justify-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Bulletin</span>
            </button>
          </form>

          <div className="border-t border-slate-900 pt-3 flex items-center gap-2 text-[7.5px] font-mono text-slate-600 uppercase">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Feed locks secured over post-quantum Dilithium channels</span>
          </div>
        </div>

      </div>
    </div>
  );
};
